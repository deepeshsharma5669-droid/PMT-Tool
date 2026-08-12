import { notFound } from 'next/navigation'
import { getSequences } from '@/lib/data-access'
import { EditSequenceForm } from '@/components/admin/EditSequenceForm'

export default async function EditSequencePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const sequences = await getSequences()
  const sequence = sequences.find(s => s.id === Number(id))

  if (!sequence) return notFound()

  const claimedTypes = sequences
    .filter(s => s.id !== sequence.id)
    .flatMap(s => s.deliverableTypes)

  return (
    <div>
      <div className="crumb">
        <a href="/admin/sequences" style={{ color: 'var(--ink-soft)', textDecoration: 'underline' }}>Campaign Sequences</a>
        {' · Edit'}
      </div>
      <EditSequenceForm sequence={sequence} claimedTypes={claimedTypes} />
    </div>
  )
}