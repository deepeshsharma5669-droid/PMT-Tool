import { AdminNav } from '@/components/admin/AdminNav'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <header className="shell-top">
        <a href="/" className="shell-brand" style={{ textDecoration: 'none', color: 'inherit' }}>
  PMT <span className="tag" style={{ background: 'var(--ink)', color: '#fff' }}>Admin</span>
</a>
        <AdminNav />
        <div className="shell-right">
          <span className="switch-link">Log out</span>
          <div className="shell-avatar">PA</div>
        </div>
      </header>
      <div className="shell-body">{children}</div>
    </div>
  )
}