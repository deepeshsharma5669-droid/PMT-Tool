'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { deleteCampaignAction } from '@/app/admin/actions'

export function DeleteCampaignButton({ id, name }: { id: number; name: string }) {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)

  async function handleDelete() {
    if (!confirm(`Delete "${name}" and all its deliverables? This can't be undone.`)) return
    setSubmitting(true)
    try {
      await deleteCampaignAction(id)
      router.refresh()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete.')
      setSubmitting(false)
    }
  }

  return (
    <button type="button" className="btn btn-danger" style={{ padding: '3px 10px', fontSize: 11 }} onClick={handleDelete} disabled={submitting}>
      {submitting ? 'Deleting…' : 'Delete'}
    </button>
  )
}