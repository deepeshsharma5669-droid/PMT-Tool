import { redirect } from 'next/navigation'
import { ManagerNav } from '@/components/manager/ManagerNav'
import { LogoutButton } from '@/components/shared/LogoutButton'
import Link from 'next/link'
import { getCurrentManager } from '@/lib/manager-data'

export default async function ManagerLayout({ children }: { children: React.ReactNode }) {
  const manager = await getCurrentManager()

  // proxy.ts already gates /manager by role, so this shouldn't normally
  // happen — but if someone's managers row got deleted after login, fail
  // safely instead of rendering with no identity at all.
  if (!manager) {
    redirect('/login')
  }

  const initials = manager.name.split(' ').map(w => w[0]).join('')

  return (
    <div>
      <header className="shell-top">
        <div className="shell-brand">
          PMT <span className="tag" style={{ background: 'var(--primary-soft)', color: 'var(--primary)' }}>Manager</span>
        </div>
        <ManagerNav />
        <div className="shell-right">
          <Link href="/auth/change-password?returnTo=/manager" className="switch-link">Change password</Link>
          <LogoutButton />
          <div className="shell-avatar">{initials}</div>
        </div>
      </header>
      <div className="shell-body">
        <p className="hint" style={{ marginBottom: 12 }}>
          {manager.name} · <b style={{ color: 'var(--ink-soft)' }}>{manager.department} Manager</b> · scoped to the {manager.department} stage, across every client
        </p>
        {children}
      </div>
    </div>
  )
}