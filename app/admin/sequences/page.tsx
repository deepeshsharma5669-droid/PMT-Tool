import { getSequences } from '@/lib/data-access'
import { NewSequenceForm } from '@/components/admin/NewSequenceForm'
import { DeleteSequenceButton } from '@/components/admin/DeleteSequenceButton'

export default async function AdminSequences() {
  const sequences = await getSequences()

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Campaign Sequences</h1>
          <p className="sub">Reusable workflows applied when creating new campaigns</p>
        </div>
      </div>

      <div className="two-col">
        <NewSequenceForm claimedTypes={sequences.flatMap(s => s.deliverableTypes)} />

        <div className="card">
          <div className="panel-head"><h2>Existing</h2></div>
          <div className="panel-body">
            {sequences.map(s => (
              <div key={s.id} className="seq-item">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div className="n">
                    {s.name} {s.isDefault && <span className="tag-default">default</span>}
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                    <a href={`/admin/sequences/${s.id}`} className="btn btn-ghost" style={{ padding: '3px 10px', fontSize: 11, textDecoration: 'none' }}>Edit</a>
                    <DeleteSequenceButton id={s.id} name={s.name} />
                  </div>
                </div>
                <div className="m">
                  {s.stages.map((st, i) => (
                    <span key={i}>
                      {i > 0 && ' → '}
                      {st.name}{st.department ? ` (${st.department})` : ''}
                    </span>
                  ))} · {s.stages.length} stages
                </div>
                {s.deliverableTypes.length > 0 && (
                  <div className="hint" style={{ marginTop: 5 }}>Types: {s.deliverableTypes.join(', ')}</div>
                )}
                {s.description && <div className="hint" style={{ marginTop: 5 }}>{s.description}</div>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}