'use client'
import { useState } from 'react'
import { assignToStageAction, markReadyForReviewAction, approveStageAction, sendBackStageAction, reassignForRevisionAction } from '@/app/manager/actions'
import { STATUS_META, deriveDisplayStatus, statusLabel } from '@/lib/manager-status'
import type { StageRow } from '@/lib/manager-data'

export function MyStageCard({ stage, allStages, teamNames }: { stage: StageRow; allStages: StageRow[]; teamNames: string[] }) {
  const [submitting, setSubmitting] = useState(false)
  const display = deriveDisplayStatus(stage, allStages)
  const meta = STATUS_META[display]

  async function run(fn: () => Promise<void>) {
    setSubmitting(true)
    try {
      await fn()
    } catch (err) {
      console.error(err)
      alert(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="stage-card" style={{ borderColor: 'var(--primary)', boxShadow: '0 0 0 1px var(--primary)' }}>
      <span className="stage-num">{stage.stageOrder}</span>
      <span className="stage-status" style={{ background: meta.bg, color: meta.fg }}>{statusLabel(stage, allStages)}</span>
      <div className="nm">{stage.stageName}</div>

      {display === 'ready' && (
        <select
          disabled={submitting}
          onChange={e => { if (e.target.value) run(() => assignToStageAction(stage.id, e.target.value)) }}
          defaultValue=""
          style={{ width: '100%', marginTop: 6, fontSize: 10.5, background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 6, padding: '5px 7px' }}
        >
          <option value="">Assign…</option>
          {teamNames.map(n => <option key={n} value={n}>{n}</option>)}
        </select>
      )}

      {display === 'in_progress' && (
        <div style={{ marginTop: 6 }}>
          <div style={{ fontSize: 10, color: 'var(--muted)', marginBottom: 4 }}>{stage.assignee ?? 'Unassigned'}</div>
          <button
            disabled={submitting}
            onClick={() => run(() => markReadyForReviewAction(stage.id))}
            className="btn btn-ghost"
            style={{ width: '100%', fontSize: 10.5, padding: '5px 7px' }}
          >
            Mark ready for review
          </button>
        </div>
      )}

      {display === 'manager_review' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 6 }}>
          <button disabled={submitting} onClick={() => run(() => approveStageAction(stage.id))} className="btn btn-primary" style={{ fontSize: 10.5, padding: '5px 7px' }}>
            Approve → send to client
          </button>
          <button disabled={submitting} onClick={() => run(() => sendBackStageAction(stage.id, ''))} className="btn btn-danger" style={{ fontSize: 10.5, padding: '5px 7px' }}>
            Send back
          </button>
        </div>
      )}

      {display === 'client_review' && (
        <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 7, fontStyle: 'italic' }}>Sent to client, awaiting response</div>
      )}

      {display === 'feedback' && (
        <button
          disabled={submitting}
          onClick={() => run(() => reassignForRevisionAction(stage.id))}
          className="btn btn-primary"
          style={{ width: '100%', marginTop: 6, fontSize: 10.5, padding: '5px 7px' }}
        >
          Reassign for revision
        </button>
      )}
    </div>
  )
}