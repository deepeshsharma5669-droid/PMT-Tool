'use client'
import { useState } from 'react'
import { updateOrgSettingsAction } from '@/app/admin/actions'

type Settings = { timezone: string; day_starts: string; day_ends: string }

export function AgencyCalendarForm({ settings }: { settings: Settings }) {
  const [submitting, setSubmitting] = useState(false)
  const [saved, setSaved] = useState(false)

  async function handleSubmit(formData: FormData) {
    setSubmitting(true)
    setSaved(false)
    try {
      await updateOrgSettingsAction(formData)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (err) {
      console.error(err)
      alert('Failed to save settings.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form action={handleSubmit} className="card">
      <div className="panel-head"><h2>Agency calendar</h2></div>
      <div className="panel-body">
        <div className="form-row">
          <label>Timezone</label>
          <input name="timezone" defaultValue={settings.timezone} />
        </div>
        <div style={{ display: 'flex', gap: 14 }}>
          <div className="form-row" style={{ flex: 1 }}>
            <label>Day starts</label>
            <input name="dayStarts" type="time" defaultValue={settings.day_starts?.slice(0, 5)} />
          </div>
          <div className="form-row" style={{ flex: 1 }}>
            <label>Day ends</label>
            <input name="dayEnds" type="time" defaultValue={settings.day_ends?.slice(0, 5)} />
          </div>
        </div>
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? 'Saving…' : saved ? 'Saved ✓' : 'Save'}
        </button>
      </div>
    </form>
  )
}