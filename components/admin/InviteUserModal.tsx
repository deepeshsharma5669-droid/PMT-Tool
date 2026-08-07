'use client'
import { useState } from 'react'
import { inviteUserAction } from '@/app/admin/actions'

export function InviteUserModal() {
  const [open, setOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(formData: FormData) {
    setSubmitting(true)
    try {
      await inviteUserAction(formData)
      setOpen(false)
    } catch (err) {
      console.error(err)
      alert('Failed to invite user.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <button className="btn btn-primary" onClick={() => setOpen(true)}>+ Invite user</button>

      {open && (
        <div
          style={{
            position: 'fixed', inset: 0, background: 'rgba(28,37,33,0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100,
          }}
          onClick={() => setOpen(false)}
        >
          <div
            className="card"
            style={{ width: '100%', maxWidth: 420 }}
            onClick={e => e.stopPropagation()}
          >
            <div className="panel-head">
              <h2>Invite a user</h2>
              <span className="switch-link" onClick={() => setOpen(false)}>✕</span>
            </div>
            <form action={handleSubmit}>
              <div className="panel-body">
                <div className="form-row">
                  <label>Name</label>
                  <input name="name" placeholder="e.g. Rohan Mehta" required />
                </div>
                <div className="form-row">
                  <label>Email</label>
                  <input name="email" type="email" placeholder="e.g. rohan@thefinpedia.com" required />
                </div>
                <div className="form-row">
                  <label>Department</label>
                  <select name="department" required>
                    <option value="Product">Product</option>
                    <option value="Design">Design</option>
                    <option value="Content">Content</option>
                    <option value="Animation">Animation</option>
                  </select>
                </div>
                <div className="form-row">
                  <label>Role</label>
                  <select name="role" required>
                    <option value="Manager">Manager</option>
                    <option value="Member">Member</option>
                    <option value="Admin">Admin</option>
                  </select>
                </div>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Inviting…' : 'Send invite'}
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