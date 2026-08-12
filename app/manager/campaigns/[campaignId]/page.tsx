import Link from 'next/link'
import { Fragment } from 'react'
import { notFound } from 'next/navigation'
import { getCurrentManager, getManagerCampaignById, getManagerTeam, findMyStage } from '@/lib/manager-data'
import { STATUS_META, deriveDisplayStatus, statusLabel, waitingOnLabel } from '@/lib/manager-status'
import { MyStageCard } from '@/components/manager/MyStageCard'

export default async function ManagerCampaignDetail({ params }: { params: Promise<{ campaignId: string }> }) {
  const { campaignId } = await params
  const manager = await getCurrentManager()
  if (!manager) return null

  const campaign = await getManagerCampaignById(manager.department, Number(campaignId))
  if (!campaign) return notFound()

  const team = await getManagerTeam(manager.department)
  const teamNames = team.map(t => t.name)

  return (
    <div>
      <div className="hint" style={{ marginBottom: 10 }}>
        <Link href="/manager/campaigns" style={{ color: 'var(--ink-soft)' }}>Campaigns</Link> · {campaign.clientName} · {campaign.projectName}
      </div>

      <div className="page-head">
        <div>
          <h1>{campaign.projectName} <span className="status-pill progress">{campaign.status}</span></h1>
        </div>
        <div className="stat-card" style={{ minWidth: 200 }}>
          <div className="l">Time Scale</div>
          <div className="v" style={{ color: campaign.timeScale === 'Delayed' ? 'var(--danger)' : 'var(--success)' }}>{campaign.timeScale ?? '—'}</div>
          {campaign.startDate && <div className="hint" style={{ marginTop: 8 }}>Deadline: <b style={{ color: 'var(--ink-soft)' }}>{campaign.startDate}</b></div>}
        </div>
      </div>

      <p className="hint" style={{ marginBottom: 16 }}>
        All stages are shown for context — this is how every manager sees the full picture, including feedback
        rounds happening on stages they don&apos;t own. You can only assign and manage <b style={{ color: 'var(--ink-soft)' }}>{manager.department}</b>;
        other stages are read-only, and each stays Blocked until the one before it clears client approval.
      </p>

      {campaign.deliverables.map(d => {
        const myStage = findMyStage(d, manager.department)
        if (!myStage) return null

        return (
          <div key={d.id} style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 9 }}>
              {d.name} <span className="hint">— {d.contentFormat}</span>
            </div>
            <div className="stage-chain">
              {d.stages.map(s => {
                if (s.id === myStage.id) {
                  return <MyStageCard key={s.id} stage={s} allStages={d.stages} teamNames={teamNames} />
                }
                const meta = STATUS_META[deriveDisplayStatus(s, d.stages)]
                return (
                  <div key={s.id} className="stage-card" style={{ background: 'var(--surface-2)', opacity: 0.75 }}>
                    <span className="stage-num">{s.stageOrder}</span>
                    <span className="stage-status" style={{ background: meta.bg, color: meta.fg }}>{statusLabel(s, d.stages)}</span>
                    <div className="nm">{s.stageName} <span style={{ fontSize: 10, opacity: 0.6 }}>🔒</span></div>
                    {waitingOnLabel(s, d.stages) && (
                      <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 7, fontStyle: 'italic' }}>{waitingOnLabel(s, d.stages)}</div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}

      <div className="card">
        <div className="panel-head"><h2>Schedule</h2><span className="hint">Stage timeline across every deliverable</span></div>
        <div className="panel-body" style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11.5 }}>
            <tbody>
              {campaign.deliverables.map(d => (
                <Fragment key={d.id}>
                  <tr style={{ background: 'var(--surface-2)' }}>
                    <td colSpan={2} style={{ fontWeight: 700, color: 'var(--ink)', padding: '7px 10px' }}>{d.name}</td>
                  </tr>
                  {d.stages.map(s => {
                    const display = deriveDisplayStatus(s, d.stages)
                    const m = STATUS_META[display]
                    return (
                      <tr key={s.id}>
                        <td style={{ color: 'var(--ink-soft)', fontWeight: 600, padding: '7px 10px', whiteSpace: 'nowrap', width: 170 }}>{s.stageOrder}. {s.stageName}</td>
                        <td style={{ padding: '7px 10px', borderBottom: '1px solid var(--surface-2)' }}>
                          <div style={{
                            height: 16, borderRadius: 4, width: display === 'blocked' ? '18%' : '35%',
                            background: display === 'blocked' ? 'var(--surface-2)' : m.fg,
                            border: display === 'blocked' ? '1px dashed var(--border)' : undefined,
                          }} />
                        </td>
                      </tr>
                    )
                  })}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}