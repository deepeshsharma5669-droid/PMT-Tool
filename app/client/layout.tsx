import Link from 'next/link'
import { LogoutButton } from '@/components/shared/LogoutButton'

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <header className="shell-top">
        <a href="/" className="shell-brand" style={{ textDecoration: 'none', color: 'inherit' }}>
  PMT <span className="tag" style={{ background: 'var(--violet-soft)', color: 'var(--violet)' }}>Client Portal</span>
</a>
        <div className="shell-nav">
          <Link href="/client" className="shell-nav-item">My Campaigns</Link>
          <Link href="/client/approvals" className="shell-nav-item">Approvals</Link>
        </div>
        <div className="shell-right">
          <Link href="/auth/change-password?returnTo=/client" className="switch-link">Change password</Link>
          <LogoutButton />
          <div className="shell-avatar">AN</div>
        </div>
      </header>
      <div className="shell-body">{children}</div>
    </div>
  )
}