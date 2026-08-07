import { StatCard } from '@/components/ui/StatCard'
import {
  getSystemOverview, getManagerEfficiency, getStageBottlenecks,
  getClientHealth, getAgingWork, getOnTimeTrend, getSkillGaps,
  getTeamToday, getPipelineStages
} from '@/lib/data-access'

function severityColor(sev: string) {
  if (sev === 'high') return 'var(--danger)'
  if (sev === 'medium') return 'var(--amber)'
  return 'var(--success)'
}

function severityBg(sev: string) {
  if (sev === 'high') return 'var(--danger-soft)'
  if (sev === 'medium') return 'var(--amber-soft)'
  return 'var(--success-soft)'
}

function healthColor(score: number) {
  if (score < 65) return 'var(--danger)'
  if (score < 80) return 'var(--amber)'
  return 'var(--success)'
}

export default async function AdminOverview() {
  const { stats, escalations } = await getSystemOverview()
  const managerEfficiency = await getManagerEfficiency()
  const stageBottlenecks = await getStageBottlenecks()
  const clientHealth = await getClientHealth()
  const agingWork = await getAgingWork()
  const onTimeTrend = await getOnTimeTrend()
  const skillGaps = await getSkillGaps()
  const teamToday = await getTeamToday()
  const pipelineStages = await getPipelineStages()
  const totalPipeline = pipelineStages.reduce((sum, s) => sum + s.count, 0)
  return (
    <div>
      <div className="page-head">
        <div>
          <h1>System Overview</h1>
          <p className="sub">Everything, rolled up.</p>
        </div>
      </div>

      {/* Executive pulse */}
      <div className="stat-grid">
        <StatCard label="Escalations open" value={stats.escalationsOpen} danger />
        <StatCard label="On-time delivery" value={`${stats.onTimeDelivery}%`} />
        <StatCard label="Avg rework rounds" value={stats.avgReworkRounds} />
        <StatCard label="Ready for billing" value={stats.readyForBilling} />
      </div>

      {/* Team Today */}
      <div className="card" style={{ marginBottom: 20, padding: '14px 18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <span className="hint" style={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.3 }}>Team Today</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'var(--success-soft)', color: 'var(--success)', padding: '5px 12px', borderRadius: 20, fontSize: 12.5, fontWeight: 600 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--success)' }} />
            {teamToday.available} available
          </span>
          {teamToday.atCapacity.map((p, i) => (
            <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'var(--danger-soft)', color: 'var(--danger)', padding: '5px 12px', borderRadius: 20, fontSize: 12.5, fontWeight: 600 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--danger)' }} />
              1 at capacity — {p.name}
            </span>
          ))}
          {teamToday.onLeave.map((p, i) => (
            <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'var(--amber-soft)', color: 'var(--amber)', padding: '5px 12px', borderRadius: 20, fontSize: 12.5, fontWeight: 600 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--amber)' }} />
              1 on leave — {p.name}
            </span>
          ))}
        </div>
      </div>

      {/* Pipeline Overview */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="panel-head">
          <h2>Pipeline Overview</h2>
          <span className="hint">{totalPipeline} deliverables across your campaigns, by stage</span>
        </div>
        <div className="panel-body">
          <div style={{ display: 'flex', borderRadius: 10, overflow: 'hidden' }}>
            {pipelineStages.map((s, i) => (
              <div
                key={i}
                style={{
                  flex: s.count, background: s.color, color: '#fff', padding: '10px 16px',
                  fontSize: 12.5, fontWeight: 600, textAlign: 'center', whiteSpace: 'nowrap'
                }}
              >
                {s.stage} · {s.count}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Stage Bottleneck Heatmap */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="panel-head">
          <h2>Stage Bottlenecks</h2>
          <span className="hint">Avg time vs baseline, across all active campaigns</span>
        </div>
        <div className="panel-body" style={{ padding: '0 18px 6px' }}>
          <table className="data">
            <thead>
              <tr><th>Stage</th><th>Avg time</th><th>Baseline</th><th>Overrun</th><th>In campaigns</th><th>Status</th></tr>
            </thead>
            <tbody>
              {stageBottlenecks.map((s, i) => {
                const overrunPct = Math.round(((s.avgHours - s.baselineHours) / s.baselineHours) * 100)
                return (
                  <tr key={i}>
                    <td className="name-cell">{s.stage}</td>
                    <td>{s.avgHours}h</td>
                    <td>{s.baselineHours}h</td>
                    <td style={{ color: overrunPct > 0 ? 'var(--danger)' : 'var(--success)', fontWeight: 600 }}>
                      {overrunPct > 0 ? '+' : ''}{overrunPct}%
                    </td>
                    <td>{s.campaigns}</td>
                    <td>
                      <span style={{
                        fontSize: 10, fontWeight: 700, padding: '2px 9px', borderRadius: 20,
                        color: severityColor(s.severity), background: severityBg(s.severity)
                      }}>
                        {s.severity.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Aging Work-in-Progress + Skill Coverage Gaps */}
      <div className="two-col" style={{ marginBottom: 20 }}>
        <div className="card">
          <div className="panel-head">
            <h2>Aging Work-in-Progress</h2>
            <span className="hint">Untouched longest, regardless of manager</span>
          </div>
          <div className="panel-body" style={{ padding: '0 18px 6px' }}>
            <table className="data">
              <thead>
                <tr><th>Task</th><th>Campaign</th><th>Assignee</th><th>Days stale</th></tr>
              </thead>
              <tbody>
                {agingWork.map((w, i) => (
                  <tr key={i}>
                    <td className="name-cell">{w.task}</td>
                    <td>{w.campaign}</td>
                    <td>{w.assignee}</td>
                    <td style={{ color: 'var(--danger)', fontWeight: 600 }}>{w.daysStale}d</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <div className="panel-head">
            <h2>Skill Coverage Gaps</h2>
            <span className="hint">Demand vs. available team supply</span>
          </div>
          <div className="panel-body" style={{ padding: '0 18px 6px' }}>
            <table className="data">
              <thead>
                <tr><th>Skill</th><th>Demand</th><th>Supply</th><th>Gap</th></tr>
              </thead>
              <tbody>
                {skillGaps.map((s, i) => (
                  <tr key={i}>
                    <td className="name-cell">{s.skill}</td>
                    <td>{s.demand}</td>
                    <td>{s.supply}</td>
                    <td style={{ color: s.gap > 3 ? 'var(--danger)' : 'var(--amber)', fontWeight: 600 }}>{s.gap}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Manager Efficiency */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="panel-head">
          <h2>Manager Efficiency</h2>
          <span className="hint">Load and performance by manager</span>
        </div>
        <div className="panel-body" style={{ padding: '0 18px 6px' }}>
          <table className="data">
            <thead>
              <tr>
                <th>Manager</th><th>Active campaigns</th><th>On-time %</th>
                <th>Avg rework</th><th>Team load</th><th>Escalations</th>
              </tr>
            </thead>
            <tbody>
              {managerEfficiency.map((m, i) => (
                <tr key={i}>
                  <td className="name-cell">{m.manager}</td>
                  <td>{m.activeCampaigns}</td>
                  <td style={{ color: m.onTimePercent < 75 ? 'var(--danger)' : 'var(--ink-soft)' }}>{m.onTimePercent}%</td>
                  <td>{m.avgRework}</td>
                  <td>
                    <div className="track" style={{ margin: 0, width: 80, display: 'inline-block' }}>
                      <div style={{ width: `${m.teamLoad}%`, background: m.teamLoad >= 75 ? 'var(--danger)' : 'var(--primary)' }} />
                    </div>
                    <span style={{ marginLeft: 8, fontSize: 11 }}>{m.teamLoad}%</span>
                  </td>
                  <td style={{ color: m.escalations > 0 ? 'var(--danger)' : 'var(--ink-soft)', fontWeight: m.escalations > 0 ? 600 : 400 }}>
                    {m.escalations}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Escalations */}
      <div className="card">
        <div className="panel-head"><h2>Escalations</h2><span className="hint">Needs executive attention</span></div>
        <div className="panel-body" style={{ padding: '0 18px 6px' }}>
          <table className="data">
            <thead>
              <tr><th>Campaign</th><th>Client</th><th>Issue</th><th>Days overdue</th></tr>
            </thead>
            <tbody>
              {escalations.map((e, i) => (
                <tr key={i}>
                  <td className="name-cell">{e.campaign}</td>
                  <td>{e.client}</td>
                  <td>{e.issue}</td>
                  <td style={{ color: 'var(--danger)', fontWeight: 600 }}>{e.daysOverdue}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}