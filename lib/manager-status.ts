import type { StageRow } from './manager-data'

export type DisplayStatus = 'ready' | 'blocked' | 'in_progress' | 'manager_review' | 'client_review' | 'feedback' | 'hold' | 'complete'

/** The real schema's "pending" status doesn't distinguish "can start now" from
 *  "blocked by an earlier stage" — that's derived here by checking whether
 *  the previous stage in the chain is complete. */
export function deriveDisplayStatus(stage: StageRow, allStages: StageRow[]): DisplayStatus {
  if (stage.status !== 'pending') return stage.status as DisplayStatus
  const prev = allStages.find(s => s.stageOrder === stage.stageOrder - 1)
  if (!prev || prev.status === 'complete') return 'ready'
  return 'blocked'
}

export const STATUS_META: Record<DisplayStatus, { label: string; bg: string; fg: string }> = {
  blocked: { label: 'Blocked', bg: 'var(--surface-2)', fg: 'var(--muted)' },
  ready: { label: 'Ready', bg: 'var(--success-soft)', fg: 'var(--success)' },
  in_progress: { label: 'In Progress', bg: 'var(--primary-soft)', fg: 'var(--primary)' },
  manager_review: { label: 'Manager Review', bg: 'var(--violet-soft)', fg: 'var(--violet)' },
  client_review: { label: 'Client Review', bg: 'var(--amber-soft)', fg: 'var(--amber)' },
  feedback: { label: 'Feedback', bg: 'var(--danger-soft)', fg: 'var(--danger)' },
  hold: { label: 'On Hold', bg: 'var(--surface-2)', fg: 'var(--muted)' },
  complete: { label: 'Complete', bg: 'var(--success-soft)', fg: 'var(--success)' },
}

export function statusLabel(stage: StageRow, allStages: StageRow[]): string {
  const display = deriveDisplayStatus(stage, allStages)
  if (display === 'feedback') return `Feedback · Iteration ${stage.revisionCount}`
  return STATUS_META[display].label
}

export function waitingOnLabel(stage: StageRow, allStages: StageRow[]): string | undefined {
  if (deriveDisplayStatus(stage, allStages) !== 'blocked') return undefined
  const prev = allStages.find(s => s.stageOrder === stage.stageOrder - 1)
  return prev ? `Waiting on ${prev.stageName}` : undefined
}