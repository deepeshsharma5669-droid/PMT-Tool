'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClientAction } from '@/app/admin/actions'

export function AddClientForm() {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(formData: FormData) {
    setSubmitting(true)
    try {
      await createClientAction(formData)
      router.push('/admin/clients')
    } catch (err) {
      console.error(err)
      alert('Failed to add client. Check the console for details.')
      setSubmitting(false)
    }
  }

  return (
    <form action={handleSubmit}>
      <div className="card" style={{ maxWidth: 480 }}>
        <div className="panel-head"><h2>Add a client</h2></div>
        <div className="panel-body">
          <div className="form-row">
            <label>Client name</label>
            <input name="name" placeholder="e.g. Kotak Mutual Fund" required />
          </div>
          <div className="form-row">
  <label>Email</label>
  <input name="email" type="email" placeholder="e.g. contact@kotak.com" />
</div>
          <div className="form-row">
            <label>Account manager</label>
            <input name="accountManager" placeholder="e.g. Shruti Gawade" />
          </div>
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? 'Adding…' : 'Add client'}
          </button>
          <a href="/admin/clients" className="btn btn-ghost" style={{ marginLeft: 8, textDecoration: 'none' }}>Cancel</a>
        </div>
      </div>
    </form>
  )
}