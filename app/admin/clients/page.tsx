import { getClientRollup, getClientBlockingBreakdown, getClientHealth } from '@/lib/data-access'

function onTimeColor(pct: number | null) {
  if (pct === null) return 'var(--muted)'
  if (pct < 60) return 'var(--danger)'
  if (pct < 80) return 'var(--amber)'
  return 'var(--success)'
}
function healthColor(score: number) {
  if (score < 65) return 'var(--danger)'
  if (score < 80) return 'var(--amber)'
  return 'var(--success)'
}

function riskColor(pct: number) {
  if (pct > 20) return 'var(--danger)'
  if (pct > 10) return 'var(--amber)'
  return 'var(--ink-soft)'
}

export default async function AdminClients() {
  const rollup = await getClientRollup()
  const blocking = await getClientBlockingBreakdown()
  const clientHealth = await getClientHealth()

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Clients</h1>
          <p className="sub">{rollup.length} total</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
  <a href="/admin/clients/new-client" className="btn btn-ghost" style={{ textDecoration: 'none' }}>+ Add client</a>
  <a href="/admin/clients/new-campaign" className="btn btn-primary" style={{ textDecoration: 'none' }}>+ New campaign</a>
</div>
      </div>

      {/* Per-client rollup */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="panel-head">
          <h2>Client Overview</h2>
          <span className="hint">Computed from live project data</span>
        </div>
        <div className="panel-body" style={{ padding: '0 18px 6px' }}>
          <table className="data">
            <thead>
              <tr>
                <th>Client</th>
                <th>Total projects</th>
                <th>Active</th>
                <th>Closed</th>
                <th>On-time %</th>
                <th>Avg completion</th>
                <th>Dropped/Scrapped</th>
                <th>Managers</th>
              </tr>
            </thead>
            <tbody>
              {rollup.map(c => (
                <tr key={c.client}>
                  <td className="name-cell">
                    <a href={`/admin/clients/${encodeURIComponent(c.client)}`} style={{ color: 'inherit', textDecoration: 'underline' }}>
                      {c.client}
                    </a>
                  </td>
                  <td>{c.totalProjects}</td>
                  <td>{c.activeCount}</td>
                  <td>{c.closedCount}</td>
                  <td style={{ color: onTimeColor(c.onTimePercent), fontWeight: 700 }}>
                    {c.onTimePercent === null ? '—' : `${c.onTimePercent}%`}
                  </td>
                  <td>{c.avgCompletion}%</td>
                  <td style={{ color: riskColor(c.droppedScrappedPercent), fontWeight: c.droppedScrappedPercent > 10 ? 600 : 400 }}>
                    {c.droppedScrappedPercent}%
                  </td>
                  <td style={{ fontSize: 11.5 }}>{c.managers.join(', ') || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

       {/* Client Health */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="panel-head">
          <h2>Client Health</h2>
          <span className="hint">Score, trend, and renewal risk</span>
        </div>
        <div className="panel-body" style={{ padding: '0 18px 6px' }}>
          <table className="data">
            <thead>
              <tr><th>Client</th><th>Score</th><th>Trend</th><th>Avg revisions</th><th>Renewal</th></tr>
            </thead>
            <tbody>
              {clientHealth.map((c, i) => (
                <tr key={i}>
                  <td className="name-cell">{c.client}</td>
                  <td style={{ color: healthColor(c.healthScore), fontWeight: 700 }}>{c.healthScore}</td>
                  <td>{c.trend === 'up' ? '↑' : c.trend === 'down' ? '↓' : '→'}</td>
                  <td>{c.avgRevisions}</td>
                  <td style={{ fontSize: 11.5 }}>{c.renewalDate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Client-side blocking breakdown */}
      <div className="card">
        <div className="panel-head">
          <h2>Client-Side Bottlenecks</h2>
          <span className="hint">Projects waiting on the client, not the team</span>
        </div>
        <div className="panel-body" style={{ padding: '0 18px 6px' }}>
          {blocking.length === 0 ? (
            <p className="hint" style={{ padding: '12px 0' }}>No client-side blockers right now.</p>
          ) : (
            <table className="data">
              <thead>
                <tr><th>Client</th><th>Blocked projects</th><th>Breakdown</th></tr>
              </thead>
              <tbody>
                {blocking.map(b => (
                  <tr key={b.client}>
                    <td className="name-cell">{b.client}</td>
                    <td style={{ color: 'var(--amber)', fontWeight: 700 }}>{b.blockingCount}</td>
                    <td style={{ fontSize: 11.5 }}>
                      {Object.entries(b.byStatus).map(([status, count]) => `${status} (${count})`).join(', ')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}