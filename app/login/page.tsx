'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { resolveRoleAndRedirect } from './actions'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      const supabase = createClient()
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })

      if (signInError) {
        setError(signInError.message)
        return
      }

      const resolved = await resolveRoleAndRedirect(email)

      if (!resolved.role) {
        setError('Your account is registered but not yet approved — ask an admin to assign your role.')
        return
      }

      router.push(resolved.redirectPath)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign-in failed. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
      <div className="card" style={{ width: '100%', maxWidth: 380 }}>
        <div className="panel-head">
          <h2>PMT</h2>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="panel-body">
            <p className="hint" style={{ marginBottom: 14 }}>Sign in to your account.</p>
            <div className="form-row">
              <label>Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />
            </div>
            <div className="form-row">
              <label>Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            {error && <p style={{ color: 'var(--danger)', fontSize: 12.5, marginBottom: 10 }}>{error}</p>}
            <button type="submit" className="btn btn-primary" disabled={submitting} style={{ width: '100%' }}>
              {submitting ? 'Signing in…' : 'Sign in'}
            </button>
            <a href="/register" className="btn btn-ghost" style={{ width: '100%', marginTop: 8, textAlign: 'center', textDecoration: 'none', display: 'block' }}>
              Don&apos;t have an account? Register
            </a>
          </div>
        </form>
      </div>
    </div>
  )
}