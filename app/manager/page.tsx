'use client'
import Link from 'next/link'
import { StatCard } from '@/components/ui/StatCard'
import { useManagerStore } from '@/lib/data/manager-store'
import { dueTodayTasks, escalations } from '@/lib/data/manager-mock-data'

export default function ManagerDashboard() {
  const campaigns = useManagerStore((s) => s.campaigns)
  const teamMembers = useManagerStore((s) => s.teamMembers)
  const leaveItems = useManagerStore((s) => s.leaveItems)
  const recentActivity = useManagerStore((s) => s.recentActivity)

  const sc = { active: 0, awaitingReview: 0, feedback: 0, complete: 0, blocked: 0 }
  campaigns.forEach((c) => {
    c.deliverables.forEach((d) => {
      const s = d.stages.find((s) => s.isMine)
      if (!s) return
      if (s.status === 'ready' || s.status === 'in_progress') sc.active++
      else if (s.status === 'manager_review' || s.status === 'client_review') sc.awaitingReview++
      else if (s.status === 'feedback') sc.feedback++
      else if (s.status === 'complete') sc.complete++
      else if (s.status === 'blocked') sc.blocked++
    })
  })
  const scTotal = Math.max(1, sc.active + sc.awaitingReview + sc.feedback + sc.complete + sc.blocked)
  const delayed = campaigns.filter((c) => c.timeScale === 'Delayed').length
  const onTime = campaigns.filter((c) => c.timeScale === 'On-Time').length
  const activeInContent = campaigns.reduce((sum, c) => sum + c.deliverables.length, 0)

  const approvedLeave = leaveItems.filter((l) => l.status === 'Approved')
  const onLeaveNames = new Set(approvedLeave.map((l) => l.person))
  const atCapacity = teamMembers.filter((m) => m.loadPercent >= 70 && !onLeaveNames.has(m.name))
  const available = teamMembers.filter((m) => m.loadPercent < 70 && !onLeaveNames.has(m.name))

  return (
    <div>
      <div className="page-head"><div><h1>Dashboard</h1></div></div>

      <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(5,1fr)' }}>
        <StatCard label="Active in Content" value={activeInContent} />
        <StatCard label="Escalations" value={escalations.length} danger />
        <StatCard label="Delayed campaigns" value={delayed} danger />
        <StatCard label="On-Time campaigns" value={onTime} />
        <StatCard label="Ready to hand off" value={sc.complete} />
      </div>

      <div className="card" style={{ marginBottom: 20, padding: '14px 18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <span className="hint" style={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.3 }}>Content team today</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'var(--success-soft)', color: 'var(--success)', padding: '5px 12px', borderRadius: 20, fontSize: 12.5, fontWeight: 600 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--success)' }} />{available.length} available
          </span>
          {atCapacity.map((p) => (
            <span key={p.name} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'var(--danger-soft)', color: 'var(--danger)', padding: '5px 12px', borderRadius: 20, fontSize: 12.5, fontWeight: 600 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--danger)' }} />At capacity — {p.name}
            </span>
          ))}
          {approvedLeave.map((l, i) => (
            <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'var(--amber-soft)', color: 'var(--amber)', padding: '5px 12px', borderRadius: 20, fontSize: 12.5, fontWeight: 600 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--amber)' }} />On leave — {l.person}
            </span>
          ))}
        </div>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="panel-head"><h2>My Stage Workload</h2><span className="hint">Content stage, across every deliverable that needs it</span></div>
        <div className="panel-body">
          <div style={{ display: 'flex', height: 34, borderRadius: 7, overflow: 'hidden' }}>
            {sc.active > 0 && <div style={{ width: `${(sc.active / scTotal) * 100}%`, background: 'var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden' }}>Active · {sc.active}</div>}
            {sc.awaitingReview > 0 && <div style={{ width: `${(sc.awaitingReview / scTotal) * 100}%`, background: 'var(--violet)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden' }}>Awaiting review · {sc.awaitingReview}</div>}
            {sc.feedback > 0 && <div style={{ width: `${(sc.feedback / scTotal) * 100}%`, background: 'var(--danger)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden' }}>Needs revision · {sc.feedback}</div>}
            {sc.complete > 0 && <div style={{ width: `${(sc.complete / scTotal) * 100}%`, background: 'var(--amber)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden' }}>Complete · {sc.complete}</div>}
            {sc.blocked > 0 && <div style={{ width: `${(sc.blocked / scTotal) * 100}%`, background: 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)', fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden' }}>Blocked · {sc.blocked}</div>}
          </div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="panel-head"><h2>Action Needed</h2><span className="hint">Actions that aren&apos;t already escalations above</span></div>
        <div className="panel-body" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'var(--surface-2)', borderRadius: 9, padding: '11px 13px' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 12.5 }}>Content annotation — 3 versions awaiting your pick</div>
              <div className="hint">Neo ver 2 · Kotak Mutual Fund</div>
            </div>
            <Link href="/manager/approvals" className="btn btn-primary" style={{ textDecoration: 'none' }}>Review</Link>
          </div>
          {approvedLeave.map((l, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'var(--surface-2)', borderRadius: 9, padding: '11px 13px' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 12.5 }}>{l.person} on leave {l.onLeave} — 1 task will slip</div>
                <div className="hint">{l.impactedTask}</div>
              </div>
              <Link href="/manager/team" className="btn btn-ghost" style={{ textDecoration: 'none' }}>Review</Link>
            </div>
          ))}
        </div>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="panel-head"><h2>Due Today</h2><span className="hint">28 Jul 2026 · Content-stage tasks, across every client</span></div>
        <div className="panel-body" style={{ padding: '0 18px 6px' }}>
          <table className="data">
            <thead><tr><th>Task</th><th>Deliverable · Client</th><th>Assignee</th><th>Status</th><th>Time Scale</th><th>Due</th></tr></thead>
            <tbody>
              {dueTodayTasks.map((t) => (
                <tr key={t.task}>
                  <td className="name-cell">{t.task}</td>
                  <td>{t.deliverable} · {t.client}</td>
                  <td>{t.assignee}</td>
                  <td>{t.status}</td>
                  <td><span style={{ fontSize: 10.5, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: t.timeScale === 'Delayed' ? 'var(--danger-soft)' : 'var(--success-soft)', color: t.timeScale === 'Delayed' ? 'var(--danger)' : 'var(--success)' }}>{t.timeScale}</span></td>
                  <td style={{ color: t.timeScale === 'Delayed' ? 'var(--danger)' : 'var(--ink-soft)', fontWeight: t.timeScale === 'Delayed' ? 700 : 400 }}>{t.due}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="panel-head"><h2>Escalations</h2><span className="hint">Within the Content stage only</span></div>
        <div className="panel-body" style={{ padding: '0 18px 6px' }}>
          <table className="data">
            <thead><tr><th>Deliverable</th><th>Client</th><th>Issue</th><th>Days overdue</th></tr></thead>
            <tbody>
              {escalations.map((e) => (
                <tr key={e.deliverable}>
                  <td className="name-cell">{e.deliverable}</td>
                  <td>{e.client}</td>
                  <td>{e.issue}</td>
                  <td style={{ color: 'var(--danger)', fontWeight: 700 }}>{e.daysOverdue}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <div className="panel-head"><h2>Recent Activity</h2><span className="hint">Updates as you interact with the app</span></div>
        <div className="panel-body">
          {recentActivity.map((a, i) => (
            <div key={i} style={{ display: 'flex', gap: 10, padding: '9px 0', borderBottom: i < recentActivity.length - 1 ? '1px solid var(--surface-2)' : 'none' }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', marginTop: 5, flexShrink: 0, background: a.kind === 'done' ? 'var(--success)' : a.kind === 'approve' ? 'var(--violet)' : 'var(--primary)' }} />
              <div>
                <div style={{ fontSize: 12.5, color: 'var(--ink-soft)' }}>{a.text}</div>
                <div className="hint">{a.meta}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}