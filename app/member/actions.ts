'use server'
// Server actions for the Member portal (Phase 5).
//
// All three actions:
//   * verify the caller is a signed-in Member (via requireMember → requireStageOwnership)
//   * verify the Member owns THIS stage via assignee_user_id (NEVER by name)
//   * delegate the actual mutation to Phase 2's `transitionStage`
//   * never accept a status value from the browser
//   * never mutate revision_count (that's Client-simulation's job in Phase 4)

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { requireStageOwnership } from '@/lib/member-data'
import { transitionStage, WorkflowError } from '@/lib/workflow'

/** Member starts an assigned task. Legal only from `pending`. */
export async function startWorkAction(stageId: number) {
  await requireStageOwnership(stageId)
  const supabase = await createClient()
  await transitionStage(supabase, {
    stageId,
    expectedFrom: 'pending',
    to: 'in_progress',
  })
  revalidatePath('/member', 'layout')
  revalidatePath('/manager', 'layout')
}

/** Member resumes rework after Manager/Client feedback. Legal only from `feedback`. */
export async function resumeWorkAction(stageId: number) {
  await requireStageOwnership(stageId)
  const supabase = await createClient()
  await transitionStage(supabase, {
    stageId,
    expectedFrom: 'feedback',
    to: 'in_progress',
  })
  revalidatePath('/member', 'layout')
  revalidatePath('/manager', 'layout')
}

/** Member submits their work for Manager review. Legal only from `in_progress`. */
export async function submitForReviewAction(stageId: number) {
  await requireStageOwnership(stageId)
  const supabase = await createClient()
  await transitionStage(supabase, {
    stageId,
    expectedFrom: 'in_progress',
    to: 'manager_review',
  })
  revalidatePath('/member', 'layout')
  revalidatePath('/manager', 'layout')
}

export { WorkflowError }
