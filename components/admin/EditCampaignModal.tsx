'use client'
import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { updateCampaignAction } from '@/app/admin/actions'

type Project = {
  id: number
  projectName: string
  manager: string[]
  priority: string
  status: string
  startDate: string
}
type ManagerOption = { id: number; name: string; department: string | null }

export function EditCampaignModal({ project, managers }: { project: Project; managers: ManagerOption[] }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [selectedManagers, setSelectedManagers] = useState<string[]>(project.manager)
  const [pickerOpen, setPickerOpen] = useState(false)
  const pickerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setPickerOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function toggleManager(name: string) {
    setSelectedManagers(prev => prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name])
  }

  async function handleSubmit(formData: FormData) {
    formData.set('id', String(project.id))
    formData.set('managerNames', JSON.stringify(selectedManagers))
    setSubmitting(true)
    try {
      await updateCampaignAction(formData)
      setOpen(false)
      router.refresh()
    } catch (err) {
      console.error(err)
      alert('Failed to save changes.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <button type="button" className="btn btn-ghost" style={{ padding: '3px 10px', fontSize: 11 }} onClick={() => setOpen(true)}>Edit</button>

      {open && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(28,37,33,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}
          onClick={() => setOpen(false)}
        >
          <div className="card" style={{ width: '100%', maxWidth: 420 }} onClick={e => e.stopPropagation()}>
            <div className="panel-head">
              <h2>Edit campaign</h2>
              <span className="switch-link" onClick={() => setOpen(false)}>✕</span>
            </div>
            <form action={handleSubmit}>
              <div className="panel-body">
                <div className="form-row">
                  <label>Campaign name</label>
                  <input name="projectName" defaultValue={project.projectName} required />
                </div>

                <div className="form-row" ref={pickerRef} style={{ position: 'relative' }}>
                  <label>Managers <span style={{ textTransform: 'none', fontWeight: 400, color: 'var(--muted)' }}>— one per department involved</span></label>
                  <div
                    onClick={() => setPickerOpen(true)}
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
                  {pickerOpen && (
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
                  <label>Priority</label>
                  <select name="priority" defaultValue={project.priority}>
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>
                <div className="form-row">
                  <label>Status</label>
                  <input name="status" defaultValue={project.status} />
                </div>
                <div className="form-row">
                  <label>Start date</label>
                  <input name="startDate" type="date" defaultValue={project.startDate} />
                </div>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Saving…' : 'Save changes'}
                </button>
                <button type="button" className="btn btn-ghost" style={{ marginLeft: 8 }} onClick={() => setOpen(false)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}