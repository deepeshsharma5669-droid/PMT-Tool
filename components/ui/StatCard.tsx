export function StatCard({ label, value, danger }: { label: string; value: string | number; danger?: boolean }) {
  return (
    <div className="stat-card">
      <div className="l">{label}</div>
      <div className="v" style={danger ? { color: 'var(--danger)' } : undefined}>{value}</div>
    </div>
  )
}