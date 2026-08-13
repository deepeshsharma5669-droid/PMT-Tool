'use client'
import { useState } from 'react'
import type { MemberTaskRow } from '@/lib/member-data'
import { MyTasksTable } from './MyTasksTable'
import { UnderReviewTable } from './UnderReviewTable'
import { CompletedTable } from './CompletedTable'
import { FeedbackModal } from './FeedbackModal'

type Props = {
  myTasks: MemberTaskRow[]
  underReview: MemberTaskRow[]
  completed: MemberTaskRow[]
}

export function MemberSections({ myTasks, underReview, completed }: Props) {
  const [feedbackFor, setFeedbackFor] = useState<MemberTaskRow | null>(null)

  return (
    <>
      <section className="card" style={{ marginBottom: 20 }} data-testid="section-my-tasks">
        <div className="panel-head">
          <h2>1. My Tasks</h2>
          <span className="hint">{myTasks.length} active</span>
        </div>
        <MyTasksTable tasks={myTasks} onOpenFeedback={setFeedbackFor} />
      </section>

      <section className="card" style={{ marginBottom: 20 }} data-testid="section-under-review">
        <div className="panel-head">
          <h2>2. Under Review</h2>
          <span className="hint">{underReview.length} awaiting review</span>
        </div>
        <UnderReviewTable tasks={underReview} onOpenFeedback={setFeedbackFor} />
      </section>

      <section className="card" data-testid="section-completed">
        <div className="panel-head">
          <h2>3. Completed Projects</h2>
          <span className="hint">{completed.length} approved</span>
        </div>
        <CompletedTable tasks={completed} />
      </section>

      <FeedbackModal task={feedbackFor} onClose={() => setFeedbackFor(null)} />
    </>
  )
}
