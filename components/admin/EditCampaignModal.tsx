'use client'
import { useState } from 'react'
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

export function EditCampaignModal({ project, managers }: { project: Project; managers: { id: number; name: string }[] }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(formData: FormData) {
    formData.set('id', String(project.id))
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
                <div className="form-row">
                  <label>Manager</label>
                  <select name="managerName" defaultValue={project.manager[0] ?? ''}>
                    <option value="">Unassigned</option>
                    {managers.map(m => <option key={m.id} value={m.name}>{m.name}</option>)}
                  </select>
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