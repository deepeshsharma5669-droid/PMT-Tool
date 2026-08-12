import { notFound } from 'next/navigation'
import { getProjectsByClient, getAgingProjectsByClient, getClientRollup, getDeliverablesByClient, getManagers } from '@/lib/data-access'
import { ClientDeliverablesPanel } from '@/components/admin/ClientDeliverablesPanel'
import { EditCampaignModal } from '@/components/admin/EditCampaignModal'
import { DeleteCampaignButton } from '@/components/admin/DeleteCampaignButton'

function statusColor(status: string) {
  if (['Delivered', 'Raised Invoice', 'Ready for Invoice', 'Completed'].includes(status)) return 'var(--success)'
  if (['Dropped', 'Scrapped'].includes(status)) return 'var(--muted)'
  if (['Client Approval Pending', 'Under Client Review', 'On Hold', 'Awaiting client approval'].includes(status)) return 'var(--amber)'
  return 'var(--primary)'
}

export default async function ClientDetail({ params }: { params: Promise<{ clientId: string }> }) {
  const { clientId } = await params
  const clientName = decodeURIComponent(clientId)
  const projects = await getProjectsByClient(clientName)
  const aging = await getAgingProjectsByClient(clientName)
  const rollup = await getClientRollup()
  const summary = rollup.find(c => c.client === clientName)
  const deliverablesData = await getDeliverablesByClient(clientName)
  const managers = await getManagers()

  if (!summary) notFound()

  const formatCounts: Record<string, number> = {}
  projects.forEach(p => {
    formatCounts[p.contentFormat] = (formatCounts[p.contentFormat] || 0) + 1
  })

  const priorityCounts: Record<string, number> = {}
  projects.forEach(p => {
    priorityCounts[p.priority] = (priorityCounts[p.priority] || 0) + 1
  })

  return (
    <div>
      <div className="crumb">
        <a href="/admin/clients" style={{ color: 'var(--ink-soft)', textDecoration: 'underline' }}>Clients</a>
        {' · '}{clientName}
      </div>

      <div className="page-head">
        <div>
          <h1>{clientName}</h1>
          <p className="sub">Managed by {summary.managers.join(', ') || '—'}</p>
        </div>
      </div>

      <div className="stat-grid">
        <div className="stat-card"><div className="l">Total projects</div><div className="v">{summary.totalProjects}</div></div>
        <div className="stat-card"><div className="l">Active</div><div className="v">{summary.activeCount}</div></div>
        <div className="stat-card"><div className="l">On-time %</div><div className="v">{summary.onTimePercent ?? '—'}%</div></div>
        <div className="stat-card"><div className="l">Avg completion</div><div className="v">{summary.avgCompletion}%</div></div>
      </div>

      {deliverablesData.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <ClientDeliverablesPanel deliverables={deliverablesData} />
        </div>
      )}

      <div className="two-col" style={{ marginBottom: 20 }}>
        <div className="card">
          <div className="panel-head"><h2>Deliverables Mix</h2></div>
          <div className="panel-body" style={{ padding: '0 18px 6px' }}>
            <table className="data">
              <thead><tr><th>Format</th><th>Count</th></tr></thead>
              <tbody>
                {Object.entries(formatCounts).map(([format, count]) => (
                  <tr key={format}><td className="name-cell">{format}</td><td>{count}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <div className="panel-head"><h2>Priority Distribution</h2></div>
          <div className="panel-body" style={{ padding: '0 18px 6px' }}>
            <table className="data">
              <thead><tr><th>Priority</th><th>Count</th></tr></thead>
              <tbody>
                {Object.entries(priorityCounts).map(([priority, count]) => (
                  <tr key={priority}><td className="name-cell">{priority}</td><td>{count}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {aging.length > 0 && (
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="panel-head">
            <h2>Aging Open Projects</h2>
            <span className="hint">Still active, sorted by days open</span>
          </div>
          <div className="panel-body" style={{ padding: '0 18px 6px' }}>
            <table className="data">
              <thead><tr><th>Project</th><th>Status</th><th>Days open</th></tr></thead>
              <tbody>
                {aging.map(p => (
                  <tr key={p.id}>
                    <td className="name-cell">{p.projectName}</td>
                    <td style={{ color: statusColor(p.status) }}>{p.status}</td>
                    <td style={{ color: p.daysOpen > 60 ? 'var(--danger)' : 'var(--ink-soft)', fontWeight: p.daysOpen > 60 ? 600 : 400 }}>
                      {p.daysOpen}d
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="card">
        <div className="panel-head">
          <h2>All Projects</h2>
          <span className="hint">{projects.length} total</span>
        </div>
        <div className="panel-body" style={{ padding: '0 18px 6px' }}>
          <table className="data">
            <thead>
              <tr><th>Project</th><th>POC</th><th>Format</th><th>Status</th><th>Priority</th><th>Completion</th><th></th></tr>
            </thead>
            <tbody>
              {projects.map(p => (
                <tr key={p.id}>
                  <td className="name-cell">{p.projectName}</td>
                  <td>{p.clientPoc}</td>
                  <td>{p.contentFormat}</td>
                  <td style={{ color: statusColor(p.status) }}>{p.status}</td>
                  <td>{p.priority}</td>
                  <td>{p.completionPercent}%</td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <EditCampaignModal
                        project={{ id: p.id, projectName: p.projectName, manager: p.manager, priority: p.priority, status: p.status, startDate: p.startDate }}
                        managers={managers.map((m: { id: number; name: string; department: string | null }) => ({ id: m.id, name: m.name, department: m.department }))}
                      />
                      <DeleteCampaignButton id={p.id} name={p.projectName} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}