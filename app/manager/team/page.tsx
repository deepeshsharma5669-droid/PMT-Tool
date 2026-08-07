'use client'
import { useState } from 'react'
import { useManagerStore } from '@/lib/data/manager-store'
import { activityLog } from '@/lib/data/manager-mock-data'

export default function ManagerTeam() {
  const teamMembers = useManagerStore((s) => s.teamMembers)
  const leaveItems = useManagerStore((s) => s.leaveItems)
  const applyLeave = useManagerStore((s) => s.applyLeave)
  const resolveLeaveItem = useManagerStore((s) => s.resolveLeaveItem)

  const [date, setDate] = useState('')
  const [reason, setReason] = useState('')

  function handleApply() {
    if (!date) return
    applyLeave('Kaushal Shah', date, reason)
    setDate('')
    setReason('')
  }

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Team</h1>
          <p className="sub">{teamMembers.length} people — your Content team, across every client</p>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="panel-head"><h2>Workload</h2></div>
        <div className="panel-body" style={{ padding: '0 18px 6px' }}>
          <table className="data">
            <thead><tr><th>Person</th><th>Role</th><th>Open tasks</th><th>Load</th></tr></thead>
            <tbody>
              {teamMembers.map((m) => (
                <tr key={m.name}>
                  <td className="name-cell">{m.name}</td>
                  <td>{m.role}</td>
                  <td>{m.openTasks}</td>
                  <td><div className="track" style={{ width: 100 }}><div style={{ width: `${m.loadPercent}%`, background: m.loadPercent > 70 ? 'var(--danger)' : undefined }} /></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="two-col" style={{ marginBottom: 20 }}>
        <div className="card">
          <div className="panel-head"><h2>Apply for Leave</h2></div>
          <div className="panel-body">
            <div className="form-row" style={{ marginBottom: 10 }}>
              <label style={{ display: 'block', fontSize: 11, color: 'var(--muted)', marginBottom: 4 }}>Date</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={{ width: '100%', padding: '7px 9px', border: '1px solid var(--border)', borderRadius: 6, fontSize: 12.5 }} />
            </div>
            <div className="form-row" style={{ marginBottom: 10 }}>
              <label style={{ display: 'block', fontSize: 11, color: 'var(--muted)', marginBottom: 4 }}>Reason / impacted task</label>
              <input type="text" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Content annotation — Neo ver 2" style={{ width: '100%', padding: '7px 9px', border: '1px solid var(--border)', borderRadius: 6, fontSize: 12.5 }} />
            </div>
            <button onClick={handleApply} className="btn btn-primary">Submit</button>
          </div>
        </div>
        <div className="card">
          <div className="panel-head"><h2>Note</h2></div>
          <div className="panel-body">
            <p className="hint">New requests appear below as Pending until Admin approves them. Approved leave shows up in the Dashboard&apos;s Team Today strip and Action Needed panel automatically.</p>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="panel-head"><h2>Leave &amp; Reassignment</h2><span className="hint">Affecting your team&apos;s ETAs</span></div>
        <div className="panel-body" style={{ padding: 0 }}>
          {leaveItems.length === 0 && <p className="hint" style={{ padding: 18 }}>No leave items right now.</p>}
          {leaveItems.map((l, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '170px 1fr auto', gap: 16, alignItems: 'center', padding: '14px 18px', borderBottom: i < leaveItems.length - 1 ? '1px solid var(--surface-2)' : 'none' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 13 }}>{l.person}</div>
                <div className="hint">On leave {l.onLeave}</div>
                <span style={{ fontSize: 9.5, fontWeight: 700, padding: '2px 7px', borderRadius: 20, background: l.status === 'Pending' ? 'var(--amber-soft)' : 'var(--success-soft)', color: l.status === 'Pending' ? 'var(--amber)' : 'var(--success)' }}>{l.status}</span>
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 12.5 }}>{l.impactedTask}</div>
                <div className="hint">{l.etaShift}</div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => resolveLeaveItem(i)} className="btn btn-ghost">Accept delay</button>
                <button onClick={() => resolveLeaveItem(i)} className="btn btn-primary">Reassign</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <div className="panel-head"><h2>Activity Log</h2><span className="hint">Active vs idle time — remote &amp; outsourced only</span></div>
        <div className="panel-body" style={{ padding: '0 18px 6px' }}>
          <table className="data">
            <thead><tr><th>Person</th><th>Mode</th><th>Logged</th><th>Active</th><th>Idle</th><th>Flag</th></tr></thead>
            <tbody>
              {activityLog.map((row) => (
                <tr key={row.person}>
                  <td className="name-cell">{row.person}</td>
                  <td>{row.mode}</td>
                  <td>{row.logged}</td>
                  <td>{row.active}</td>
                  <td>{row.idle}</td>
                  <td><span style={{ fontSize: 10.5, fontWeight: 700, padding: '3px 9px', borderRadius: 20, background: row.flag === 'High idle' ? 'var(--danger-soft)' : 'var(--success-soft)', color: row.flag === 'High idle' ? 'var(--danger)' : 'var(--success)' }}>{row.flag}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}