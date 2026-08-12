import Link from 'next/link'
import { getCurrentManager, getManagerCampaigns, findMyStage } from '@/lib/manager-data'
import { deriveDisplayStatus } from '@/lib/manager-status'

export default async function ManagerCampaigns() {
  const manager = await getCurrentManager()
  if (!manager) return null
  const campaigns = await getManagerCampaigns(manager.department)

  const byClient = new Map<string, typeof campaigns>()
  campaigns.forEach(c => {
    if (!byClient.has(c.clientName)) byClient.set(c.clientName, [])
    byClient.get(c.clientName)!.push(c)
  })

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Campaigns</h1>
          <p className="sub">Showing only campaigns that require the <b style={{ color: 'var(--ink-soft)' }}>{manager.department}</b> stage · across every client</p>
        </div>
      </div>

      {campaigns.length === 0 && <p className="hint">No campaigns currently need {manager.department} work.</p>}

      {Array.from(byClient.entries()).map(([client, list]) => (
        <div key={client} style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <b style={{ fontSize: 13 }}>{client}</b>
            <span className="hint">{list.length} campaign{list.length > 1 ? 's' : ''}</span>
          </div>
          <div className="campaign-grid">
            {list.map(c => {
              const relevant = c.deliverables.filter(d => findMyStage(d, manager.department))
              const complete = relevant.filter(d => {
                const s = findMyStage(d, manager.department)!
                return deriveDisplayStatus(s, d.stages) === 'complete'
              }).length
              const pct = relevant.length ? Math.round((complete / relevant.length) * 100) : 0
              return (
                <Link key={c.projectId} href={`/manager/campaigns/${c.projectId}`} className="campaign-card" style={{ display: 'block', textDecoration: 'none', color: 'inherit' }}>
                  <div className="top">
                    <div className="nm">{c.projectName}</div>
                    <span style={{ fontSize: 10.5, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: c.timeScale === 'Delayed' ? 'var(--danger-soft)' : 'var(--success-soft)', color: c.timeScale === 'Delayed' ? 'var(--danger)' : 'var(--success)' }}>
                      {c.timeScale ?? '—'}
                    </span>
                  </div>
                  <div className="track"><div style={{ width: `${pct}%`, background: pct === 100 ? 'var(--success)' : undefined }} /></div>
                  <div className="meta">
                    <span>{manager.department}: {complete} of {relevant.length} complete</span>
                    <span>{c.status}</span>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}