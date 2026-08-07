import { createClient } from './supabase/server'
import { users } from './data/mock-users'
import {
  systemStats, escalations, managerEfficiency,
  stageBottlenecks, agingWork, onTimeTrend, skillGaps,
  teamToday, pipelineStages
} from './data/mock-overview'
import type { Project } from './data/mock-projects'
import { leaveRequests } from './data/mock-leave'


export async function getClients() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .order('name')

  if (error) {
    console.error('getClients error:', error)
    throw new Error(error.message)
  }

  return data ?? []
}

export async function createClient_DB(name: string, accountManager: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('clients')
    .insert({ name, account_manager: accountManager })
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data
}

export async function createProject(input: {
  projectName: string
  clientId: number
  contentFormat: string
  startDate: string
  endDate: string | null
  deliverables: { name: string; type: string }[]
}) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('projects')
    .insert({
      project_name: input.projectName,
      client_id: input.clientId,
      content_format: input.contentFormat,
      start_date: input.startDate,
      end_date: input.endDate,
      status: 'New',
      manager: [],
      assignee: [],
      priority: 'Medium',
      time_scale: null,
      completion_percent: 0,
      deliverables: input.deliverables.length,
    })
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data
}

export async function getUsers() {
  return users
}

export async function getSystemOverview() {
  return { stats: systemStats, escalations }
}

export async function getManagerEfficiency() {
  return managerEfficiency
}

export async function getStageBottlenecks() {
  return stageBottlenecks
}

export async function getClientHealth() {
  const projects = await getAllProjects()
  const clientNames = Array.from(new Set(projects.map(p => p.clientName)))

  return clientNames.map(name => {
    const clientProjects = projects.filter(p => p.clientName === name)
    const timed = clientProjects.filter(p => p.timeScale !== null)
    const onTimePercent = timed.length
      ? Math.round((timed.filter(p => p.timeScale === 'On-Time').length / timed.length) * 100)
      : 100

    const droppedScrapped = clientProjects.filter(p => p.status === 'Dropped' || p.status === 'Scrapped').length
    const droppedPercent = clientProjects.length ? (droppedScrapped / clientProjects.length) * 100 : 0

    const healthScore = Math.max(0, Math.min(100, Math.round(onTimePercent - droppedPercent)))

    return {
      client: name,
      healthScore,
      trend: 'flat' as const,
      avgRevisions: 0,
      renewalDate: '—',
    }
  })
}

export async function getAgingWork() {
  return agingWork
}

export async function getOnTimeTrend() {
  return onTimeTrend
}

export async function getSkillGaps() {
  return skillGaps
}

const CLIENT_BLOCKING_STATUSES = [
  'Client Approval Pending', 'Under Client Review', 'Awaiting client approval', 'On Hold'
]
const CLOSED_STATUSES = ['Delivered', 'Raised Invoice', 'Ready for Invoice', 'Dropped', 'Scrapped', 'Completed']

function daysSince(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  return Math.floor(diff / (1000 * 60 * 60 * 24))
}

export async function getClientRollup() {
  const projects = await getAllProjects()
  const clientNames = Array.from(new Set(projects.map(p => p.clientName)))

  return clientNames.map(name => {
    const clientProjects = projects.filter(p => p.clientName === name)
    const total = clientProjects.length

    const timedProjects = clientProjects.filter(p => p.timeScale !== null)
    const onTimeCount = timedProjects.filter(p => p.timeScale === 'On-Time').length
    const onTimePercent = timedProjects.length ? Math.round((onTimeCount / timedProjects.length) * 100) : null

    const avgCompletion = total
      ? Math.round((clientProjects.reduce((sum, p) => sum + p.completionPercent, 0) / total) * 10) / 10
      : 0

    const activeCount = clientProjects.filter(p => !CLOSED_STATUSES.includes(p.status)).length
    const closedCount = total - activeCount

    const droppedScrappedCount = clientProjects.filter(p => p.status === 'Dropped' || p.status === 'Scrapped').length
    const droppedScrappedPercent = total ? Math.round((droppedScrappedCount / total) * 100) : 0

    const managers = Array.from(new Set(clientProjects.flatMap(p => p.manager)))

    return {
      client: name,
      totalProjects: total,
      onTimePercent,
      avgCompletion,
      activeCount,
      closedCount,
      droppedScrappedPercent,
      managers,
    }
  })
}

export async function getClientBlockingBreakdown() {
  const projects = await getAllProjects()
  const clientNames = Array.from(new Set(projects.map(p => p.clientName)))

  return clientNames.map(name => {
    const clientProjects = projects.filter(p => p.clientName === name)
    const blocking = clientProjects.filter(p => CLIENT_BLOCKING_STATUSES.includes(p.status))
    const byStatus: Record<string, number> = {}
    blocking.forEach(p => {
      byStatus[p.status] = (byStatus[p.status] || 0) + 1
    })
    return {
      client: name,
      blockingCount: blocking.length,
      byStatus,
    }
  }).filter(c => c.blockingCount > 0)
}

export async function getProjectsByClient(clientName: string) {
  const projects = await getAllProjects()
  return projects.filter(p => p.clientName === clientName)
}

export async function getAgingProjectsByClient(clientName: string) {
  const projects = await getAllProjects()
  const clientProjects = projects.filter(
    p => p.clientName === clientName && !CLOSED_STATUSES.includes(p.status)
  )
  return clientProjects
    .map(p => ({ ...p, daysOpen: daysSince(p.startDate) }))
    .sort((a, b) => b.daysOpen - a.daysOpen)
}

export async function getLeaveRequests() {
  return leaveRequests
}

export async function getTeamToday() {
  return teamToday
}

export async function getPipelineStages() {
  return pipelineStages
}

export async function getLeaveKpis() {
  const now = new Date('2026-08-04')
  const currentMonth = now.getMonth()
  const currentYear = now.getFullYear()

  const thisMonthRequests = leaveRequests.filter(r => {
    const d = new Date(r.startDate)
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear
  })

  const approvedThisMonth = thisMonthRequests.filter(r => r.status === 'Approved')
  const pendingThisMonth = thisMonthRequests.filter(r => r.status === 'Pending')
  const rejectedThisMonth = thisMonthRequests.filter(r => r.status === 'Rejected')

  const totalDaysApproved = approvedThisMonth.reduce((sum, r) => sum + r.daysApplied, 0)
  const totalDaysPending = pendingThisMonth.reduce((sum, r) => sum + r.daysApplied, 0)

  const onLeaveNow = leaveRequests.filter(r => {
    const start = new Date(r.startDate)
    const end = new Date(r.endDate)
    return r.status === 'Approved' && start <= now && end >= now
  })

  const byDepartment: Record<string, { approved: number; pending: number }> = {}
  thisMonthRequests.forEach(r => {
    if (!byDepartment[r.department]) byDepartment[r.department] = { approved: 0, pending: 0 }
    if (r.status === 'Approved') byDepartment[r.department].approved++
    if (r.status === 'Pending') byDepartment[r.department].pending++
  })

  return {
    totalRequestsThisMonth: thisMonthRequests.length,
    approvedCount: approvedThisMonth.length,
    pendingCount: pendingThisMonth.length,
    rejectedCount: rejectedThisMonth.length,
    totalDaysApproved,
    totalDaysPending,
    onLeaveNow,
    byDepartment,
  }
}

export async function getTeamRoster() {
  const projects = await getAllProjects()
  const managersList = await getManagers()
  const deptByName: Record<string, string> = {}
  managersList.forEach(m => { deptByName[m.name] = m.department })

  const allNames = new Set<string>()
  projects.forEach(p => {
    p.manager.forEach(m => allNames.add(m))
    p.assignee.forEach(a => allNames.add(a))
  })

  const roster = Array.from(allNames).map(name => {
    const asManager = projects.filter(p => p.manager.includes(name))
    const asAssignee = projects.filter(p => p.assignee.includes(name))

    const inferredRole = asManager.length > 0 && asAssignee.length === 0
      ? 'Manager'
      : asAssignee.length > 0 && asManager.length === 0
      ? 'Member'
      : 'Manager'

    const openProjects = [...new Set([...asManager, ...asAssignee])].filter(
      p => !['Delivered', 'Raised Invoice', 'Ready for Invoice', 'Dropped', 'Scrapped', 'Completed'].includes(p.status)
    )

    const clients = Array.from(new Set([...asManager, ...asAssignee].map(p => p.clientName)))

    return {
      name,
      role: inferredRole,
      department: deptByName[name] ?? '—',
      managerOfCount: asManager.length,
      assigneeOfCount: asAssignee.length,
      openProjectCount: openProjects.length,
      clients,
    }
  })

  return roster.sort((a, b) => b.openProjectCount - a.openProjectCount)
}

export async function getUserKpis() {
  const roster = await getTeamRoster()
  const totalUsers = roster.length
  const managers = roster.filter(u => u.role === 'Manager').length
  const members = roster.filter(u => u.role === 'Member').length
  const overloaded = roster.filter(u => u.openProjectCount > 5).length
  const idle = roster.filter(u => u.openProjectCount === 0).length

  return { totalUsers, managers, members, overloaded, idle }
}

const DEMO_CLIENT_NAME = 'ICICI Prudential Mutual Fund'
const DEMO_CLIENT_POC = 'Anjali Nair'

export async function getClientPortalData() {
  const clientProjects = await getProjectsByClient(DEMO_CLIENT_NAME)
  const rollup = await getClientRollup()
  const summary = rollup.find(c => c.client === DEMO_CLIENT_NAME)

  const pendingApproval = clientProjects.filter(p =>
    ['Client Approval Pending', 'Under Client Review', 'Awaiting client approval'].includes(p.status)
  )

  const active = clientProjects.filter(
    p => !['Delivered', 'Raised Invoice', 'Ready for Invoice', 'Dropped', 'Scrapped', 'Completed'].includes(p.status)
  )

  return {
    clientName: DEMO_CLIENT_NAME,
    poc: DEMO_CLIENT_POC,
    summary,
    activeProjects: active,
    pendingApproval,
  }
}

export async function getSequences() {
  const supabase = await createClient()
  const { data: seqs, error } = await supabase.from('sequences').select('*').order('id')
  if (error) {
    console.error('getSequences error:', error)
    return []
  }

  const { data: stages } = await supabase.from('sequence_stages').select('*').order('stage_order')
  const { data: types } = await supabase.from('sequence_deliverable_types').select('*')

  return seqs.map(s => ({
    id: s.id,
    name: s.name,
    description: s.description,
    isDefault: s.is_default,
    stages: (stages ?? [])
      .filter(st => st.sequence_id === s.id)
      .map(st => ({ name: st.stage_name, department: st.department as string | null })),
    deliverableTypes: (types ?? []).filter(t => t.sequence_id === s.id).map(t => t.type_name),
  }))
}

/** Every deliverable type across every sequence, mapped to its sequence id and name.
 *  Replaces the hardcoded SEQ_TYPE_MAP that used to live in app/admin/actions.ts. */
export async function getDeliverableTypeSequenceMap() {
  const supabase = await createClient()
  const { data: types, error } = await supabase
    .from('sequence_deliverable_types')
    .select('type_name, sequence_id, sequences(name)')
  if (error) {
    console.error('getDeliverableTypeSequenceMap error:', error)
    return {}
  }
  const map: Record<string, { sequenceId: number; sequenceName: string }> = {}
  for (const row of types ?? []) {
    const seq = row.sequences as unknown as { name: string } | null
    map[row.type_name] = { sequenceId: row.sequence_id, sequenceName: seq?.name ?? '' }
  }
  return map
}
async function getAllProjects(): Promise<Project[]> {
  const supabase = await createClient()
  const { data, error } = await supabase.from('projects').select('*')

  if (error) {
    console.error('getAllProjects error:', error)
    return []
  }

  return (data ?? []).map(row => ({
    id: row.id,
    projectName: row.project_name,
    clientName: row.client_name,
    clientPoc: row.client_poc ?? '',
    deliverables: row.deliverables ?? 0,
    contentFormat: row.content_format ?? '',
    startDate: row.start_date,
    endDate: row.end_date,
    status: row.status ?? '',
    manager: row.manager ?? [],
    assignee: row.assignee ?? [],
    priority: (row.priority ?? 'Medium') as Project['priority'],
    timeScale: row.time_scale as Project['timeScale'],
    completionPercent: Number(row.completion_percent ?? 0),
  }))
}

export async function getManagers() {
  const supabase = await createClient()
  const { data, error } = await supabase.from('managers').select('*').order('name')
  if (error) {
    console.error('getManagers error:', error)
    return []
  }
  return data ?? []
}
export async function getManagerStats(managerName: string) {
  const projects = await getAllProjects()
  const managed = projects.filter(p => p.manager.includes(managerName))

  const ongoing = managed.filter(
    p => !['Delivered', 'Raised Invoice', 'Ready for Invoice', 'Dropped', 'Scrapped', 'Completed'].includes(p.status)
  )
  const previous = managed.filter(
    p => ['Delivered', 'Raised Invoice', 'Ready for Invoice', 'Completed'].includes(p.status)
  )

  const timed = managed.filter(p => p.timeScale !== null)
  const onTimePercent = timed.length
    ? Math.round((timed.filter(p => p.timeScale === 'On-Time').length / timed.length) * 100)
    : null

  const avgCompletion = managed.length
    ? Math.round((managed.reduce((sum, p) => sum + p.completionPercent, 0) / managed.length) * 10) / 10
    : 0

  const clients = Array.from(new Set(managed.map(p => p.clientName)))

  return {
    name: managerName,
    totalProjects: managed.length,
    ongoing,
    previous,
    onTimePercent,
    avgCompletion,
    clients,
  }
}

export async function getManagerByName(name: string) {
  const supabase = await createClient()
  const { data, error } = await supabase.from('managers').select('*').eq('name', name).single()
  if (error) {
    console.error('getManagerByName error:', error)
    return null
  }
  return data
}

export async function getCampaignStagesForClient(clientName: string) {
  const supabase = await createClient()
  const projects = await getProjectsByClient(clientName)
  const projectIds = projects.map(p => p.id)

  if (projectIds.length === 0) return []

  const { data, error } = await supabase
    .from('campaign_stages')
    .select('*')
    .in('project_id', projectIds)
    .order('stage_order')

  if (error) {
    console.error('getCampaignStagesForClient error:', error)
    return []
  }

  return projects.map(p => ({
    projectId: p.id,
    projectName: p.projectName,
    stages: (data ?? []).filter(s => s.project_id === p.id),
  })).filter(c => c.stages.length > 0)
}

export async function getOrgSettings() {
  const supabase = await createClient()
  const { data, error } = await supabase.from('org_settings').select('*').limit(1).single()
  if (error) {
    console.error('getOrgSettings error:', error)
    return { timezone: 'Asia/Kolkata', day_starts: '09:30', day_ends: '18:30' }
  }
  return data
}

export async function getHolidays() {
  const supabase = await createClient()
  const { data, error } = await supabase.from('holidays').select('*').order('date')
  if (error) {
    console.error('getHolidays error:', error)
    return []
  }
  return data ?? []
}

export async function getDeliverablesByClient(clientName: string) {
  const supabase = await createClient()
  const projects = await getProjectsByClient(clientName)
  const projectIds = projects.map(p => p.id)

  if (projectIds.length === 0) return []

  const { data: delivs, error } = await supabase
    .from('deliverables')
    .select('*')
    .in('project_id', projectIds)
    .order('id')

  if (error) {
    console.error('getDeliverablesByClient error:', error)
    return []
  }

  const delivIds = (delivs ?? []).map(d => d.id)
  const { data: stages } = delivIds.length
    ? await supabase.from('deliverable_stages').select('*').in('deliverable_id', delivIds).order('stage_order')
    : { data: [] }

  return (delivs ?? []).map(d => {
    const project = projects.find(p => p.id === d.project_id)
    return {
      id: d.id,
      name: d.name,
      contentFormat: d.content_format,
      projectId: d.project_id,
      projectName: project?.projectName ?? '',
      stages: (stages ?? []).filter(s => s.deliverable_id === d.id),
    }
  })
}

export async function getClientCampaignCards() {
  const { clientName, activeProjects } = await getClientPortalData()
  const deliverables = await getDeliverablesByClient(clientName)

  return activeProjects.map(p => {
    const projDelivs = deliverables.filter(d => d.projectId === p.id)
    const allStages = projDelivs.flatMap(d => d.stages)
    const total = allStages.length
    const done = allStages.filter(s => s.status === 'complete').length
    const completion = total ? Math.round((done / total) * 100) : 0
    const needsApproval = allStages.some(s => s.status === 'client_review')

    return {
      id: p.id,
      name: p.projectName,
      status: needsApproval ? 'Needs Approval' : p.status === 'New' ? 'In Progress' : p.status,
      completion,
      deliverables: projDelivs,
      needsApproval,
    }
  })
}

export async function getClientNamesList() {
  const clients = await getClients()
  return clients.map(c => c.name)
}

export async function getCampaignCardsForClient(clientName: string) {
  const projects = await getProjectsByClient(clientName)
  const active = projects.filter(
    p => !['Delivered', 'Raised Invoice', 'Ready for Invoice', 'Dropped', 'Scrapped', 'Completed'].includes(p.status)
  )
  const deliverables = await getDeliverablesByClient(clientName)

  return active.map(p => {
    const projDelivs = deliverables.filter(d => d.projectId === p.id)
    const allStages = projDelivs.flatMap(d => d.stages)
    const total = allStages.length
    const done = allStages.filter(s => s.status === 'complete').length
    const completion = total ? Math.round((done / total) * 100) : 0
    const needsApproval = allStages.some(s => s.status === 'client_review')

    return {
      id: p.id,
      name: p.projectName,
      status: needsApproval ? 'Needs Approval' : p.status === 'New' ? 'In Progress' : p.status,
      completion,
      deliverables: projDelivs,
      needsApproval,
    }
  })
}