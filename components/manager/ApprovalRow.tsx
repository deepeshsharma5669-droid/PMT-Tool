'use client'
import { useState } from 'react'
import { approveStageAction, sendBackStageAction, reassignForRevisionAction } from '@/app/manager/actions'
// TEMPORARY CLIENT SIMULATION — remove this import when the real Client portal is wired up.
import {
  simulateClientApproveStageAction,
  simulateClientRequestChangesAction,
} from '@/app/manager/simulate-client-actions'

type Row = { stageId: number; deliverableName: string; stageName: string; campaignName: string; clientName: string; revisionCount: number; note: string | null }

export function ApprovalRow({ row, kind }: { row: Row; kind: 'manager_review' | 'client_review' | 'feedback' | 'complete' }) {
  const [submitting, setSubmitting] = useState(false)
  const [note, setNote] = useState('')

  async function run(fn: () => Promise<void>) {
    setSubmitting(true)
    try {
      await fn()
    } catch (err) {
      console.error(err)
      alert(err instanceof Error ? err.message : 'Something went wrong.')
      setSubmitting(false)
    }
  }

  if (kind === 'manager_review') {
    return (
      <div style={{ background: 'var(--surface-2)', borderRadius: 9, padding: 14, marginBottom: 10 }}>
        <div style={{ fontWeight: 600, fontSize: 12.5 }}>{row.deliverableName} — {row.stageName}</div>
        <div className="hint" style={{ marginBottom: 10 }}>{row.campaignName} · {row.clientName}</div>
        <textarea
          placeholder="Note if sending back (optional)…"
          value={note}
          onChange={e => setNote(e.target.value)}
          style={{ width: '100%', padding: '6px 8px', border: '1px solid var(--border)', borderRadius: 6, fontSize: 11.5, marginBottom: 8 }}
        />
        <div style={{ display: 'flex', gap: 8 }}>
          <button disabled={submitting} onClick={() => run(() => approveStageAction(row.stageId))} className="btn btn-success">Approve → Send to client</button>
          <button disabled={submitting} onClick={() => run(() => sendBackStageAction(row.stageId, note))} className="btn btn-danger">Send back to team</button>
        </div>
      </div>
    )
  }

  if (kind === 'client_review') {
    return <ClientReviewRow row={row} submitting={submitting} setSubmitting={setSubmitting} run={run} />
  }

  if (kind === 'feedback') {
    return (
      <div style={{ background: 'var(--danger-soft)', borderRadius: 9, padding: '13px 15px', marginBottom: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 13 }}>{row.deliverableName} — {row.stageName}</div>
            <div className="hint">{row.campaignName} · {row.clientName}</div>
          </div>
          <span style={{ fontSize: 10.5, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: 'var(--danger)', color: '#fff' }}>Iteration {row.revisionCount}</span>
        </div>
        {row.note && <div style={{ fontSize: 12, color: 'var(--ink-soft)', marginTop: 8, fontStyle: 'italic' }}>&quot;{row.note}&quot;</div>}
        <button disabled={submitting} onClick={() => run(() => reassignForRevisionAction(row.stageId))} className="btn btn-primary" style={{ marginTop: 10 }}>
          Reassign for revision
        </button>
      </div>
    )
  }

  return (
    <div style={{ background: 'var(--surface-2)', borderRadius: 9, padding: '11px 13px' }}>
      <div style={{ fontWeight: 600, fontSize: 12.5 }}>{row.deliverableName} — {row.stageName}</div>
      <div className="hint">{row.campaignName} · {row.clientName} · client approved</div>
    </div>
  )
}

// ============================================================================
// TEMPORARY CLIENT SIMULATION UI
// ----------------------------------------------------------------------------
// Renders under the "Sent to client" list on the Manager Approvals page. Lets
// Admin/Manager users drive the workflow past client_review before real Client
// authentication is implemented.
//
// DELETE this component + its usage in the client_review branch above when the
// real Client portal is wired up.
// ============================================================================
function ClientReviewRow({
  row,
  submitting,
  setSubmitting,
  run,
}: {
  row: Row
  submitting: boolean
  setSubmitting: (b: boolean) => void
  run: (fn: () => Promise<void>) => Promise<void>
}) {
  const [mode, setMode] = useState<'idle' | 'confirm-approve' | 'request-changes'>('idle')
  const [feedback, setFeedback] = useState('')

  return (
    <div
      style={{ background: 'var(--surface-2)', borderRadius: 9, padding: '11px 13px', marginBottom: 10 }}
      data-testid={`client-review-row-${row.stageId}`}
    >
      <div style={{ fontWeight: 600, fontSize: 12.5 }}>{row.deliverableName} — {row.stageName}</div>
      <div className="hint">{row.campaignName} · {row.clientName} · awaiting client response</div>

      <div
        style={{
          marginTop: 10,
          padding: '10px 12px',
          border: '1px dashed var(--border)',
          borderRadius: 8,
          background: 'var(--surface-3, var(--surface-2))',
        }}
      >
        <div
          className="hint"
          style={{ fontSize: 10.5, letterSpacing: '.04em', textTransform: 'uppercase', marginBottom: 8 }}
        >
          Temporary · testing only · until real client sign-in exists
        </div>

        {mode === 'idle' && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button
              type="button"
              disabled={submitting}
              onClick={() => setMode('confirm-approve')}
              className="btn btn-success"
              data-testid={`simulate-client-approve-open-${row.stageId}`}
            >
              Simulate Client Approval
            </button>
            <button
              type="button"
              disabled={submitting}
              onClick={() => setMode('request-changes')}
              className="btn btn-danger"
              data-testid={`simulate-client-request-changes-open-${row.stageId}`}
            >
              Simulate Client Request Changes
            </button>
          </div>
        )}

        {mode === 'confirm-approve' && (
          <div>
            <div style={{ fontSize: 12, marginBottom: 8 }}>
              Simulate client approval for this stage? This will complete it and may advance the deliverable.
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                type="button"
                disabled={submitting}
                onClick={async () => {
                  setSubmitting(true)
                  await run(async () => {
                    await simulateClientApproveStageAction(row.stageId)
                  })
                  setMode('idle')
                }}
                className="btn btn-success"
                data-testid={`simulate-client-approve-confirm-${row.stageId}`}
              >
                Confirm
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={() => setMode('idle')}
                className="btn btn-secondary"
                data-testid={`simulate-client-approve-cancel-${row.stageId}`}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {mode === 'request-changes' && (
          <div>
            <label
              htmlFor={`sim-fb-${row.stageId}`}
              style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 6 }}
            >
              Client feedback
            </label>
            <textarea
              id={`sim-fb-${row.stageId}`}
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="What does the client want changed?"
              rows={3}
              maxLength={2000}
              data-testid={`simulate-client-request-changes-note-${row.stageId}`}
              style={{
                width: '100%',
                padding: '6px 8px',
                border: '1px solid var(--border)',
                borderRadius: 6,
                fontSize: 12,
                marginBottom: 8,
              }}
            />
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                type="button"
                disabled={submitting || !feedback.trim()}
                onClick={async () => {
                  setSubmitting(true)
                  await run(async () => {
                    await simulateClientRequestChangesAction(row.stageId, feedback)
                  })
                  setMode('idle')
                  setFeedback('')
                }}
                className="btn btn-danger"
                data-testid={`simulate-client-request-changes-submit-${row.stageId}`}
              >
                Request Changes
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={() => { setMode('idle'); setFeedback('') }}
                className="btn btn-secondary"
                data-testid={`simulate-client-request-changes-cancel-${row.stageId}`}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
