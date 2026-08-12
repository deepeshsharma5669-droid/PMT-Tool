// Server-only. Single source of truth for who the caller is and what they're allowed to do.
//
// Never trust caller-supplied role, department, user id, or stage id — every guard
// re-resolves the caller from the Supabase session and re-loads the target record
// from the database.
//
// Phase 1 scope: Admin, Manager, Member only. Client authorization is intentionally
// not implemented here yet.

import 'server-only'
import { createClient } from './supabase/server'

export type PmtRole = 'Admin' | 'Manager' | 'Member'

export type PmtUser = {
  authUserId: string
  email: string
  managerId: number        // managers.id (the PMT-side identity)
  name: string             // managers.name — used to match deliverable_stages.assignee (text)
  role: PmtRole
  department: string | null  // null for Admin; required for Manager/Member
}

export class AuthError extends Error {
  status: number
  constructor(message: string, status = 403) {
    super(message)
    this.name = 'AuthError'
    this.status = status
  }
}

/** Reads the caller's Supabase session, joins to the managers row by email,
 *  and returns a validated PmtUser or null. Only roles Admin/Manager/Member
 *  are recognised in Phase 1. */
export async function getCurrentUser(): Promise<PmtUser | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) return null

  const { data: mgr } = await supabase
    .from('managers')
    .select('id, name, email, role, department')
    .eq('email', user.email)
    .maybeSingle()

  if (!mgr) return null
  if (mgr.role !== 'Admin' && mgr.role !== 'Manager' && mgr.role !== 'Member') return null

  return {
    authUserId: user.id,
    email: user.email,
    managerId: mgr.id,
    name: mgr.name,
    role: mgr.role,
    department: mgr.department,
  }
}

export async function requireUser(): Promise<PmtUser> {
  const u = await getCurrentUser()
  if (!u) throw new AuthError('Not signed in', 401)
  return u
}

export async function requireAdmin(): Promise<PmtUser> {
  const u = await requireUser()
  if (u.role !== 'Admin') throw new AuthError('Admin only')
  return u
}

type StageRecord = {
  id: number
  deliverable_id: number
  stage_name: string
  status: string
  assignee: string | null
  department: string | null
  revision_count: number | null
}

type ResolvedStage = {
  stage: StageRecord
  department: string | null   // authoritative department, falling back to the sequence
}

/** Loads a stage and returns the department authoritatively. Falls back to the
 *  sequence definition when deliverable_stages.department is null, which is the
 *  case for existing production data. */
async function loadStage(stageId: number): Promise<ResolvedStage | null> {
  const supabase = await createClient()
  const { data: stage } = await supabase
    .from('deliverable_stages')
    .select('id, deliverable_id, stage_name, status, assignee, department, revision_count')
    .eq('id', stageId)
    .maybeSingle()
  if (!stage) return null

  if (stage.department) return { stage, department: stage.department }

  // Fallback: department from sequence_stages, matched by stage_name within the deliverable's sequence.
  const { data: deliv } = await supabase
    .from('deliverables')
    .select('sequence_id')
    .eq('id', stage.deliverable_id)
    .maybeSingle()
  if (!deliv?.sequence_id) return { stage, department: null }

  const { data: seqStage } = await supabase
    .from('sequence_stages')
    .select('department')
    .eq('sequence_id', deliv.sequence_id)
    .eq('stage_name', stage.stage_name)
    .maybeSingle()

  return { stage, department: seqStage?.department ?? null }
}

/** Manager/Admin actions on a specific stage: assign, approve, send-back, reassign.
 *  Admin: allowed for any stage.
 *  Manager: allowed only if the stage's authoritative department matches theirs.
 *  Member: never allowed here (Members submit their own work, see requireStageSubmitAccess).
 */
export async function requireStageAccessAsManagerOrAdmin(stageId: number): Promise<{ user: PmtUser; stage: StageRecord; department: string | null }> {
  const user = await requireUser()
  if (user.role === 'Member') throw new AuthError('Managers/Admins only for this action')

  const resolved = await loadStage(stageId)
  if (!resolved) throw new AuthError('Stage not found', 404)

  if (user.role === 'Admin') return { user, stage: resolved.stage, department: resolved.department }

  // Manager
  if (!resolved.department) throw new AuthError('Stage has no department set; contact an admin')
  if (user.department !== resolved.department) throw new AuthError('Not your department')
  return { user, stage: resolved.stage, department: resolved.department }
}

/** Member submits their own stage → manager_review.
 *  Also allowed: the department Manager (they can submit on behalf of the team),
 *  and Admin (blanket).
 */
export async function requireStageSubmitAccess(stageId: number): Promise<{ user: PmtUser; stage: StageRecord; department: string | null }> {
  const user = await requireUser()
  const resolved = await loadStage(stageId)
  if (!resolved) throw new AuthError('Stage not found', 404)

  if (user.role === 'Admin') return { user, stage: resolved.stage, department: resolved.department }

  if (user.role === 'Manager') {
    if (!resolved.department) throw new AuthError('Stage has no department set; contact an admin')
    if (user.department !== resolved.department) throw new AuthError('Not your department')
    return { user, stage: resolved.stage, department: resolved.department }
  }

  // Member: must be the assignee. Uses the text-based assignee convention that already exists
  // in the schema (deliverable_stages.assignee is a text column; no user_id FK yet).
  if (!resolved.stage.assignee || resolved.stage.assignee !== user.name) {
    throw new AuthError('Not your task')
  }
  // Also enforce that the Member's department matches (defence-in-depth: a Design Member
  // should never end up assigned to a Content stage).
  if (resolved.department && user.department && resolved.department !== user.department) {
    throw new AuthError('Task department does not match your department')
  }
  return { user, stage: resolved.stage, department: resolved.department }
}

/** Verifies that `memberName` is a real Member row in `department`. Used when a
 *  Manager assigns work — prevents assigning arbitrary strings. */
export async function assertMemberInDepartment(memberName: string, department: string): Promise<void> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('managers')
    .select('id')
    .eq('name', memberName)
    .eq('department', department)
    .eq('role', 'Member')
    .maybeSingle()
  if (!data) throw new AuthError('Assignee must be a Member of this department')
}
