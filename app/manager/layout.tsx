import { ManagerNav } from '@/components/manager/ManagerNav'
import { CURRENT_MANAGER } from '@/lib/data/manager-access'

export default function ManagerLayout({ children }: { children: React.ReactNode }) {
  const initials = CURRENT_MANAGER.split(' ').map(w => w[0]).join('')
  return (
    <div>
      <header className="shell-top">
        <div className="shell-brand">
          PMT <span className="tag" style={{ background: 'var(--primary-soft)', color: 'var(--primary)' }}>Manager</span>
        </div>
        <ManagerNav />
        <div className="shell-right">
          <span className="switch-link">Log out</span>
          <div className="shell-avatar">{initials}</div>
        </div>
      </header>
      <div className="shell-body">
        <p className="hint" style={{ marginBottom: 12 }}>
          {CURRENT_MANAGER} · <b style={{ color: 'var(--ink-soft)' }}>Content Manager</b> · scoped to the Content stage, across every client
        </p>
        {children}
      </div>
    </div>
  )
}