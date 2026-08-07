'use client'
import { useState, useMemo } from 'react'

type Stage = { id: number; stage_name: string; status: string; revision_count: number; note: string | null }
type Deliverable = { id: number; name: string; contentFormat: string; projectId: number; projectName: string; stages: Stage[] }

const STAGE_LABELS: Record<string, string> = {
  pending: 'Not started', in_progress: 'In progress', manager_review: 'Manager review',
  client_review: 'Client review', feedback: 'Feedback', hold: 'Hold', complete: 'Complete',
}

export function ClientDeliverablesPanel({ deliverables }: { deliverables: Deliverable[] }) {
  const projects = useMemo(() => {
    const map = new Map<number, string>()
    deliverables.forEach(d => map.set(d.projectId, d.projectName))
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }))
  }, [deliverables])

  const [selectedProjectId, setSelectedProjectId] = useState<number | 'all'>('all')

  const formatCounts: Record<string, number> = {}
  deliverables.forEach(d => {
    formatCounts[d.contentFormat] = (formatCounts[d.contentFormat] || 0) + 1
  })

  const filtered = selectedProjectId === 'all'
    ? deliverables
    : deliverables.filter(d => d.projectId === selectedProjectId)

  return (
    <div>
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="panel-head">
          <h2>Deliverables</h2>
          <span className="hint">{deliverables.length} total across all projects</span>
        </div>
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
        <div className="panel-head">
          <h2>Deliverable Timelines</h2>
          <span className="hint">Click a project to filter</span>
        </div>
        <div className="panel-body">
          <div className="deliv-tabs">
            <span
              className={`deliv-tab ${selectedProjectId === 'all' ? 'active' : ''}`}
              onClick={() => setSelectedProjectId('all')}
            >
              All projects
            </span>
            {projects.map(p => (
              <span
                key={p.id}
                className={`deliv-tab ${selectedProjectId === p.id ? 'active' : ''}`}
                onClick={() => setSelectedProjectId(p.id)}
              >
                {p.name}
              </span>
            ))}
          </div>

          {filtered.length === 0 ? (
            <p className="hint" style={{ padding: '12px 0' }}>No deliverables for this selection.</p>
          ) : (
            filtered.map(d => (
              <div key={d.id} style={{ marginBottom: 18 }}>
                <p style={{ fontWeight: 600, fontSize: 13, marginBottom: 2 }}>{d.name}</p>
                <p className="hint" style={{ marginBottom: 8 }}>{d.projectName} · {d.contentFormat}</p>
                <div className="stage-chain">
                  {d.stages.map(s => (
                    <div className="stage-card" key={s.id}>
                      <span className={`stage-status ${s.status}`}>{STAGE_LABELS[s.status] ?? s.status}</span>
                      <div className="nm">{s.stage_name}</div>
                      {s.revision_count > 0 && <div className="rev">Revisions: <b>{s.revision_count}</b></div>}
                      {s.note && <div className="ro-meta">{s.note}</div>}
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}