import { RoleBadge } from '@/components/ui/RoleBadge'
import { getTeamRoster, getUserKpis, getManagers } from '@/lib/data-access'
import { getPendingRegistrations } from '@/app/admin/actions'
import { InviteUserModal } from '@/components/admin/InviteUserModal'
import { ResendPasswordButton } from '@/components/admin/ResendPasswordButton'
import { ApproveRegistrationRow } from '@/components/admin/ApproveRegistrationRow'

export default async function AdminUsers() {
  const roster = await getTeamRoster()
  const kpis = await getUserKpis()
  const managers = await getManagers()
  const pending = await getPendingRegistrations()

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

      {pending.length > 0 && (
        <div className="card" style={{ marginBottom: 20, borderColor: 'var(--amber)' }}>
          <div className="panel-head">
            <h2>Pending Registrations</h2>
            <span className="hint">{pending.length} waiting for a role</span>
          </div>
          <div className="panel-body" style={{ padding: '0 18px 6px' }}>
            <table className="data">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Department</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {pending.map((p: { id: string; name: string; email: string }) => (
                  <ApproveRegistrationRow key={p.id} name={p.name} email={p.email} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="panel-head">
          <h2>Accounts</h2>
          <span className="hint">Login status — resend if someone never finished setup</span>
        </div>
        <div className="panel-body" style={{ padding: '0 18px 6px' }}>
          <table className="data">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Department</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {managers.map((m: { id: number; name: string; email: string; role: string; department: string; must_change_password: boolean }) => (
                <tr key={m.id}>
                  <td className="name-cell">{m.name}</td>
                  <td style={{ fontSize: 12 }}>{m.email ?? '—'}</td>
                  <td><RoleBadge role={m.role as any} /></td>
                  <td>{m.department}</td>
                  <td>
                    {m.must_change_password ? (
                      <span style={{ fontSize: 10.5, fontWeight: 700, padding: '3px 9px', borderRadius: 20, background: 'var(--amber-soft)', color: 'var(--amber)' }}>
                        Pending setup
                      </span>
                    ) : (
                      <span style={{ fontSize: 10.5, fontWeight: 700, padding: '3px 9px', borderRadius: 20, background: 'var(--success-soft)', color: 'var(--success)' }}>
                        Active
                      </span>
                    )}
                  </td>
                  <td>
                    {m.must_change_password && m.email && (
                      <ResendPasswordButton email={m.email} role={m.role} />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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