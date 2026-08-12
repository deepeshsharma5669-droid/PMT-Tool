'use client'
import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { updateSequenceAction } from '@/app/admin/actions'

const DEPARTMENTS = ['Product', 'Design', 'Content', 'Animation']
const KNOWN_TYPES = [
  'Minimalist', 'Infographic', 'Onepager', 'Carousel', 'Emailer', 'Brochure',
  'Addendum', 'Collateral', 'Mappings', 'Standee', 'Web Banner', 'Key Visual (KV)', 'Twopager', 'Print Ad',
  'Main AV', 'AV', 'Video', 'Reel', 'Short Video', 'Teaser', 'GIF', 'Shoot Video',
  'Fund Guide', 'Factsheet', 'Booklet', 'PPT', 'Newsletter',
]

type StageRow = { name: string; department: string }
type Sequence = {
  id: number
  name: string
  description: string | null
  isDefault: boolean
  stages: { name: string; department: string | null }[]
  deliverableTypes: string[]
}

export function EditSequenceForm({ sequence, claimedTypes }: { sequence: Sequence; claimedTypes: string[] }) {
  const router = useRouter()
  const [stages, setStages] = useState<StageRow[]>(
    sequence.stages.map(s => ({ name: s.name, department: s.department ?? DEPARTMENTS[0] }))
  )
  const [selectedTypes, setSelectedTypes] = useState<string[]>(sequence.deliverableTypes)
  const [typesOpen, setTypesOpen] = useState(false)
  const typesRef = useRef<HTMLDivElement>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (typesRef.current && !typesRef.current.contains(e.target as Node)) {
        setTypesOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function addStage() {
    setStages(prev => [...prev, { name: '', department: DEPARTMENTS[0] }])
  }
  function removeStage(index: number) {
    if (stages.length <= 1) return
    setStages(prev => prev.filter((_, i) => i !== index))
  }
  function updateStageName(index: number, value: string) {
    setStages(prev => prev.map((s, i) => i === index ? { ...s, name: value } : s))
  }
  function updateStageDept(index: number, value: string) {
    setStages(prev => prev.map((s, i) => i === index ? { ...s, department: value } : s))
  }
  function toggleType(type: string) {
    setSelectedTypes(prev => prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type])
  }

  async function handleSubmit(formData: FormData) {
    const cleanStages = stages.map(s => ({ name: s.name.trim(), department: s.department })).filter(s => s.name)
    if (cleanStages.length === 0) {
      alert('Add at least one stage.')
      return
    }
    formData.set('id', String(sequence.id))
    formData.set('stages', JSON.stringify(cleanStages))
    formData.set('deliverableTypes', JSON.stringify(selectedTypes))
    setSubmitting(true)
    try {
      await updateSequenceAction(formData)
      router.push('/admin/sequences')
    } catch (err) {
      console.error(err)
      alert('Failed to save changes.')
      setSubmitting(false)
    }
  }

  const claimedSet = new Set(claimedTypes)

  return (
    <form action={handleSubmit} className="card">
      <div className="panel-head"><h2>Edit sequence</h2></div>
      <div className="panel-body">
        <div className="form-row">
          <label>Name</label>
          <input name="name" defaultValue={sequence.name} required />
        </div>
        <div className="form-row">
          <label>Description</label>
          <input name="description" defaultValue={sequence.description ?? ''} />
        </div>

        <div className="form-row">
          <label>Stages <span style={{ textTransform: 'none', fontWeight: 400, color: 'var(--muted)' }}>— in order, each owned by one department</span></label>
          {stages.map((stage, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              <input
                placeholder={`Stage ${i + 1} name`}
                value={stage.name}
                onChange={e => updateStageName(i, e.target.value)}
                style={{ flex: 2 }}
              />
              <select value={stage.department} onChange={e => updateStageDept(i, e.target.value)} style={{ flex: 1 }}>
                {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
              <button type="button" className="deliv-remove" onClick={() => removeStage(i)}>✕</button>
            </div>
          ))}
          <button type="button" className="btn btn-ghost" onClick={addStage}>+ Add stage</button>
        </div>

        <div className="form-row" ref={typesRef} style={{ position: 'relative' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label style={{ marginBottom: 0 }}>Deliverable types</label>
            {selectedTypes.length > 0 && (
              <button type="button" onClick={() => setSelectedTypes([])} className="btn btn-ghost" style={{ padding: '3px 10px', fontSize: 11 }}>
                Clear All
              </button>
            )}
          </div>
          <div
            onClick={() => setTypesOpen(true)}
            style={{
              border: '1px solid var(--border)', borderRadius: 7, padding: '6px 8px', minHeight: 40,
              display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center', cursor: 'text', background: 'var(--surface)',
            }}
          >
            {selectedTypes.map(type => (
              <span key={type} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'var(--primary-soft)', color: 'var(--primary)', borderRadius: 5, padding: '3px 8px 3px 10px', fontSize: 12, fontWeight: 600 }}>
                {type}
                <button type="button" onClick={(e) => { e.stopPropagation(); toggleType(type) }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', fontSize: 11, padding: 0, lineHeight: 1, opacity: 0.7 }}>✕</button>
              </span>
            ))}
            {selectedTypes.length === 0 && <span style={{ color: 'var(--muted)', fontSize: 13 }}>Select deliverable types…</span>}
            <span style={{ marginLeft: 'auto', color: 'var(--muted)', fontSize: 11 }}>▾</span>
          </div>
          {typesOpen && (
            <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 20, marginTop: 4, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 7, maxHeight: 220, overflowY: 'auto', boxShadow: '0 6px 18px rgba(28,37,33,0.12)' }}>
              {KNOWN_TYPES.filter(t => !selectedTypes.includes(t)).map(type => {
                const claimed = claimedSet.has(type)
                return (
                  <div
                    key={type}
                    onClick={() => { if (!claimed) toggleType(type) }}
                    style={{ padding: '9px 12px', cursor: claimed ? 'not-allowed' : 'pointer', fontSize: 13, color: claimed ? 'var(--muted)' : 'var(--ink-soft)', textDecoration: claimed ? 'line-through' : 'none' }}
                    onMouseEnter={e => { if (!claimed) e.currentTarget.style.background = 'var(--surface-2)' }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
                  >
                    {type}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="form-row">
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, textTransform: 'none' }}>
            <input type="checkbox" name="isDefault" defaultChecked={sequence.isDefault} style={{ width: 'auto' }} />
            Use for new campaigns by default
          </label>
        </div>
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? 'Saving…' : 'Save changes'}
        </button>
        <a href="/admin/sequences" className="btn btn-ghost" style={{ marginLeft: 8, textDecoration: 'none' }}>Cancel</a>
      </div>
    </form>
  )
}