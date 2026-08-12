import { getCurrentManager, getManagerCampaigns, findMyStage } from '@/lib/manager-data'
import { ApprovalRow } from '@/components/manager/ApprovalRow'

export default async function ManagerApprovals() {
  const manager = await getCurrentManager()
  if (!manager) return null
  const campaigns = await getManagerCampaigns(manager.department)

  const rows: Record<'manager_review' | 'client_review' | 'feedback' | 'complete', ReturnType<typeof buildRow>[]> = {
    manager_review: [], client_review: [], feedback: [], complete: [],
  }

  function buildRow(c: typeof campaigns[number], d: typeof campaigns[number]['deliverables'][number], stage: NonNullable<ReturnType<typeof findMyStage>>) {
    return {
      stageId: stage.id,
      deliverableName: d.name,
      stageName: stage.stageName,
      campaignName: c.projectName,
      clientName: c.clientName,
      revisionCount: stage.revisionCount,
      note: stage.note,
    }
  }

  campaigns.forEach(c => {
    c.deliverables.forEach(d => {
      const stage = findMyStage(d, manager.department)
      if (!stage) return
      if (stage.status in rows) {
        rows[stage.status as keyof typeof rows].push(buildRow(c, d, stage))
      }
    })
  })

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Approvals</h1>
          <p className="sub">{manager.department}&apos;s two gates: you approve first, then the client — every stage repeats this, not just the last one</p>
        </div>
      </div>

      <div className="two-col">
        <div className="card">
          <div className="panel-head"><h2>Awaiting your review</h2><span className="hint">Submitted by the team, not yet approved by you</span></div>
          <div className="panel-body">
            {rows.manager_review.length === 0 && <p className="hint">Nothing waiting on you right now.</p>}
            {rows.manager_review.map(row => <ApprovalRow key={row.stageId} row={row} kind="manager_review" />)}
          </div>
        </div>

        <div className="card">
          <div className="panel-head"><h2>Sent to client</h2><span className="hint">You&apos;ve approved — awaiting client response</span></div>
          <div className="panel-body">
            {rows.client_review.length === 0 && <p className="hint">Nothing with the client right now.</p>}
            {rows.client_review.map(row => <ApprovalRow key={row.stageId} row={row} kind="client_review" />)}
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <div className="panel-head"><h2>Client requested changes</h2><span className="hint">Loops back to the team — same stage, next iteration</span></div>
        <div className="panel-body">
          {rows.feedback.length === 0 && <p className="hint">No revisions in progress right now.</p>}
          {rows.feedback.map(row => <ApprovalRow key={row.stageId} row={row} kind="feedback" />)}
        </div>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <div className="panel-head"><h2>Approved</h2><span className="hint">Client signed off — {manager.department}&apos;s job here is done</span></div>
        <div className="panel-body" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {rows.complete.length === 0 && <p className="hint">Nothing completed yet.</p>}
          {rows.complete.map(row => <ApprovalRow key={row.stageId} row={row} kind="complete" />)}
        </div>
      </div>
    </div>
  )
}