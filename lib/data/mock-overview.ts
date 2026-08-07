export const systemStats = {
  clients: 24,
  campaigns: 112,
  campaignsActive: 76,
  deliverables: 340,
  deliverablesDelayed: 51,
  stages: 680,
  tasks: 1400,
  tasksInProgress: 890,
  approvalsPending: 58,
  escalationsOpen: 6,
  onTimeDelivery: 78,
  avgReworkRounds: 1.4,
  readyForBilling: 9,
}

export const escalations = [
  { campaign: 'Prudential 2.0', client: 'ICICI Prudential MF', issue: 'Unassigned Visual Design stage', daysOverdue: 3 },
  { campaign: 'FT — Gift City AV', client: 'Franklin Templeton', issue: '3rd revision round, client escalated', daysOverdue: 1 },
]

export const managerEfficiency = [
  { manager: 'Kaushal Shah', activeCampaigns: 3, onTimePercent: 81, avgRework: 1.2, teamLoad: 80, escalations: 2 },
  { manager: 'Shruti Gawade', activeCampaigns: 4, onTimePercent: 74, avgRework: 1.6, teamLoad: 60, escalations: 1 },
  { manager: 'Shraddha Batawale', activeCampaigns: 3, onTimePercent: 90, avgRework: 0.9, teamLoad: 45, escalations: 0 },
]

export const stageBottlenecks = [
  { stage: 'Creative Brief Review', avgHours: 1.4, baselineHours: 1, campaigns: 18, severity: 'ok' },
  { stage: 'Concept Ideation', avgHours: 3.8, baselineHours: 2, campaigns: 22, severity: 'high' },
  { stage: 'Visual Design', avgHours: 4.2, baselineHours: 3, campaigns: 25, severity: 'medium' },
  { stage: 'Internal Review & Revisions', avgHours: 2.6, baselineHours: 1, campaigns: 20, severity: 'high' },
  { stage: 'Client-Ready Packaging', avgHours: 0.8, baselineHours: 0.75, campaigns: 19, severity: 'ok' },
  { stage: 'Client Approval', avgHours: 26, baselineHours: 12, campaigns: 24, severity: 'high' },
]

export const clientHealth = [
  { client: 'ICICI Prudential Mutual Fund', healthScore: 62, trend: 'down', avgRevisions: 2.8, onTimePercent: 68, renewalDate: '2026-11-01' },
  { client: 'Kotak Mutual Fund', healthScore: 88, trend: 'up', avgRevisions: 1.1, onTimePercent: 91, renewalDate: '2027-02-15' },
  { client: 'Nimbus Foods', healthScore: 71, trend: 'flat', avgRevisions: 1.9, onTimePercent: 75, renewalDate: '2026-09-30' },
  { client: 'Franklin Templeton', healthScore: 54, trend: 'down', avgRevisions: 3.4, onTimePercent: 60, renewalDate: '2026-08-20' },
]

export const agingWork = [
  { task: 'Internal Review & Revisions', campaign: 'FT — Gift City AV', client: 'Franklin Templeton', assignee: 'Karan Shah', daysStale: 6 },
  { task: 'Visual Design', campaign: 'Prudential 2.0', client: 'ICICI Prudential MF', assignee: 'Unassigned', daysStale: 5 },
  { task: 'Concept Ideation', campaign: 'Nimbus Rebrand Launch', client: 'Nimbus Foods', assignee: 'Sara Iyer', daysStale: 4 },
]

export const onTimeTrend = [
  { month: 'Mar', percent: 72 },
  { month: 'Apr', percent: 75 },
  { month: 'May', percent: 69 },
  { month: 'Jun', percent: 80 },
  { month: 'Jul', percent: 78 },
]

export const skillGaps = [
  { skill: 'Visual Design L4+', demand: 12, supply: 4, gap: 8 },
  { skill: 'Concept Ideation L4+', demand: 9, supply: 5, gap: 4 },
  { skill: 'Client-Ready Packaging L3+', demand: 6, supply: 5, gap: 1 },
  { skill: 'Internal Review L4+', demand: 7, supply: 6, gap: 1 },
]

export const teamToday = {
  available: 3,
  atCapacity: [{ name: 'Karan Shah' }],
  onLeave: [{ name: 'Meera Nair' }],
}

export const pipelineStages = [
  { stage: 'Content', count: 8, color: 'var(--primary)' },
  { stage: 'Design', count: 6, color: 'var(--violet)' },
  { stage: 'Animation', count: 5, color: 'var(--amber)' },
  { stage: 'Review', count: 4, color: 'var(--success)' },
]

