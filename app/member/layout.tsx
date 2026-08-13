import { LogoutButton } from '@/components/shared/LogoutButton'
import { getCurrentUser } from '@/lib/auth'
import { redirect } from 'next/navigation'

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '·'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export default async function MemberLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  if (user.role !== 'Member') redirect(user.role === 'Admin' ? '/admin' : '/manager')

  const initials = initialsOf(user.name || user.email)

  return (
    <div>
      <header className="shell-top" data-testid="member-shell-header">
        <a
          href="/member"
          className="shell-brand"
          style={{ textDecoration: 'none', color: 'inherit' }}
          data-testid="member-brand-link"
        >
          PMT
          <span
            className="tag"
            style={{ background: 'var(--amber-soft)', color: 'var(--amber)' }}
          >
            My Work
          </span>
        </a>
        <div className="shell-right">
          <div
            className="shell-avatar"
            title={user.name}
            data-testid="member-avatar"
            style={{ background: 'var(--primary-soft)', color: 'var(--primary)' }}
          >
            {initials}
          </div>
          <LogoutButton />
        </div>
      </header>
      <div className="shell-body">{children}</div>
    </div>
  )
}
