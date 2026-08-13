'use client'
import { useState } from 'react'
import { approveStageAction, sendBackStageAction, reassignForRevisionAction } from '@/app/manager/actions'
import {
  recordClientApprovalAction,
  recordClientChangesAction,
} from '@/app/manager/client-decision-actions'

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
    return <ClientDecisionRow row={row} submitting={submitting} setSubmitting={setSubmitting} run={run} />
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
        {row.note && <div style={{ fontSize: 12, color: 'var(--ink-soft)', marginTop: 8, fontStyle: 'italic', whiteSpace: 'pre-wrap' }}>&quot;{row.note}&quot;</div>}
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
// CLIENT DECISION PANEL
// ----------------------------------------------------------------------------
// PMT has no Client authentication. When a stage is in `client_review` the
// account Manager has communicated with the Client outside PMT (phone,
// WhatsApp, email, meetings) and now records the Client's decision here.
//
// The Manager is NOT impersonating the Client — the wording deliberately
// says "Recording externally-communicated Client feedback".
// ============================================================================
function ClientDecisionRow({
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
  const [mode, setMode] = useState<'idle' | 'confirm-approve' | 'record-changes'>('idle')
  const [feedback, setFeedback] = useState('')

  return (
    <div
      style={{ background: 'var(--surface-2)', borderRadius: 9, padding: '11px 13px', marginBottom: 10 }}
      data-testid={`client-decision-panel-${row.stageId}`}
    >
      <div style={{ fontWeight: 600, fontSize: 12.5 }}>{row.deliverableName} — {row.stageName}</div>
      <div className="hint">{row.campaignName} · {row.clientName} · awaiting client confirmation</div>

      <div
        style={{
          marginTop: 10,
          padding: '10px 12px',
          border: '1px solid var(--border)',
          borderRadius: 8,
          background: 'var(--surface)',
        }}
      >
        <div
          style={{
            fontSize: 11,
            letterSpacing: '.04em',
            textTransform: 'uppercase',
            fontWeight: 700,
            color: 'var(--ink-soft)',
            marginBottom: 8,
          }}
        >
          Client Decision
        </div>
        <div className="hint" style={{ marginBottom: 10, fontSize: 11.5 }}>
          Record the decision the account manager confirmed with the client outside PMT
          (phone / WhatsApp / email / meeting).
        </div>

        {mode === 'idle' && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }} data-testid={`client-decision-idle-${row.stageId}`}>
            <button
              type="button"
              disabled={submitting}
              onClick={() => setMode('confirm-approve')}
              className="btn btn-success"
              data-testid={`client-approved-button-${row.stageId}`}
            >
              Client Approved
            </button>
            <button
              type="button"
              disabled={submitting}
              onClick={() => setMode('record-changes')}
              className="btn btn-danger"
              data-testid={`client-request-changes-button-${row.stageId}`}
            >
              Client Requested Changes
            </button>
          </div>
        )}

        {mode === 'confirm-approve' && (
          <div data-testid={`client-approved-confirm-panel-${row.stageId}`}>
            <div style={{ fontSize: 12, marginBottom: 8 }}>
              Have you confirmed approval with the client? Recording this will
              mark the stage complete and advance the deliverable.
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                type="button"
                disabled={submitting}
                onClick={async () => {
                  setSubmitting(true)
                  await run(async () => {
                    await recordClientApprovalAction(row.stageId)
                  })
                  setMode('idle')
                }}
                className="btn btn-success"
                data-testid={`client-approval-confirm-${row.stageId}`}
              >
                Confirm Client Approval
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={() => setMode('idle')}
                className="btn btn-ghost"
                data-testid={`client-approval-cancel-${row.stageId}`}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {mode === 'record-changes' && (
          <div data-testid={`client-changes-form-${row.stageId}`}>
            <label
              htmlFor={`cd-fb-${row.stageId}`}
              style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 6 }}
            >
              Client feedback
            </label>
            <textarea
              id={`cd-fb-${row.stageId}`}
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Enter the changes confirmed by the client…"
              rows={3}
              maxLength={2000}
              data-testid={`client-changes-textarea-${row.stageId}`}
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
                    await recordClientChangesAction(row.stageId, feedback)
                  })
                  setMode('idle')
                  setFeedback('')
                }}
                className="btn btn-danger"
                data-testid={`client-changes-submit-${row.stageId}`}
              >
                Record Client Changes
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={() => { setMode('idle'); setFeedback('') }}
                className="btn btn-ghost"
                data-testid={`client-changes-cancel-${row.stageId}`}
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
