'use client'
import Link from 'next/link'
import { useManagerStore } from '@/lib/data/manager-store'

export default function ManagerCampaigns() {
  const campaigns = useManagerStore((s) => s.campaigns)
  const byClient = new Map<string, typeof campaigns>()
  campaigns.forEach((c) => {
    if (!byClient.has(c.client)) byClient.set(c.client, [])
    byClient.get(c.client)!.push(c)
  })

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Campaigns</h1>
          <p className="sub">Showing only campaigns that require the <b style={{ color: 'var(--ink-soft)' }}>Content</b> stage · across every client</p>
        </div>
      </div>

      {Array.from(byClient.entries()).map(([client, list]) => (
        <div key={client} style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <b style={{ fontSize: 13 }}>{client}</b>
            <span className="hint">{list.length} campaign{list.length > 1 ? 's' : ''}</span>
          </div>
          <div className="campaign-grid">
            {list.map((c) => {
              const complete = c.deliverables.filter((d) => d.stages.find((s) => s.isMine)?.status === 'complete').length
              const pct = c.deliverables.length ? Math.round((complete / c.deliverables.length) * 100) : 0
              return (
                <Link key={c.id} href={`/manager/campaigns/${c.id}`} className="campaign-card" style={{ display: 'block', textDecoration: 'none', color: 'inherit' }}>
                  <div className="top">
                    <div className="nm">{c.name}</div>
                    <span style={{ fontSize: 10.5, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: c.timeScale === 'Delayed' ? 'var(--danger-soft)' : 'var(--success-soft)', color: c.timeScale === 'Delayed' ? 'var(--danger)' : 'var(--success)' }}>
                      {c.timeScale}
                    </span>
                  </div>
                  <div className="track"><div style={{ width: `${pct}%`, background: pct === 100 ? 'var(--success)' : undefined }} /></div>
                  <div className="meta">
                    <span>Content: {complete} of {c.deliverables.length} complete</span>
                    <span>{c.etaLabel}</span>
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