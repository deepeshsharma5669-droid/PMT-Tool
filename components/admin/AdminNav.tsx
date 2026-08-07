'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const tabs = [
  { label: 'Overview', href: '/admin' },
  { label: 'Clients', href: '/admin/clients' },
  { label: 'Campaign Sequences', href: '/admin/sequences' },
  { label: 'Users & Roles', href: '/admin/users' },
  { label: 'Org Settings', href: '/admin/settings' },
]

export function AdminNav() {
  const pathname = usePathname()
  return (
    <div className="shell-nav">
      {tabs.map(tab => (
        <Link
          key={tab.href}
          href={tab.href}
          className={`shell-nav-item ${pathname === tab.href ? 'active' : ''}`}
        >
          {tab.label}
        </Link>
      ))}
    </div>
  )
}