'use client'
import type { MemberTaskRow } from '@/lib/member-data'

type Props = { tasks: MemberTaskRow[]; onOpenFeedback: (t: MemberTaskRow) => void }

export function UnderReviewTable({ tasks, onOpenFeedback }: Props) {
  if (tasks.length === 0) {
    return (
      <div className="panel-body" data-testid="under-review-empty">
        <p className="hint">No items currently under review.</p>
      </div>
    )
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table className="data" data-testid="under-review-table">
        <thead>
          <tr>
            <th>Client</th>
            <th>Campaign</th>
            <th>Deliverable</th>
            <th>Status</th>
            <th style={{ width: 180 }}>Feedback</th>
          </tr>
        </thead>
        <tbody>
          {tasks.map(t => (
            <tr key={t.stageId} data-testid={`under-review-row-${t.stageId}`}>
              <td className="name-cell">{t.clientName}</td>
              <td>{t.campaignName}</td>
              <td>
                <div>{t.deliverableName}</div>
                <div className="hint" style={{ marginTop: 2 }}>{t.stageName}</div>
              </td>
              <td>
                <span className={`stage-status ${t.status}`} data-testid={`under-review-status-${t.stageId}`}>
                  {t.uiLabel}
                </span>
              </td>
              <td>
                <button
                  className="btn btn-ghost"
                  onClick={() => onOpenFeedback(t)}
                  data-testid={`under-review-feedback-btn-${t.stageId}`}
                  style={{ fontSize: 11.5, padding: '6px 10px' }}
                >
                  View Feedback
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
