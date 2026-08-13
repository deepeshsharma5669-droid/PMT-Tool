'use client'
import type { MemberTaskRow } from '@/lib/member-data'

type Props = { task: MemberTaskRow | null; onClose: () => void }

export function FeedbackModal({ task, onClose }: Props) {
  if (!task) return null
  const feedback = (task.note ?? '').trim()

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      data-testid="feedback-modal"
    >
      <div
        className="modal-content"
        style={{ maxWidth: 520 }}
        onClick={e => e.stopPropagation()}
      >
        <div className="modal-header">
          <div>
            <div className="hint" data-testid="feedback-modal-client">
              {task.clientName} · {task.campaignName}
            </div>
            <h2 data-testid="feedback-modal-deliverable">
              {task.deliverableName} — {task.stageName}
            </h2>
          </div>
          <button
            className="btn btn-ghost"
            onClick={onClose}
            data-testid="feedback-modal-close"
            style={{ padding: '4px 10px' }}
          >
            Close
          </button>
        </div>
        <div className="modal-body">
          <div className="review-section">
            <h3>Feedback</h3>
            <div className="review-box" data-testid="feedback-modal-body">
              {feedback ? (
                <div style={{ whiteSpace: 'pre-wrap', color: 'var(--ink)', fontSize: 13 }}>
                  {feedback}
                </div>
              ) : (
                <div className="hint">No specific feedback left yet.</div>
              )}
            </div>
          </div>
          {task.revisionCount > 0 && (
            <div className="hint" data-testid="feedback-modal-revisions">
              Revision round: {task.revisionCount}
            </div>
          )}
        </div>
        <div className="modal-footer">
          <button
            className="btn btn-primary"
            onClick={onClose}
            data-testid="feedback-modal-dismiss"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  )
}
