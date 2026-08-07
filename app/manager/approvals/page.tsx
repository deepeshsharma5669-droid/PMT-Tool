'use client'
import { useState } from 'react'
import { useManagerStore } from '@/lib/data/manager-store'

type Row = { key: string; campaignId: string; deliverableId: string; stageId: string; campaignName: string; deliverableName: string; stageName: string }

export default function ManagerApprovals() {
  const campaigns = useManagerStore((s) => s.campaigns)
  const approveStage = useManagerStore((s) => s.approveStage)
  const sendBackStage = useManagerStore((s) => s.sendBackStage)
  const clientApprove = useManagerStore((s) => s.clientApprove)
  const clientRequestChanges = useManagerStore((s) => s.clientRequestChanges)
  const reassignForRevision = useManagerStore((s) => s.reassignForRevision)

  const [feedbackDraft, setFeedbackDraft] = useState<Record<string, string>>({})

  const rows: Record<'manager_review' | 'client_review' | 'feedback' | 'complete', Row[]> = {
    manager_review: [], client_review: [], feedback: [], complete: [],
  }
  campaigns.forEach((c) => {
    c.deliverables.forEach((d) => {
      d.stages.forEach((s) => {
        if (!s.isMine) return
        if (s.status in rows) {
          rows[s.status as keyof typeof rows].push({
            key: `${c.id}-${d.id}-${s.id}`,
            campaignId: c.id, deliverableId: d.id, stageId: s.id,
            campaignName: c.name, deliverableName: d.name, stageName: s.name,
          })
        }
      })
    })
  })

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Approvals</h1>
          <p className="sub">Content&apos;s two gates: you approve first, then the client — every stage repeats this, not just the last one</p>
        </div>
      </div>

      <div className="two-col">
        <div className="card">
          <div className="panel-head"><h2>Awaiting your review</h2><span className="hint">Submitted by the team, not yet approved by you</span></div>
          <div className="panel-body">
            {rows.manager_review.length === 0 && <p className="hint">Nothing waiting on you right now.</p>}
            {rows.manager_review.map((r) => (
              <div key={r.key} style={{ background: 'var(--surface-2)', borderRadius: 9, padding: 14, marginBottom: 10 }}>
                <div style={{ fontWeight: 600, fontSize: 12.5 }}>{r.deliverableName} — {r.stageName}</div>
                <div className="hint" style={{ marginBottom: 10 }}>{r.campaignName}</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => approveStage(r.campaignId, r.deliverableId, r.stageId)} className="btn btn-success">Approve → Send to client</button>
                  <button onClick={() => sendBackStage(r.campaignId, r.deliverableId, r.stageId)} className="btn btn-danger">Send back to team</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="panel-head"><h2>Sent to client</h2><span className="hint">You&apos;ve approved — awaiting client response</span></div>
          <div className="panel-body">
            {rows.client_review.length === 0 && <p className="hint">Nothing with the client right now.</p>}
            {rows.client_review.map((r) => (
              <div key={r.key} style={{ background: 'var(--surface-2)', borderRadius: 9, padding: '11px 13px', marginBottom: 10 }}>
                <div style={{ fontWeight: 600, fontSize: 12.5 }}>{r.deliverableName} — {r.stageName}</div>
                <div className="hint" style={{ marginBottom: 8 }}>{r.campaignName}</div>
                <input
                  placeholder="If client requests changes, note it here…"
                  value={feedbackDraft[r.key] ?? ''}
                  onChange={(e) => setFeedbackDraft((prev) => ({ ...prev, [r.key]: e.target.value }))}
                  style={{ width: '100%', padding: '6px 8px', border: '1px solid var(--border)', borderRadius: 6, fontSize: 11.5, marginBottom: 8 }}
                />
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => clientApprove(r.campaignId, r.deliverableId, r.stageId)} className="btn btn-success" style={{ fontSize: 11 }}>Client approves</button>
                  <button
                    onClick={() => clientRequestChanges(r.campaignId, r.deliverableId, r.stageId, feedbackDraft[r.key] || 'No specific note')}
                    className="btn btn-danger" style={{ fontSize: 11 }}
                  >
                    Client requests changes
                  </button>
                </div>
                <div className="hint" style={{ marginTop: 6, fontStyle: 'italic' }}>Standing in for the Client login, which isn&apos;t built yet</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <div className="panel-head"><h2>Client requested changes</h2><span className="hint">Loops back to the team — same stage, next iteration</span></div>
        <div className="panel-body">
          {rows.feedback.length === 0 && <p className="hint">No revisions in progress right now.</p>}
          {rows.feedback.map((r) => {
            const stage = campaigns.find((c) => c.id === r.campaignId)?.deliverables.find((d) => d.id === r.deliverableId)?.stages.find((s) => s.id === r.stageId)
            return (
              <div key={r.key} style={{ background: 'var(--danger-soft)', borderRadius: 9, padding: '13px 15px', marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 13 }}>{r.deliverableName} — {r.stageName}</div>
                    <div className="hint">{r.campaignName}</div>
                  </div>
                  <span style={{ fontSize: 10.5, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: 'var(--danger)', color: '#fff' }}>Iteration {stage?.iteration ?? 1}</span>
                </div>
                <button onClick={() => reassignForRevision(r.campaignId, r.deliverableId, r.stageId)} className="btn btn-primary" style={{ marginTop: 10 }}>Reassign for revision</button>
              </div>
            )
          })}
        </div>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <div className="panel-head"><h2>Approved → Moved to Design</h2><span className="hint">Client signed off — Content&apos;s job here is done</span></div>
        <div className="panel-body" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {rows.complete.length === 0 && <p className="hint">Nothing completed yet.</p>}
          {rows.complete.map((r) => (
            <div key={r.key} style={{ background: 'var(--surface-2)', borderRadius: 9, padding: '11px 13px' }}>
              <div style={{ fontWeight: 600, fontSize: 12.5 }}>{r.deliverableName} — {r.stageName}</div>
              <div className="hint">{r.campaignName} · client approved</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}