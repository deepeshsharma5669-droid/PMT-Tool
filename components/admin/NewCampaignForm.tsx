'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createCampaignAction } from '@/app/admin/actions'

type Sequence = {
  id: number
  name: string
  isDefault: boolean
  stages: { name: string; department: string | null }[]
  deliverableTypes: string[]
}
type DelivRow = { id: number; name: string; type: string }

export function NewCampaignForm({
  clients, managers, sequences,
}: {
  clients: { id: number; name: string }[]
  managers: { id: number; name: string }[]
  sequences: Sequence[]
}) {
  const router = useRouter()

  const typeToSeq: Record<string, Sequence> = {}
  sequences.forEach(seq => seq.deliverableTypes.forEach(t => { typeToSeq[t] = seq }))
  const DELIV_OPTIONS = Object.keys(typeToSeq)
  const defaultType = DELIV_OPTIONS[0] ?? ''

  const [rows, setRows] = useState<DelivRow[]>([
    { id: 1, name: 'Key Visual', type: defaultType },
  ])
  const [nextId, setNextId] = useState(2)
  const [submitting, setSubmitting] = useState(false)

  function addRow() {
    setRows(prev => [...prev, { id: nextId, name: '', type: defaultType }])
    setNextId(id => id + 1)
  }
  function removeRow(id: number) {
    if (rows.length <= 1) return
    setRows(prev => prev.filter(r => r.id !== id))
  }
  function updateRow(id: number, field: 'name' | 'type', value: string) {
    setRows(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r))
  }

  const seqCounts = new Map<number, { seq: Sequence; count: number }>()
  rows.forEach(r => {
    const seq = typeToSeq[r.type]
    if (!seq) return
    const existing = seqCounts.get(seq.id)
    seqCounts.set(seq.id, { seq, count: (existing?.count ?? 0) + 1 })
  })
  const parts = Array.from(seqCounts.values()).map(({ seq, count }) => `${seq.name} (${count} deliverable${count > 1 ? 's' : ''})`)

  async function handleSubmit(formData: FormData) {
    formData.set('deliverables', JSON.stringify(rows))
    setSubmitting(true)
    try {
      await createCampaignAction(formData)
      router.push('/admin/clients')
    } catch (err) {
      console.error(err)
      alert('Failed to create campaign. Check the console for details.')
      setSubmitting(false)
    }
  }

  if (DELIV_OPTIONS.length === 0) {
    return (
      <div className="card" style={{ maxWidth: 640 }}>
        <div className="panel-body">
          <p className="hint">No sequences have any deliverable types configured yet. Add some under <a href="/admin/sequences">Sequences</a> before creating a campaign.</p>
        </div>
      </div>
    )
  }

  return (
    <form action={handleSubmit}>
      <div className="card" style={{ maxWidth: 640 }}>
        <div className="panel-head"><h2>Create a campaign</h2></div>
        <div className="panel-body">
          <div className="form-row">
            <label>Client</label>
            <select name="clientId" required>
              {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="form-row">
            <label>Campaign name</label>
            <input name="projectName" placeholder="e.g. Autumn Range Launch" required />
          </div>
          <div className="form-row">
            <label>Assign manager</label>
            <select name="managerName">
              <option value="">Unassigned</option>
              {managers.map(m => <option key={m.id} value={m.name}>{m.name}</option>)}
            </select>
          </div>
          <div className="form-row">
            <label>Description / brief</label>
            <textarea rows={3} placeholder="Paste the brief the client sent…" />
          </div>
          <div className="form-row">
            <label>Target deadline <span style={{ textTransform: 'none', fontWeight: 400, color: 'var(--muted)' }}>— what the client was promised</span></label>
            <input name="startDate" type="date" defaultValue="2026-08-15" required />
          </div>
          <div className="hint" style={{ marginBottom: 14 }}>
            Every ETA shown across this campaign is calculated backward from this date, against each deliverable's stage effort and whoever's assigned.
          </div>

          <div className="form-row">
            <label>Deliverables <span style={{ textTransform: 'none', fontWeight: 400, color: 'var(--muted)' }}>— sequence picked automatically per deliverable, by type</span></label>
            {rows.map(row => {
              const seq = typeToSeq[row.type]
              return (
                <div key={row.id} className="deliv-input-row">
                  <input
                    placeholder="Deliverable name"
                    value={row.name}
                    onChange={e => updateRow(row.id, 'name', e.target.value)}
                  />
                  <select value={row.type} onChange={e => updateRow(row.id, 'type', e.target.value)}>
                    {DELIV_OPTIONS.map(opt => <option key={opt}>{opt}</option>)}
                  </select>
                  <span
                    style={{
                      fontSize: 10.5, fontWeight: 700, padding: '3px 9px', borderRadius: 20,
                      background: 'var(--primary-soft)', color: 'var(--primary)', whiteSpace: 'nowrap',
                    }}
                  >
                    {seq?.name ?? 'No sequence'}
                  </span>
                  <button type="button" className="deliv-remove" onClick={() => removeRow(row.id)}>✕</button>
                </div>
              )
            })}
            <button type="button" className="btn btn-ghost" style={{ marginTop: 8 }} onClick={addRow}>+ Add deliverable</button>
          </div>

          <div className="hint" style={{ margin: '14px 0 16px' }}>
            This campaign will run <b>{parts.length} sequence{parts.length > 1 ? 's' : ''} in parallel</b>: {parts.join(', ')}.
          </div>

          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? 'Creating…' : 'Create campaign'}
          </button>
          <a href="/admin/clients" className="btn btn-ghost" style={{ marginLeft: 8, textDecoration: 'none' }}>Cancel</a>
        </div>
      </div>
    </form>
  )
}