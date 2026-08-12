'use client'
import { useState } from 'react'
import { resendPasswordEmailAction } from '@/app/admin/actions'

export function ResendPasswordButton({ email, role }: { email: string; role: string }) {
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')

  async function handleClick() {
    setState('sending')
    try {
      await resendPasswordEmailAction(email, role)
      setState('sent')
    } catch {
      setState('error')
    }
  }

  if (state === 'sent') return <span className="hint" style={{ color: 'var(--success)' }}>Sent ✓</span>
  if (state === 'error') return <span className="hint" style={{ color: 'var(--danger)' }}>Failed — retry?</span>

  return (
    <button type="button" className="btn btn-ghost" style={{ padding: '4px 10px', fontSize: 11 }} onClick={handleClick} disabled={state === 'sending'}>
      {state === 'sending' ? 'Sending…' : 'Resend password email'}
    </button>
  )
}