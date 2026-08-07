import { getClientPortalData } from '@/lib/data-access'

export default async function ClientApprovals() {
  const { clientName, poc, pendingApproval } = await getClientPortalData()

  return (
    <div>
      <div className="client-banner">
        <div className="who">Viewing as <b>{poc}</b> · {clientName}</div>
        <button className="btn btn-primary">+ Submit a new brief</button>
      </div>

      <div className="page-head">
        <div>
          <h1>Awaiting Your Approval</h1>
          <p className="sub">{pendingApproval.length} item{pendingApproval.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      {pendingApproval.length === 0 ? (
        <div className="card">
          <div className="panel-body">
            <p className="hint" style={{ padding: '12px 0' }}>Nothing waiting on you right now.</p>
          </div>
        </div>
      ) : (
        pendingApproval.map(p => (
          <div key={p.id} className="approval-card">
            <div className="h">
              <div>
                <div className="nm">{p.projectName}</div>
                <div className="meta">Started {p.startDate}</div>
              </div>
              <span className="status-pill hold" style={{ margin: 0 }}>Pending</span>
            </div>
            <div className="thumb">Preview: {p.contentFormat}</div>
            <textarea className="feedback" placeholder="Add feedback (optional)…" />
            <div className="approval-actions">
              <button className="btn btn-success">Approve</button>
              <button className="btn btn-danger">Request changes</button>
            </div>
          </div>
        ))
      )}
    </div>
  )
}