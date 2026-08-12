import { createClient } from './supabase/server'

export type ManagerContext = { name: string; department: string; email: string } | null

/** Reads the logged-in user's email from their Supabase session and looks up
 *  their name/department in managers. This is what makes every Manager page
 *  scoped to whoever is actually signed in, instead of a hardcoded person. */
export async function getCurrentManager(): Promise<ManagerContext> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) return null

  const { data } = await supabase
    .from('managers')
    .select('name, department, email')
    .eq('email', user.email)
    .maybeSingle()

  if (!data) return null
  return { name: data.name, department: data.department, email: data.email }
}

export type StageRow = {
  id: number
  deliverableId: number
  stageName: string
  status: string
  revisionCount: number
  note: string | null
  stageOrder: number
  department: string | null
  assignee: string | null
}

export type DeliverableRow = {
  id: number
  name: string
  contentFormat: string
  stages: StageRow[]
}

export type CampaignRow = {
  projectId: number
  projectName: string
  clientName: string
  status: string
  timeScale: string | null
  startDate: string | null
  deliverables: DeliverableRow[]
}

/** Every campaign with at least one deliverable_stage in this department.
 *  Each deliverable carries its FULL stage chain (not just this department's
 *  stage) so a manager sees the whole pipeline for context, matching how the
 *  UI was designed — only their own stage is ever editable. */
export async function getManagerCampaigns(department: string): Promise<CampaignRow[]> {
  const supabase = await createClient()

  const { data: myStages } = await supabase
    .from('deliverable_stages')
    .select('deliverable_id')
    .eq('department', department)

  const deliverableIds = Array.from(new Set((myStages ?? []).map(s => s.deliverable_id)))
  if (deliverableIds.length === 0) return []

  const { data: deliverables } = await supabase
    .from('deliverables')
    .select('id, name, content_format, project_id')
    .in('id', deliverableIds)

  const projectIds = Array.from(new Set((deliverables ?? []).map(d => d.project_id)))
  if (projectIds.length === 0) return []

  const { data: projects } = await supabase
    .from('projects')
    .select('id, project_name, client_name, status, time_scale, start_date')
    .in('id', projectIds)

  const { data: allStages } = await supabase
    .from('deliverable_stages')
    .select('*')
    .in('deliverable_id', deliverableIds)
    .order('stage_order')

  const stagesByDeliverable = new Map<number, StageRow[]>()
  ;(allStages ?? []).forEach(s => {
    const list = stagesByDeliverable.get(s.deliverable_id) ?? []
    list.push({
      id: s.id,
      deliverableId: s.deliverable_id,
      stageName: s.stage_name,
      status: s.status,
      revisionCount: s.revision_count ?? 0,
      note: s.note,
      stageOrder: s.stage_order,
      department: s.department,
      assignee: s.assignee,
    })
    stagesByDeliverable.set(s.deliverable_id, list)
  })

  const deliverablesByProject = new Map<number, DeliverableRow[]>()
  ;(deliverables ?? []).forEach(d => {
    const list = deliverablesByProject.get(d.project_id) ?? []
    list.push({
      id: d.id,
      name: d.name,
      contentFormat: d.content_format,
      stages: stagesByDeliverable.get(d.id) ?? [],
    })
    deliverablesByProject.set(d.project_id, list)
  })

  return (projects ?? []).map(p => ({
    projectId: p.id,
    projectName: p.project_name,
    clientName: p.client_name,
    status: p.status,
    timeScale: p.time_scale,
    startDate: p.start_date,
    deliverables: deliverablesByProject.get(p.id) ?? [],
  }))
}

export async function getManagerCampaignById(department: string, projectId: number): Promise<CampaignRow | null> {
  const campaigns = await getManagerCampaigns(department)
  return campaigns.find(c => c.projectId === projectId) ?? null
}

/** The one stage within a deliverable's chain that belongs to this department. */
export function findMyStage(deliverable: DeliverableRow, department: string): StageRow | undefined {
  return deliverable.stages.find(s => s.department === department)
}

export async function getManagerTeam(department: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('managers')
    .select('id, name, email, role')
    .eq('department', department)
    .eq('role', 'Member')
    .order('name')
  return data ?? []
}

/** Open (not-yet-complete) stage counts per person, for the Workload table. */
export async function getManagerTeamWorkload(department: string) {
  const supabase = await createClient()
  const team = await getManagerTeam(department)

  const { data: stages } = await supabase
    .from('deliverable_stages')
    .select('assignee, status')
    .eq('department', department)

  return team.map(member => {
    const openCount = (stages ?? []).filter(s => s.assignee === member.name && s.status !== 'complete').length
    return { ...member, openCount }
  })
}