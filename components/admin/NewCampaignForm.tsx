'use client'
import { useState, useRef, useEffect } from 'react'
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
type ManagerOption = { id: number; name: string; department: string | null }

export function NewCampaignForm({
  clients, managers, sequences,
}: {
  clients: { id: number; name: string }[]
  managers: ManagerOption[]
  sequences: Sequence[]
}) {
  const router = useRouter()

  const [selectedManagers, setSelectedManagers] = useState<string[]>([])
  const [managerPickerOpen, setManagerPickerOpen] = useState(false)
  const managerPickerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (managerPickerRef.current && !managerPickerRef.current.contains(e.target as Node)) {
        setManagerPickerOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function toggleManager(name: string) {
    setSelectedManagers(prev => prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name])
  }

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
    formData.set('managerNames', JSON.stringify(selectedManagers))
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
          <div className="form-row" ref={managerPickerRef} style={{ position: 'relative' }}>
            <label>Managers <span style={{ textTransform: 'none', fontWeight: 400, color: 'var(--muted)' }}>— one per department involved</span></label>
            <div
              onClick={() => setManagerPickerOpen(true)}
              style={{
                border: '1px solid var(--border)', borderRadius: 7, padding: '6px 8px', minHeight: 40,
                display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center', cursor: 'text', background: 'var(--surface)',
              }}
            >
              {selectedManagers.map(name => (
                <span key={name} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'var(--primary-soft)', color: 'var(--primary)', borderRadius: 5, padding: '3px 8px 3px 10px', fontSize: 12, fontWeight: 600 }}>
                  {name}
                  <button type="button" onClick={(e) => { e.stopPropagation(); toggleManager(name) }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', fontSize: 11, padding: 0, lineHeight: 1, opacity: 0.7 }}>✕</button>
                </span>
              ))}
              {selectedManagers.length === 0 && <span style={{ color: 'var(--muted)', fontSize: 13 }}>Select managers…</span>}
              <span style={{ marginLeft: 'auto', color: 'var(--muted)', fontSize: 11 }}>▾</span>
            </div>
            {managerPickerOpen && (
              <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 20, marginTop: 4, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 7, maxHeight: 200, overflowY: 'auto', boxShadow: '0 6px 18px rgba(28,37,33,0.12)' }}>
                {managers.filter(m => !selectedManagers.includes(m.name)).map(m => (
                  <div
                    key={m.id}
                    onClick={() => toggleManager(m.name)}
                    style={{ padding: '9px 12px', cursor: 'pointer', fontSize: 13, color: 'var(--ink-soft)', display: 'flex', justifyContent: 'space-between' }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface-2)' }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
                  >
                    <span>{m.name}</span>
                    {m.department && <span className="hint">{m.department}</span>}
                  </div>
                ))}
                {managers.filter(m => !selectedManagers.includes(m.name)).length === 0 && (
                  <div style={{ padding: '9px 12px', fontSize: 12.5, color: 'var(--muted)' }}>No more managers to add.</div>
                )}
              </div>
            )}
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