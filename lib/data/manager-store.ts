'use client'
import { create } from 'zustand'
import { campaigns as initialCampaigns, teamMembers as initialTeam, leaveItems as initialLeave, recentActivity as initialActivity } from './manager-mock-data'
import type { Campaign, Stage, Task, StageStatus } from './manager-mock-data'

export type LeaveItem = {
  person: string
  onLeave: string
  impactedTask: string
  etaShift: string
  status: 'Approved' | 'Pending'
}

export type ActivityEntry = { kind: 'done' | 'approve' | 'start'; text: string; meta: string }

type ManagerState = {
  campaigns: Campaign[]
  teamMembers: typeof initialTeam
  leaveItems: LeaveItem[]
  recentActivity: ActivityEntry[]

  assignMember: (campaignId: string, deliverableId: string, stageId: string, taskId: string, memberName: string) => void
  completeTask: (campaignId: string, deliverableId: string, stageId: string, taskId: string) => void
  approveStage: (campaignId: string, deliverableId: string, stageId: string) => void
  sendBackStage: (campaignId: string, deliverableId: string, stageId: string) => void
  clientApprove: (campaignId: string, deliverableId: string, stageId: string) => void
  clientRequestChanges: (campaignId: string, deliverableId: string, stageId: string, feedback: string) => void
  reassignForRevision: (campaignId: string, deliverableId: string, stageId: string) => void
  applyLeave: (person: string, onLeave: string, reason: string) => void
  resolveLeaveItem: (index: number) => void
}

function updateStage(
  campaigns: Campaign[],
  campaignId: string,
  deliverableId: string,
  stageId: string,
  fn: (stage: Stage, allStages: Stage[]) => Stage,
): Campaign[] {
  return campaigns.map((c) => {
    if (c.id !== campaignId) return c
    return {
      ...c,
      deliverables: c.deliverables.map((d) => {
        if (d.id !== deliverableId) return d
        const stages = d.stages
        return {
          ...d,
          stages: stages.map((s) => (s.id === stageId ? fn(s, stages) : s)),
        }
      }),
    }
  })
}

function logActivity(state: ManagerState, entry: ActivityEntry) {
  return [entry, ...state.recentActivity].slice(0, 8)
}

export const useManagerStore = create<ManagerState>((set) => ({
  campaigns: initialCampaigns,
  teamMembers: initialTeam,
  leaveItems: initialLeave.map((l) => ({ ...l, status: 'Approved' as const })),
  recentActivity: initialActivity,

  assignMember: (campaignId, deliverableId, stageId, taskId, memberName) =>
    set((state) => ({
      campaigns: updateStage(state.campaigns, campaignId, deliverableId, stageId, (stage) => {
        if (!stage.tasks) return stage
        const tasks = stage.tasks.map((t) =>
          t.id === taskId ? { ...t, assignee: memberName, status: 'in_progress' as const } : t,
        )
        const anyStarted = tasks.some((t) => t.status === 'in_progress' || t.status === 'complete')
        return { ...stage, tasks, status: anyStarted && stage.status === 'ready' ? 'in_progress' : stage.status }
      }),
      recentActivity: logActivity(state, { kind: 'start', text: `${memberName} picked up a task`, meta: 'Just now' }),
    })),

  completeTask: (campaignId, deliverableId, stageId, taskId) =>
    set((state) => ({
      campaigns: updateStage(state.campaigns, campaignId, deliverableId, stageId, (stage) => {
        if (!stage.tasks) return stage
        const idx = stage.tasks.findIndex((t) => t.id === taskId)
        const tasks = stage.tasks.map((t, i) => {
          if (t.id === taskId) return { ...t, status: 'complete' as const }
          if (i === idx + 1 && t.status === 'blocked') return { ...t, status: 'ready' as const }
          return t
        })
        const allDone = tasks.every((t) => t.status === 'complete')
        return { ...stage, tasks, status: allDone ? 'manager_review' : stage.status } as Stage
      }),
      recentActivity: logActivity(state, { kind: 'done', text: 'A task was marked complete', meta: 'Just now' }),
    })),

  approveStage: (campaignId, deliverableId, stageId) =>
    set((state) => ({
      campaigns: updateStage(state.campaigns, campaignId, deliverableId, stageId, (stage) => ({
        ...stage,
        status: 'client_review' as StageStatus,
      })),
      recentActivity: logActivity(state, { kind: 'approve', text: 'You approved and sent work to the client', meta: 'Just now' }),
    })),

  sendBackStage: (campaignId, deliverableId, stageId) =>
    set((state) => ({
      campaigns: updateStage(state.campaigns, campaignId, deliverableId, stageId, (stage) => ({
        ...stage,
        status: 'in_progress' as StageStatus,
        tasks: stage.tasks?.map((t, i) => (i === stage.tasks!.length - 1 ? { ...t, status: 'in_progress' as const } : t)),
      })),
      recentActivity: logActivity(state, { kind: 'start', text: 'You sent work back to the team', meta: 'Just now' }),
    })),

  clientApprove: (campaignId, deliverableId, stageId) =>
    set((state) => ({
      campaigns: campaigns_clientApprove(state.campaigns, campaignId, deliverableId, stageId),
      recentActivity: logActivity(state, { kind: 'approve', text: 'Client approved — stage complete, next stage unlocked', meta: 'Just now' }),
    })),

  clientRequestChanges: (campaignId, deliverableId, stageId, feedback) =>
    set((state) => ({
      campaigns: updateStage(state.campaigns, campaignId, deliverableId, stageId, (stage) => ({
        ...stage,
        status: 'feedback' as StageStatus,
        iteration: (stage.iteration ?? 0) + 1,
      })),
      recentActivity: logActivity(state, { kind: 'start', text: `Client requested changes: "${feedback}"`, meta: 'Just now' }),
    })),

  reassignForRevision: (campaignId, deliverableId, stageId) =>
    set((state) => ({
      campaigns: updateStage(state.campaigns, campaignId, deliverableId, stageId, (stage) => ({
        ...stage,
        status: 'in_progress' as StageStatus,
        tasks: stage.tasks?.map((t, i) => (i === stage.tasks!.length - 1 ? { ...t, status: 'in_progress' as const } : t)),
      })),
      recentActivity: logActivity(state, { kind: 'start', text: 'Revision reassigned to the team', meta: 'Just now' }),
    })),

  applyLeave: (person, onLeave, reason) =>
    set((state) => ({
      leaveItems: [
        ...state.leaveItems,
        { person, onLeave, impactedTask: reason || 'No task specified', etaShift: 'Pending approval', status: 'Pending' as const },
      ],
    })),

  resolveLeaveItem: (index) =>
    set((state) => ({
      leaveItems: state.leaveItems.filter((_, i) => i !== index),
    })),
}))

function campaigns_clientApprove(campaigns: Campaign[], campaignId: string, deliverableId: string, stageId: string): Campaign[] {
  return campaigns.map((c) => {
    if (c.id !== campaignId) return c
    return {
      ...c,
      deliverables: c.deliverables.map((d) => {
        if (d.id !== deliverableId) return d
        const idx = d.stages.findIndex((s) => s.id === stageId)
        return {
          ...d,
          stages: d.stages.map((s, i) => {
            if (i === idx) return { ...s, status: 'complete' as StageStatus }
            if (i === idx + 1 && s.status === 'blocked') return { ...s, status: 'ready' as StageStatus, waitingOn: undefined }
            return s
          }),
        }
      }),
    }
  })
}