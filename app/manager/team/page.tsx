import { getCurrentManager, getManagerTeamWorkload } from '@/lib/manager-data'

export default async function ManagerTeam() {
  const manager = await getCurrentManager()
  if (!manager) return null
  const team = await getManagerTeamWorkload(manager.department)

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Team</h1>
          <p className="sub">{team.length} people — your {manager.department} team, across every client</p>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="panel-head"><h2>Workload</h2></div>
        <div className="panel-body" style={{ padding: '0 18px 6px' }}>
          {team.length === 0 && <p className="hint" style={{ padding: '12px 0' }}>No members in {manager.department} yet — invite some from Admin → Users.</p>}
          {team.length > 0 && (
            <table className="data">
              <thead><tr><th>Person</th><th>Open stages</th></tr></thead>
              <tbody>
                {team.map(m => (
                  <tr key={m.id}>
                    <td className="name-cell">{m.name}</td>
                    <td>{m.openCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <p className="hint">
        Leave &amp; Reassignment and Activity Log aren&apos;t shown here yet — they need the real
        <code style={{ margin: '0 4px' }}>leave_requests</code> table schema confirmed before wiring them up honestly,
        rather than guessing at column names.
      </p>
    </div>
  )
}