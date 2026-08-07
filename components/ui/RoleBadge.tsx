type Role = 'Admin' | 'Manager' | 'Member' | 'Client'

export function RoleBadge({ role }: { role: Role }) {
  return <span className={`role-badge ${role}`}>{role}</span>
}