import { AdminNav } from '@/components/admin/AdminNav'
import { LogoutButton } from '@/components/shared/LogoutButton'
import Link from 'next/link'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <header className="shell-top">
        <a href="/" className="shell-brand" style={{ textDecoration: 'none', color: 'inherit' }}>
  PMT <span className="tag" style={{ background: 'var(--ink)', color: '#fff' }}>Admin</span>
</a>
        <AdminNav />
        <div className="shell-right">
          <Link href="/auth/change-password?returnTo=/admin" className="switch-link">Change password</Link>
          <LogoutButton />
          <div className="shell-avatar">PA</div>
        </div>
      </header>
      <div className="shell-body">{children}</div>
    </div>
  )
}