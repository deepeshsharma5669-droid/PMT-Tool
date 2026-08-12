'use client'
import { useState } from 'react'
import { approveUserAction } from '@/app/admin/actions'

export function ApproveRegistrationRow({ name, email }: { name: string; email: string }) {
  const [role, setRole] = useState('Manager')
  const [department, setDepartment] = useState('Content')
  const [submitting, setSubmitting] = useState(false)

  async function handleApprove() {
    setSubmitting(true)
    const formData = new FormData()
    formData.set('name', name)
    formData.set('email', email)
    formData.set('role', role)
    formData.set('department', department)
    try {
      await approveUserAction(formData)
    } catch (err) {
      alert('Failed to approve. See console for details.')
      console.error(err)
      setSubmitting(false)
    }
  }

  return (
    <tr>
      <td className="name-cell">{name}</td>
      <td style={{ fontSize: 12 }}>{email}</td>
      <td>
        <select value={role} onChange={e => setRole(e.target.value)} style={{ fontSize: 12, padding: '4px 6px' }}>
          <option value="Admin">Admin</option>
          <option value="Manager">Manager</option>
          <option value="Member">Member</option>
        </select>
      </td>
      <td>
        <select value={department} onChange={e => setDepartment(e.target.value)} style={{ fontSize: 12, padding: '4px 6px' }}>
          <option value="Product">Product</option>
          <option value="Design">Design</option>
          <option value="Content">Content</option>
          <option value="Animation">Animation</option>
        </select>
      </td>
      <td>
        <button type="button" className="btn btn-primary" style={{ padding: '4px 12px', fontSize: 11 }} onClick={handleApprove} disabled={submitting}>
          {submitting ? 'Approving…' : 'Approve'}
        </button>
      </td>
    </tr>
  )
}