import Link from 'next/link'
import { StatCard } from '@/components/ui/StatCard'
import { getCurrentManager, getManagerCampaigns, getManagerTeam, findMyStage } from '@/lib/manager-data'
import { deriveDisplayStatus } from '@/lib/manager-status'

export default async function ManagerDashboard() {
  const manager = await getCurrentManager()
  if (!manager) return null
  const campaigns = await getManagerCampaigns(manager.department)
  const team = await getManagerTeam(manager.department)

  const sc = { active: 0, awaitingReview: 0, feedback: 0, complete: 0, blocked: 0 }
  const myDeliverables: { campaign: typeof campaigns[number]; deliverable: typeof campaigns[number]['deliverables'][number]; stage: NonNullable<ReturnType<typeof findMyStage>> }[] = []

  campaigns.forEach(c => {
    c.deliverables.forEach(d => {
      const stage = findMyStage(d, manager.department)
      if (!stage) return
      myDeliverables.push({ campaign: c, deliverable: d, stage })
      const display = deriveDisplayStatus(stage, d.stages)
      if (display === 'ready' || display === 'in_progress') sc.active++
      else if (display === 'manager_review' || display === 'client_review') sc.awaitingReview++
      else if (display === 'feedback') sc.feedback++
      else if (display === 'complete') sc.complete++
      else if (display === 'blocked' || display === 'hold') sc.blocked++
    })
  })
  const scTotal = Math.max(1, sc.active + sc.awaitingReview + sc.feedback + sc.complete + sc.blocked)

  const delayed = campaigns.filter(c => c.timeScale === 'Delayed').length
  const onTime = campaigns.filter(c => c.timeScale === 'On-Time').length

  const escalations = myDeliverables.filter(({ campaign, deliverable, stage }) =>
    campaign.timeScale === 'Delayed' && deriveDisplayStatus(stage, deliverable.stages) !== 'complete'
  )

  const needsAttention = myDeliverables.filter(({ stage, deliverable }) => deriveDisplayStatus(stage, deliverable.stages) === 'feedback')

  return (
    <div>
      <div className="page-head"><div><h1>Dashboard</h1></div></div>

      <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(5,1fr)' }}>
        <StatCard label={`Active in ${manager.department}`} value={myDeliverables.length} />
        <StatCard label="Escalations" value={escalations.length} danger />
        <StatCard label="Delayed campaigns" value={delayed} danger />
        <StatCard label="On-Time campaigns" value={onTime} />
        <StatCard label="Ready to hand off" value={sc.complete} />
      </div>

      <div className="card" style={{ marginBottom: 20, padding: '14px 18px' }}>
        <span className="hint" style={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.3 }}>{manager.department} team</span>
        <span style={{ marginLeft: 10, fontSize: 12.5, color: 'var(--ink-soft)' }}>{team.length} member{team.length !== 1 ? 's' : ''}</span>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="panel-head"><h2>My Stage Workload</h2><span className="hint">{manager.department} stage, across every deliverable that needs it</span></div>
        <div className="panel-body">
          <div style={{ display: 'flex', height: 34, borderRadius: 7, overflow: 'hidden' }}>
            {sc.active > 0 && <div style={{ width: `${(sc.active / scTotal) * 100}%`, background: 'var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden' }}>Active · {sc.active}</div>}
            {sc.awaitingReview > 0 && <div style={{ width: `${(sc.awaitingReview / scTotal) * 100}%`, background: 'var(--violet)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden' }}>Awaiting review · {sc.awaitingReview}</div>}
            {sc.feedback > 0 && <div style={{ width: `${(sc.feedback / scTotal) * 100}%`, background: 'var(--danger)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden' }}>Needs revision · {sc.feedback}</div>}
            {sc.complete > 0 && <div style={{ width: `${(sc.complete / scTotal) * 100}%`, background: 'var(--amber)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden' }}>Complete · {sc.complete}</div>}
            {sc.blocked > 0 && <div style={{ width: `${(sc.blocked / scTotal) * 100}%`, background: 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)', fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden' }}>Blocked · {sc.blocked}</div>}
          </div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="panel-head"><h2>Action Needed</h2><span className="hint">Client sent feedback — needs reassignment</span></div>
        <div className="panel-body" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {needsAttention.length === 0 && <p className="hint">Nothing needs your attention right now.</p>}
          {needsAttention.map(({ campaign, deliverable, stage }) => (
            <div key={stage.id} style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'var(--surface-2)', borderRadius: 9, padding: '11px 13px' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 12.5 }}>{deliverable.name} — {stage.stageName} · Iteration {stage.revisionCount}</div>
                <div className="hint">{campaign.projectName} · {campaign.clientName}</div>
              </div>
              <Link href={`/manager/campaigns/${campaign.projectId}`} className="btn btn-primary" style={{ textDecoration: 'none' }}>Review</Link>
            </div>
          ))}
        </div>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="panel-head"><h2>Escalations</h2><span className="hint">Delayed campaigns with open {manager.department} work</span></div>
        <div className="panel-body" style={{ padding: '0 18px 6px' }}>
          {escalations.length === 0 && <p className="hint" style={{ padding: '12px 0' }}>No escalations right now.</p>}
          {escalations.length > 0 && (
            <table className="data">
              <thead><tr><th>Deliverable</th><th>Client</th><th>Stage</th></tr></thead>
              <tbody>
                {escalations.map(({ campaign, deliverable, stage }) => (
                  <tr key={stage.id}>
                    <td className="name-cell">{deliverable.name}</td>
                    <td>{campaign.clientName}</td>
                    <td>{stage.stageName}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <p className="hint">
        Recent Activity isn&apos;t shown — there&apos;s no activity/audit-log table in the schema yet
        to derive it from honestly.
      </p>
    </div>
  )
}