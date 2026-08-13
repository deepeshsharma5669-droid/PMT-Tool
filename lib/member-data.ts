// Server-only. Data layer for the Member portal (Phase 5).
//
// Authorization model:
//   * All ownership is derived from the CURRENT Supabase session's authUserId,
//     matched against deliverable_stages.assignee_user_id.
//   * We never trust caller-supplied stage ids, names, or role hints.
//   * We never fall back to the legacy `assignee` text column for auth
//     decisions — that column exists only for compatibility with existing
//     Manager views.
//
// Section labels (Phase 5 §6, §7, §12, §17):
//   DB status         Member section          UI label
//   ────────────────────────────────────────────────────
//   pending           My Tasks                Not Started
//   in_progress       My Tasks                In Progress
//   feedback          My Tasks                Rework Needed
//   manager_review    Under Review            Pending Review
//   client_review     Under Review            With Client
//   complete          Completed Projects      Approved

import 'server-only'
import { createClient } from './supabase/server'
import { getCurrentUser, AuthError, type PmtUser } from './auth'

export type MemberTaskRow = {
  stageId: number
  deliverableId: number
  projectId: number
  clientName: string
  campaignName: string
  deliverableName: string
  stageName: string
  status: string        // raw DB status
  uiLabel: string       // presentation label per §17
  note: string | null
  revisionCount: number
  stageOrder: number
  updatedAt: string | null
}

export type MemberStats = {
  clientsWorkedWith: number
  campaigns: { total: number; active: number; completed: number }
  overallTasks: { total: number; active: number; completed: number }
  pendingApprovals: number
}

const UI_LABEL: Record<string, string> = {
  pending: 'Not Started',
  in_progress: 'In Progress',
  feedback: 'Rework Needed',
  manager_review: 'Pending Review',
  client_review: 'With Client',
  complete: 'Approved',
  hold: 'On Hold',
}

/** Presentation label for a DB status. Does NOT change DB semantics. */
export function memberUiLabel(status: string): string {
  return UI_LABEL[status] ?? status
}

/** Guard: the caller must be a signed-in Member. Admin/Manager cannot call
 *  the Member data layer — they have their own dashboards. */
export async function requireMember(): Promise<PmtUser> {
  const u = await getCurrentUser()
  if (!u) throw new AuthError('Not signed in', 401)
  if (u.role !== 'Member') throw new AuthError('Member only')
  return u
}

/** Load every stage owned by the current Member (via assignee_user_id), plus
 *  the joined deliverable / project / client_name. Returns an in-memory
 *  denormalised list. Callers filter for My Tasks / Under Review / Completed.
 *
 *  One-shot batched query pattern (avoids N+1):
 *    1) stages by assignee_user_id
 *    2) deliverables IN (stage.deliverable_id)
 *    3) projects   IN (deliverable.project_id)
 */
async function loadOwnedStages(authUserId: string): Promise<MemberTaskRow[]> {
  const supabase = await createClient()

  const { data: stages, error: sErr } = await supabase
    .from('deliverable_stages')
    .select('id, deliverable_id, stage_name, status, note, revision_count, stage_order, updated_at')
    .eq('assignee_user_id', authUserId)
    .order('updated_at', { ascending: false })

  if (sErr) {
    console.error('loadOwnedStages: stages query failed', sErr)
    return []
  }
  if (!stages || stages.length === 0) return []

  const deliverableIds = Array.from(new Set(stages.map(s => s.deliverable_id)))

  const { data: delivs } = await supabase
    .from('deliverables')
    .select('id, name, project_id')
    .in('id', deliverableIds)

  const projectIds = Array.from(new Set((delivs ?? []).map(d => d.project_id)))

  const { data: projects } = projectIds.length
    ? await supabase
        .from('projects')
        .select('id, project_name, client_name')
        .in('id', projectIds)
    : { data: [] as { id: number; project_name: string; client_name: string }[] }

  const delivById = new Map((delivs ?? []).map(d => [d.id, d]))
  const projById = new Map((projects ?? []).map(p => [p.id, p]))

  return stages.map(s => {
    const d = delivById.get(s.deliverable_id)
    const p = d ? projById.get(d.project_id) : null
    return {
      stageId: s.id,
      deliverableId: s.deliverable_id,
      projectId: d?.project_id ?? -1,
      clientName: p?.client_name ?? '—',
      campaignName: p?.project_name ?? '—',
      deliverableName: d?.name ?? '—',
      stageName: s.stage_name,
      status: s.status,
      uiLabel: memberUiLabel(s.status),
      note: s.note,
      revisionCount: s.revision_count ?? 0,
      stageOrder: s.stage_order,
      updatedAt: s.updated_at,
    }
  })
}

/** My Tasks — stages the Member still has to act on. */
export async function getMyTasks(): Promise<MemberTaskRow[]> {
  const me = await requireMember()
  const all = await loadOwnedStages(me.authUserId)
  const actionable = new Set(['pending', 'in_progress', 'feedback'])
  return all.filter(t => actionable.has(t.status))
}

/** Under Review — Member's work handed off and awaiting downstream review. */
export async function getMyUnderReview(): Promise<MemberTaskRow[]> {
  const me = await requireMember()
  const all = await loadOwnedStages(me.authUserId)
  const inReview = new Set(['manager_review', 'client_review'])
  return all.filter(t => inReview.has(t.status))
}

/** Completed Projects — stages the Member has finished. */
export async function getMyCompletedProjects(): Promise<MemberTaskRow[]> {
  const me = await requireMember()
  const all = await loadOwnedStages(me.authUserId)
  return all.filter(t => t.status === 'complete')
}

/** KPI formulas (see file header):
 *   clientsWorkedWith  = distinct project.client_name across all owned stages
 *   campaigns          = distinct project_id; active = has any non-complete stage
 *   overallTasks       = total owned stages; active = status != complete
 *   pendingApprovals   = owned stages currently in manager_review
 */
export async function getMyStats(): Promise<MemberStats> {
  const me = await requireMember()
  const all = await loadOwnedStages(me.authUserId)

  const clients = new Set<string>()
  const projectStatus = new Map<number, { hasActive: boolean; allComplete: boolean }>()
  let active = 0
  let completed = 0
  let pending = 0

  for (const t of all) {
    if (t.clientName && t.clientName !== '—') clients.add(t.clientName)
    if (t.projectId !== -1) {
      const s = projectStatus.get(t.projectId) ?? { hasActive: false, allComplete: true }
      if (t.status !== 'complete') { s.hasActive = true; s.allComplete = false }
      projectStatus.set(t.projectId, s)
    }
    if (t.status === 'complete') completed++
    else active++
    if (t.status === 'manager_review') pending++
  }

  let activeCampaigns = 0
  let completedCampaigns = 0
  for (const s of projectStatus.values()) {
    if (s.hasActive) activeCampaigns++
    else if (s.allComplete) completedCampaigns++
  }

  return {
    clientsWorkedWith: clients.size,
    campaigns: {
      total: projectStatus.size,
      active: activeCampaigns,
      completed: completedCampaigns,
    },
    overallTasks: {
      total: all.length,
      active,
      completed,
    },
    pendingApprovals: pending,
  }
}

/** Ownership guard used by Member server actions. Loads the stage and
 *  confirms `stage.assignee_user_id === me.authUserId`. Never trusts the
 *  URL / caller-supplied stage id alone. Never leaks another Member's
 *  stage existence — a wrong id looks identical to a not-yours id. */
export async function requireStageOwnership(stageId: number): Promise<{
  user: PmtUser
  stage: {
    id: number
    deliverable_id: number
    stage_name: string
    status: string
    assignee_user_id: string | null
    revision_count: number | null
    note: string | null
  }
}> {
  const me = await requireMember()
  const supabase = await createClient()
  const { data: stage } = await supabase
    .from('deliverable_stages')
    .select('id, deliverable_id, stage_name, status, assignee_user_id, revision_count, note')
    .eq('id', stageId)
    .maybeSingle()
  if (!stage || stage.assignee_user_id !== me.authUserId) {
    throw new AuthError('Not your task', 404)
  }
  return { user: me, stage }
}
