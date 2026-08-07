'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const tabs = [
  { label: 'Dashboard', href: '/manager' },
  { label: 'Campaigns', href: '/manager/campaigns' },
  { label: 'Team', href: '/manager/team' },
  { label: 'Approvals', href: '/manager/approvals' },
]

export function ManagerNav() {
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