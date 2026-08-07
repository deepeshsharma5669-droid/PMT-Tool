'use client'
import { useState, useEffect } from 'react'
import { clientApproveStageAction, clientRequestChangesAction } from '@/app/admin/actions'
import { fetchClientCampaigns } from '@/app/client/actions'

const STAGE_LABELS: Record<string, string> = {
  pending: 'Not started', in_progress: 'In progress', manager_review: 'Manager review',
  client_review: 'Client review', feedback: 'Feedback', hold: 'Hold', complete: 'Complete',
}

const STATUS_FILTERS = ['All Active', 'Needs Approval', 'In Progress']

export function ClientCampaignsView({ clientNames }: { clientNames: string[] }) {
  const [selectedClient, setSelectedClient] = useState(clientNames[0] ?? '')
  const [selectedStatus, setSelectedStatus] = useState('All Active')
  const [campaigns, setCampaigns] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [reviewStage, setReviewStage] = useState<any>(null)
  const [feedback, setFeedback] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!selectedClient) return
    setLoading(true)
    fetchClientCampaigns(selectedClient).then(data => {
      setCampaigns(data)
      setLoading(false)
    })
  }, [selectedClient])

  const filtered = campaigns.filter(c => {
    if (selectedStatus === 'All Active') return true
    if (selectedStatus === 'Needs Approval') return c.needsApproval
    if (selectedStatus === 'In Progress') return !c.needsApproval
    return true
  })

  const activeCount = filtered.length
  const approvalsCount = filtered.filter(c => c.needsApproval).length
  const avgCompletion = activeCount ? Math.round(filtered.reduce((s, c) => s + c.completion, 0) / activeCount) : 0

  async function refresh() {
    const data = await fetchClientCampaigns(selectedClient)
    setCampaigns(data)
  }

  async function handleApprove() {
    if (!reviewStage) return
    setSubmitting(true)
    try {
      await clientApproveStageAction(reviewStage.id, feedback)
      await refresh()
      setReviewStage(null)
      setFeedback('')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleRequestChanges() {
    if (!reviewStage) return
    setSubmitting(true)
    try {
      await clientRequestChangesAction(reviewStage.id, feedback)
      await refresh()
      setReviewStage(null)
      setFeedback('')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Your Campaigns</h1>
          <p className="sub">Track progress and manage approvals across active projects.</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <select value={selectedClient} onChange={e => setSelectedClient(e.target.value)}>
            {clientNames.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={selectedStatus} onChange={e => setSelectedStatus(e.target.value)}>
            {STATUS_FILTERS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      <div className="stat-grid">
        <div className="stat-card"><div className="l">Active campaigns</div><div className="v">{activeCount}</div></div>
        <div className="stat-card"><div className="l">Needs approval</div><div className="v" style={{ color: approvalsCount > 0 ? 'var(--amber)' : undefined }}>{approvalsCount}</div></div>
        <div className="stat-card"><div className="l">Avg progress</div><div className="v">{avgCompletion}%</div></div>
      </div>

      {loading ? (
        <p className="hint">Loading…</p>
      ) : filtered.length === 0 ? (
        <div className="card panel-body" style={{ textAlign: 'center', padding: 40 }}>
          <h2>No campaigns found</h2>
          <p className="sub" style={{ marginTop: 8 }}>Try a different client or filter.</p>
        </div>
      ) : (
        filtered.map(c => (
          <div key={c.id} className="card" style={{ marginBottom: 16, padding: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div className="nm">{c.name} <span className={`status-pill ${c.needsApproval ? 'hold' : 'progress'}`}>{c.status}</span></div>
              {c.needsApproval && (
                <button className="btn btn-sm btn-review" onClick={() => {
                  const stage = c.deliverables.flatMap((d: any) => d.stages).find((s: any) => s.status === 'client_review')
                  setReviewStage(stage)
                }}>
                  Review &amp; approve
                </button>
              )}
            </div>
            <div className="track" style={{ marginTop: 12 }}><div style={{ width: `${c.completion}%` }} /></div>
            <div className="meta"><strong style={{ color: 'var(--ink)' }}>{c.completion}%</strong> complete</div>

            {c.deliverables.map((d: any) => (
              <div key={d.id} style={{ marginTop: 14 }}>
                <p style={{ fontSize: 12.5, fontWeight: 600, marginBottom: 6 }}>{d.name}</p>
                <div className="stage-chain">
                  {d.stages.map((s: any) => (
                    <div className="stage-card" key={s.id}>
                      <span className={`stage-status ${s.status}`}>{STAGE_LABELS[s.status] ?? s.status}</span>
                      <div className="nm">{s.stage_name}</div>
                      {s.status === 'client_review' && <div className="no-assign">Action required</div>}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ))
      )}

      {reviewStage && (
        <div className="modal-overlay" onClick={() => setReviewStage(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div><h2>Review: {reviewStage.stage_name}</h2></div>
              <span className="switch-link" onClick={() => setReviewStage(null)}>✕</span>
            </div>
            <div className="modal-body">
              <div className="review-section">
                <h3>Deliverable</h3>
                <div className="review-box" style={{ textAlign: 'center' }}>
                  <div className="asset-placeholder">Preview not available in this build</div>
                </div>
              </div>
              <div className="review-section">
                <h3>Your feedback (optional for approval, required for changes)</h3>
                <textarea
                  className="review-comment"
                  placeholder="Enter feedback, or reasons for requesting changes…"
                  value={feedback}
                  onChange={e => setFeedback(e.target.value)}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-danger" onClick={handleRequestChanges} disabled={submitting}>Request changes</button>
              <button className="btn btn-success" onClick={handleApprove} disabled={submitting}>Approve</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}