'use client'
import { useState } from 'react'
import { approveStageAction, sendBackStageAction, reassignForRevisionAction } from '@/app/manager/actions'

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
    return (
      <div style={{ background: 'var(--surface-2)', borderRadius: 9, padding: '11px 13px', marginBottom: 10 }}>
        <div style={{ fontWeight: 600, fontSize: 12.5 }}>{row.deliverableName} — {row.stageName}</div>
        <div className="hint">{row.campaignName} · {row.clientName} · awaiting client response</div>
      </div>
    )
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