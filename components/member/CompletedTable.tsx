import type { MemberTaskRow } from '@/lib/member-data'

export function CompletedTable({ tasks }: { tasks: MemberTaskRow[] }) {
  if (tasks.length === 0) {
    return (
      <div className="panel-body" data-testid="completed-empty">
        <p className="hint">No completed projects yet.</p>
      </div>
    )
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table className="data" data-testid="completed-table">
        <thead>
          <tr>
            <th>Client</th>
            <th>Campaign</th>
            <th>Deliverable</th>
            <th>Final Status</th>
          </tr>
        </thead>
        <tbody>
          {tasks.map(t => (
            <tr key={t.stageId} data-testid={`completed-row-${t.stageId}`}>
              <td className="name-cell">{t.clientName}</td>
              <td>{t.campaignName}</td>
              <td>
                <div>{t.deliverableName}</div>
                <div className="hint" style={{ marginTop: 2 }}>{t.stageName}</div>
              </td>
              <td>
                <span className="stage-status complete" data-testid={`completed-status-${t.stageId}`}>
                  Approved
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
