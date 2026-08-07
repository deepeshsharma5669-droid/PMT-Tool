'use client'
import { useState } from 'react'
import type { LeaveRequest } from '@/lib/data/mock-leave'

export function LeaveRequestsTable({ initialRequests }: { initialRequests: LeaveRequest[] }) {
  const [requests, setRequests] = useState(initialRequests)

  function updateStatus(id: string, status: 'Approved' | 'Rejected') {
    setRequests(prev => prev.map(r => r.id === id ? { ...r, status } : r))
  }

  function statusColor(status: string) {
    if (status === 'Approved') return 'var(--success)'
    if (status === 'Rejected') return 'var(--danger)'
    return 'var(--amber)'
  }

  function statusBg(status: string) {
    if (status === 'Approved') return 'var(--success-soft)'
    if (status === 'Rejected') return 'var(--danger-soft)'
    return 'var(--amber-soft)'
  }

  return (
    <table className="data">
      <thead>
  <tr>
    <th>Employee</th>
    <th>Department</th>
    <th>Project</th>
    <th>Submission Date</th>
    <th>Days</th>
    <th>Dates</th>
    <th>Reason</th>
    <th>Status</th>
    <th>Action</th>
  </tr>
</thead>
      <tbody>
  {requests.map(r => (
    <tr key={r.id}>
      <td className="name-cell">{r.employeeName}<div className="hint">{r.role}</div></td>
      <td style={{ fontSize: 12 }}>{r.department}</td>
      <td style={{ fontSize: 12 }}>{r.project}</td>
      <td style={{ fontSize: 11.5 }}>{r.submissionDate}</td>
      <td>{r.daysApplied}d</td>
      <td style={{ fontSize: 11.5 }}>{r.startDate} → {r.endDate}</td>
      <td style={{ fontSize: 12 }}>{r.reason}</td>
      <td>
        <span style={{
          fontSize: 10, fontWeight: 700, padding: '2px 9px', borderRadius: 20,
          color: statusColor(r.status), background: statusBg(r.status)
        }}>
          {r.status.toUpperCase()}
        </span>
      </td>
      <td>
        {r.status === 'Pending' ? (
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              className="btn btn-success"
              style={{ padding: '5px 10px', fontSize: 11 }}
              onClick={() => updateStatus(r.id, 'Approved')}
            >
              Grant
            </button>
            <button
              className="btn btn-danger"
              style={{ padding: '5px 10px', fontSize: 11 }}
              onClick={() => updateStatus(r.id, 'Rejected')}
            >
              Reject
            </button>
          </div>
        ) : (
          <span className="hint">Handled</span>
        )}
      </td>
    </tr>
  ))}
</tbody>
    </table>
  )
}