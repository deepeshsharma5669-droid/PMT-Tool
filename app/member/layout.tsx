import Link from 'next/link'

export default function MemberLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <header className="shell-top">
        <a href="/" className="shell-brand" style={{ textDecoration: 'none', color: 'inherit' }}>
          PMT <span className="tag" style={{ background: 'var(--amber-soft)', color: 'var(--amber)' }}>Member</span>
        </a>
        <div className="shell-right">
          <Link href="/login" className="switch-link">Log out</Link>
        </div>
      </header>
      <div className="shell-body">{children}</div>
    </div>
  )
}