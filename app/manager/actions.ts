'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import {
  requireStageAccessAsManagerOrAdmin,
  requireStageSubmitAccess,
  assertMemberInDepartment,
} from '@/lib/auth'
import { transitionStage, WorkflowError } from '@/lib/workflow'

/**
 * Manager (or Admin) assigns a Member to a stage. Legal only from `pending`.
 * Reassigning a stage that's already in flight is out of scope for Phase 2 —
 * a reassignment while in_progress / manager_review would need its own action
 * with its own state-machine story. Use sendBackStageAction / reassignForRevisionAction
 * for the existing revision paths.
 */
export async function assignToStageAction(stageId: number, assigneeName: string) {
  const { department } = await requireStageAccessAsManagerOrAdmin(stageId)
  if (department) {
    await assertMemberInDepartment(assigneeName, department)
  }

  const supabase = await createClient()
  await transitionStage(supabase, {
    stageId,
    expectedFrom: 'pending',
    to: 'in_progress',
    extra: { assignee: assigneeName },
  })

  revalidatePath('/manager', 'layout')
}

/**
 * Submit for manager review. Legal only from `in_progress`.
 * Callable by: the assigned Member (own stage), the department Manager, or Admin.
 */
export async function markReadyForReviewAction(stageId: number) {
  await requireStageSubmitAccess(stageId)

  const supabase = await createClient()
  await transitionStage(supabase, {
    stageId,
    expectedFrom: 'in_progress',
    to: 'manager_review',
  })

  revalidatePath('/manager', 'layout')
  revalidatePath('/member', 'layout')
}

/**
 * Manager approves internally → forwards to client review.
 * Legal only from `manager_review`.
 */
export async function approveStageAction(stageId: number) {
  await requireStageAccessAsManagerOrAdmin(stageId)

  const supabase = await createClient()
  await transitionStage(supabase, {
    stageId,
    expectedFrom: 'manager_review',
    to: 'client_review',
  })

  revalidatePath('/manager', 'layout')
}

/**
 * Manager sends work back to the team for more changes before it reaches the client.
 * Legal only from `manager_review` → `in_progress`. The optional note is saved atomically.
 */
export async function sendBackStageAction(stageId: number, note: string) {
  await requireStageAccessAsManagerOrAdmin(stageId)

  const supabase = await createClient()
  await transitionStage(supabase, {
    stageId,
    expectedFrom: 'manager_review',
    to: 'in_progress',
    extra: { note: note?.length ? note : null },
  })

  revalidatePath('/manager', 'layout')
  revalidatePath('/member', 'layout')
}

/**
 * After the client requested changes, the Manager reassigns the stage to the team
 * for rework. Legal only from `feedback` → `in_progress`.
 */
export async function reassignForRevisionAction(stageId: number) {
  await requireStageAccessAsManagerOrAdmin(stageId)

  const supabase = await createClient()
  await transitionStage(supabase, {
    stageId,
    expectedFrom: 'feedback',
    to: 'in_progress',
  })

  revalidatePath('/manager', 'layout')
  revalidatePath('/member', 'layout')
}

// Re-export the workflow error so consumers can distinguish 409-style workflow
// failures from authorization failures without importing from lib/workflow directly.
export { WorkflowError }
