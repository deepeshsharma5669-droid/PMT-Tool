'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { registerAction } from './actions'

export default function RegisterPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }

    setSubmitting(true)
    const formData = new FormData()
    formData.set('name', name)
    formData.set('email', email)
    formData.set('password', password)

    const result = await registerAction(formData)
    setSubmitting(false)

    if (!result.success) {
      setError(result.error || 'Something went wrong.')
      return
    }
    setDone(true)
  }

  if (done) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
        <div className="card" style={{ width: '100%', maxWidth: 380 }}>
          <div className="panel-body">
            <h2 style={{ marginBottom: 10 }}>Account created</h2>
            <p className="hint" style={{ marginBottom: 16 }}>
              An admin needs to assign your role before you can sign in — you&apos;ll be able to log in once that&apos;s done.
            </p>
            <a href="/login" className="btn btn-primary" style={{ textDecoration: 'none', width: '100%', justifyContent: 'center' }}>Back to login</a>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
      <div className="card" style={{ width: '100%', maxWidth: 380 }}>
        <div className="panel-head"><h2>Create your account</h2></div>
        <form onSubmit={handleSubmit}>
          <div className="panel-body">
            <p className="hint" style={{ marginBottom: 14 }}>An admin will assign your role after you register.</p>
            <div className="form-row">
              <label>Name</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} required autoFocus />
            </div>
            <div className="form-row">
              <label>Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="form-row">
              <label>Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />
            </div>
            <div className="form-row">
              <label>Confirm password</label>
              <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required minLength={8} />
            </div>
            {error && <p style={{ color: 'var(--danger)', fontSize: 12.5, marginBottom: 10 }}>{error}</p>}
            <button type="submit" className="btn btn-primary" disabled={submitting} style={{ width: '100%' }}>
              {submitting ? 'Creating…' : 'Register'}
            </button>
            <a href="/login" className="btn btn-ghost" style={{ width: '100%', marginTop: 8, textAlign: 'center', textDecoration: 'none', display: 'block' }}>
              Already have an account? Sign in
            </a>
          </div>
        </form>
      </div>
    </div>
  )
}