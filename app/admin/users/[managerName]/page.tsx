import { getManagerStats } from '@/lib/data-access'

export default async function ManagerDetail({ params }: { params: Promise<{ managerName: string }> }) {
  const { managerName } = await params
  const name = decodeURIComponent(managerName)
  const stats = await getManagerStats(name)

  return (
    <div>
      <div className="crumb">
        <a href="/admin/users" style={{ color: 'var(--ink-soft)', textDecoration: 'underline' }}>Users & Roles</a>
        {' · '}{name}
      </div>

      <div className="page-head">
        <div>
          <h1>{name}</h1>
          <p className="sub">Manages {stats.clients.length} client{stats.clients.length !== 1 ? 's' : ''}: {stats.clients.join(', ') || '—'}</p>
        </div>
      </div>

      <div className="stat-grid">
        <div className="stat-card"><div className="l">Total projects</div><div className="v">{stats.totalProjects}</div></div>
        <div className="stat-card"><div className="l">Ongoing</div><div className="v">{stats.ongoing.length}</div></div>
        <div className="stat-card"><div className="l">On-time %</div><div className="v">{stats.onTimePercent ?? '—'}%</div></div>
        <div className="stat-card"><div className="l">Avg completion</div><div className="v">{stats.avgCompletion}%</div></div>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="panel-head"><h2>Ongoing Projects</h2></div>
        <div className="panel-body" style={{ padding: '0 18px 6px' }}>
          {stats.ongoing.length === 0 ? (
            <p className="hint" style={{ padding: '12px 0' }}>No ongoing projects.</p>
          ) : (
            <table className="data">
              <thead><tr><th>Project</th><th>Client</th><th>Status</th><th>Completion</th></tr></thead>
              <tbody>
                {stats.ongoing.map(p => (
                  <tr key={p.id}>
                    <td className="name-cell">{p.projectName}</td>
                    <td>{p.clientName}</td>
                    <td>{p.status}</td>
                    <td>{p.completionPercent}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <div className="card">
        <div className="panel-head"><h2>Previous Projects</h2></div>
        <div className="panel-body" style={{ padding: '0 18px 6px' }}>
          {stats.previous.length === 0 ? (
            <p className="hint" style={{ padding: '12px 0' }}>No completed projects yet.</p>
          ) : (
            <table className="data">
              <thead><tr><th>Project</th><th>Client</th><th>Status</th><th>Time scale</th></tr></thead>
              <tbody>
                {stats.previous.map(p => (
                  <tr key={p.id}>
                    <td className="name-cell">{p.projectName}</td>
                    <td>{p.clientName}</td>
                    <td>{p.status}</td>
                    <td style={{ color: p.timeScale === 'Delayed' ? 'var(--danger)' : 'var(--success)' }}>{p.timeScale ?? '—'}</td>
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