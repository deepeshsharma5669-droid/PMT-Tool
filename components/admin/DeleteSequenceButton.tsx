'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { deleteSequenceAction } from '@/app/admin/actions'

export function DeleteSequenceButton({ id, name }: { id: number; name: string }) {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)

  async function handleDelete() {
    if (!confirm(`Delete "${name}"? This can't be undone.`)) return
    setSubmitting(true)
    try {
      await deleteSequenceAction(id)
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