import {
  campaigns, teamMembers, leaveItems, activityLog, dueTodayTasks, escalations,
  recentActivity, sequences, CURRENT_MANAGER, MANAGER_TITLE,
} from './manager-mock-data'

export { CURRENT_MANAGER, MANAGER_TITLE }

export async function getManagerCampaigns() {
  return campaigns
}

export async function getManagerCampaignById(id: string) {
  return campaigns.find((c) => c.id === id) ?? null
}

export async function getManagerDashboard() {
  const statusCounts = { active: 0, awaitingReview: 0, feedback: 0, complete: 0, blocked: 0 }
  campaigns.forEach((c) => {
    c.deliverables.forEach((d) => {
      const s = d.stages.find((s) => s.isMine)
      if (!s) return
      if (s.status === 'ready' || s.status === 'in_progress') statusCounts.active++
      else if (s.status === 'manager_review' || s.status === 'client_review') statusCounts.awaitingReview++
      else if (s.status === 'feedback') statusCounts.feedback++
      else if (s.status === 'complete') statusCounts.complete++
      else if (s.status === 'blocked') statusCounts.blocked++
    })
  })

  const delayed = campaigns.filter((c) => c.timeScale === 'Delayed').length
  const onTime = campaigns.filter((c) => c.timeScale === 'On-Time').length

  return {
    activeInContent: campaigns.reduce((sum, c) => sum + c.deliverables.length, 0),
    delayedCampaigns: delayed,
    onTimeCampaigns: onTime,
    statusCounts,
    campaigns,
    dueTodayTasks,
    escalations,
    recentActivity,
  }
}

export async function getManagerTeam() {
  return teamMembers
}

export async function getManagerLeaveItems() {
  return leaveItems
}

export async function getManagerActivityLog() {
  return activityLog
}

export async function getManagerSequences() {
  return sequences
}

export async function getManagerTeamAvailability() {
  const onLeaveNames = new Set(leaveItems.map((l) => l.person))
  const atCapacity = teamMembers.filter((m) => m.loadPercent >= 70 && !onLeaveNames.has(m.name))
  const available = teamMembers.filter((m) => m.loadPercent < 70 && !onLeaveNames.has(m.name))
  return { available, atCapacity, onLeave: leaveItems }
}