'use client'
import { useState } from 'react'
import { addHolidayAction, removeHolidayAction } from '@/app/admin/actions'

type Holiday = { id: number; name: string; date: string }

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
}

export function HolidaysPanel({ initialHolidays }: { initialHolidays: Holiday[] }) {
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [removingId, setRemovingId] = useState<number | null>(null)

  async function handleAdd(formData: FormData) {
    setSubmitting(true)
    try {
      await addHolidayAction(formData)
      setShowForm(false)
    } catch (err) {
      console.error(err)
      alert('Failed to add holiday.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleRemove(id: number) {
    setRemovingId(id)
    try {
      await removeHolidayAction(id)
    } catch (err) {
      console.error(err)
      alert('Failed to remove holiday.')
    } finally {
      setRemovingId(null)
    }
  }

  return (
    <div className="card">
      <div className="panel-head">
        <h2>Holidays</h2>
        <button className="btn btn-ghost" style={{ padding: '5px 12px', fontSize: 11 }} onClick={() => setShowForm(v => !v)}>
          {showForm ? 'Cancel' : '+ Add holiday'}
        </button>
      </div>
      <div className="panel-body">
        {showForm && (
          <form action={handleAdd} style={{ marginBottom: 14, paddingBottom: 14, borderBottom: '1px solid var(--surface-2)' }}>
            <div className="form-row">
              <label>Holiday name</label>
              <input name="name" placeholder="e.g. Diwali" required />
            </div>
            <div className="form-row">
              <label>Date</label>
              <input name="date" type="date" required />
            </div>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Adding…' : 'Save holiday'}
            </button>
          </form>
        )}

        {initialHolidays.length === 0 ? (
          <p className="hint" style={{ padding: '12px 0' }}>No holidays added yet.</p>
        ) : (
          initialHolidays.map(h => (
            <div className="queue-row" key={h.id}>
              <div className="info">
                <div className="t">{h.name}</div>
                <div className="m">{formatDate(h.date)}</div>
              </div>
              <button
                className="btn btn-danger"
                style={{ padding: '5px 10px', fontSize: 11 }}
                onClick={() => handleRemove(h.id)}
                disabled={removingId === h.id}
              >
                {removingId === h.id ? 'Removing…' : 'Remove'}
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}