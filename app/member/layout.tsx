import { LogoutButton } from '@/components/shared/LogoutButton'
import Link from 'next/link'

export default function MemberLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <header className="shell-top">
        <a href="/" className="shell-brand" style={{ textDecoration: 'none', color: 'inherit' }}>
          PMT <span className="tag" style={{ background: 'var(--amber-soft)', color: 'var(--amber)' }}>Member</span>
        </a>
        <div className="shell-right">
          <Link href="/auth/change-password?returnTo=/member" className="switch-link">Change password</Link>
          <LogoutButton />
        </div>
      </header>
      <div className="shell-body">{children}</div>
    </div>
  )
}