'use client'
import { useState } from 'react'
import type { MemberTaskRow } from '@/lib/member-data'
import { startWorkAction, resumeWorkAction, submitForReviewAction } from '@/app/member/actions'

type Props = { tasks: MemberTaskRow[]; onOpenFeedback: (t: MemberTaskRow) => void }

function statusPillClass(status: string): string {
  // Reuses .stage-status.<status> tokens already defined in globals.css
  return `stage-status ${status}`
}

export function MyTasksTable({ tasks, onOpenFeedback }: Props) {
  const [busyId, setBusyId] = useState<number | null>(null)
  const [errorId, setErrorId] = useState<{ id: number; msg: string } | null>(null)

  async function run(stageId: number, fn: () => Promise<void>) {
    setBusyId(stageId)
    setErrorId(null)
    try {
      await fn()
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Something went wrong.'
      setErrorId({ id: stageId, msg })
    } finally {
      setBusyId(null)
    }
  }

  if (tasks.length === 0) {
    return (
      <div className="panel-body" data-testid="my-tasks-empty">
        <p className="hint">No active tasks.</p>
      </div>
    )
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table className="data" data-testid="my-tasks-table">
        <thead>
          <tr>
            <th>Client</th>
            <th>Campaign</th>
            <th>Deliverable</th>
            <th>Status</th>
            <th style={{ width: 200 }}>Action</th>
          </tr>
        </thead>
        <tbody>
          {tasks.map(t => (
            <tr key={t.stageId} data-testid={`my-task-row-${t.stageId}`}>
              <td className="name-cell">{t.clientName}</td>
              <td>{t.campaignName}</td>
              <td>
                <div>{t.deliverableName}</div>
                <div className="hint" style={{ marginTop: 2 }}>{t.stageName}</div>
              </td>
              <td>
                <span className={statusPillClass(t.status)} data-testid={`my-task-status-${t.stageId}`}>
                  {t.uiLabel}
                </span>
              </td>
              <td>
                {t.status === 'pending' && (
                  <button
                    className="btn btn-primary"
                    disabled={busyId === t.stageId}
                    onClick={() => run(t.stageId, () => startWorkAction(t.stageId))}
                    data-testid={`start-work-btn-${t.stageId}`}
                    style={{ fontSize: 11.5, padding: '6px 10px' }}
                  >
                    {busyId === t.stageId ? 'Starting…' : 'Start Work'}
                  </button>
                )}
                {t.status === 'in_progress' && (
                  <button
                    className="btn btn-primary"
                    disabled={busyId === t.stageId}
                    onClick={() => run(t.stageId, () => submitForReviewAction(t.stageId))}
                    data-testid={`submit-review-btn-${t.stageId}`}
                    style={{ fontSize: 11.5, padding: '6px 10px' }}
                  >
                    {busyId === t.stageId ? 'Submitting…' : 'Submit for Review'}
                  </button>
                )}
                {t.status === 'feedback' && (
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    <button
                      className="btn btn-ghost"
                      onClick={() => onOpenFeedback(t)}
                      data-testid={`view-feedback-btn-${t.stageId}`}
                      style={{ fontSize: 11.5, padding: '6px 10px' }}
                    >
                      View Feedback
                    </button>
                    <button
                      className="btn btn-primary"
                      disabled={busyId === t.stageId}
                      onClick={() => run(t.stageId, () => resumeWorkAction(t.stageId))}
                      data-testid={`resume-work-btn-${t.stageId}`}
                      style={{ fontSize: 11.5, padding: '6px 10px' }}
                    >
                      {busyId === t.stageId ? 'Resuming…' : 'Resume Work'}
                    </button>
                  </div>
                )}
                {errorId?.id === t.stageId && (
                  <div
                    style={{ color: 'var(--danger)', fontSize: 11, marginTop: 6 }}
                    data-testid={`my-task-error-${t.stageId}`}
                  >
                    {errorId.msg}
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
