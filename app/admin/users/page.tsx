import { RoleBadge } from '@/components/ui/RoleBadge'
import { getTeamRoster, getUserKpis } from '@/lib/data-access'
import { InviteUserModal } from '@/components/admin/InviteUserModal'

export default async function AdminUsers() {
  const roster = await getTeamRoster()
  const kpis = await getUserKpis()

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Users &amp; Roles</h1>
          <p className="sub">{kpis.totalUsers} people across active projects</p>
        </div>
        <InviteUserModal />
      </div>

      <div className="stat-grid">
        <div className="stat-card"><div className="l">Total people</div><div className="v">{kpis.totalUsers}</div></div>
        <div className="stat-card"><div className="l">Managers</div><div className="v">{kpis.managers}</div></div>
        <div className="stat-card"><div className="l">Members</div><div className="v">{kpis.members}</div></div>
        <div className="stat-card">
          <div className="l">Overloaded (5+ open)</div>
          <div className="v" style={{ color: kpis.overloaded > 0 ? 'var(--danger)' : undefined }}>{kpis.overloaded}</div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="panel-head">
          <h2>Team Roster</h2>
          <span className="hint">Derived from live project assignments</span>
        </div>
        <div className="panel-body" style={{ padding: '0 18px 6px' }}>
          <table className="data">
            <thead>
              <tr>
                <th>User</th>
                <th>Department</th>
                <th>Role</th>
                <th>Managing</th>
                <th>Assigned</th>
                <th>Open projects</th>
                <th>Clients touched</th>
              </tr>
            </thead>
            <tbody>
              {roster.map(u => (
                <tr key={u.name}>
                  <td className="name-cell">
                    {u.role === 'Manager' ? (
                      <a href={`/admin/users/${encodeURIComponent(u.name)}`} style={{ color: 'inherit', textDecoration: 'underline' }}>
                        {u.name}
                      </a>
                    ) : u.name}
                  </td>
                  <td>{u.department}</td>
                  <td><RoleBadge role={u.role as any} /></td>
                  <td>{u.managerOfCount}</td>
                  <td>{u.assigneeOfCount}</td>
                  <td style={{ color: u.openProjectCount > 5 ? 'var(--danger)' : u.openProjectCount === 0 ? 'var(--muted)' : 'var(--ink-soft)', fontWeight: u.openProjectCount > 5 ? 600 : 400 }}>
                    {u.openProjectCount}
                  </td>
                  <td style={{ fontSize: 11.5 }}>{u.clients.join(', ')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <div className="panel-head"><h2>Permission Matrix</h2><span className="hint">What each role can do</span></div>
        <div className="panel-body" style={{ padding: '0 18px 6px' }}>
          <table className="data">
            <thead><tr><th>What</th><th>Admin</th><th>Manager</th><th>Member</th><th>Client</th></tr></thead>
            <tbody>
              <tr><td className="name-cell">Manage clients</td><td>✓</td><td>View only</td><td>—</td><td>—</td></tr>
              <tr><td className="name-cell">Create/edit campaigns</td><td>✓</td><td>✓</td><td>View only</td><td>View only</td></tr>
              <tr><td className="name-cell">Assign work</td><td>✓</td><td>✓</td><td>—</td><td>—</td></tr>
              <tr><td className="name-cell">Do assigned tasks</td><td>—</td><td>—</td><td>Own tasks only</td><td>—</td></tr>
              <tr><td className="name-cell">Approve deliverables</td><td>✓</td><td>Internal only</td><td>—</td><td>Final approval</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}