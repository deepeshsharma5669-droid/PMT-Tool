'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import {
  requireStageAccessAsManagerOrAdmin,
  requireStageSubmitAccess,
  assertMemberInDepartment,
} from '@/lib/auth'

export async function assignToStageAction(stageId: number, assigneeName: string) {
  const { department } = await requireStageAccessAsManagerOrAdmin(stageId)
  // A Manager may only assign a Member from their own department. Admins can assign
  // to anyone, but we still require the assignee to be a real Member row somewhere.
  if (department) {
    await assertMemberInDepartment(assigneeName, department)
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from('deliverable_stages')
    .update({ assignee: assigneeName, status: 'in_progress' })
    .eq('id', stageId)

  if (error) {
    console.error('assignToStageAction error:', error)
    throw new Error(error.message)
  }
  revalidatePath('/manager', 'layout')
}

/** Team member's work is done — sends it to the manager for review.
 *  Callable by: the assigned Member, the department Manager, or an Admin. */
export async function markReadyForReviewAction(stageId: number) {
  await requireStageSubmitAccess(stageId)

  const supabase = await createClient()
  const { error } = await supabase
    .from('deliverable_stages')
    .update({ status: 'manager_review' })
    .eq('id', stageId)

  if (error) {
    console.error('markReadyForReviewAction error:', error)
    throw new Error(error.message)
  }
  revalidatePath('/manager', 'layout')
  revalidatePath('/member', 'layout')
}

/** Manager approves internally — sends it on to the client. */
export async function approveStageAction(stageId: number) {
  await requireStageAccessAsManagerOrAdmin(stageId)

  const supabase = await createClient()
  const { error } = await supabase
    .from('deliverable_stages')
    .update({ status: 'client_review' })
    .eq('id', stageId)

  if (error) {
    console.error('approveStageAction error:', error)
    throw new Error(error.message)
  }
  revalidatePath('/manager', 'layout')
}

/** Manager sends work back to the team for more changes before it goes to the client. */
export async function sendBackStageAction(stageId: number, note: string) {
  await requireStageAccessAsManagerOrAdmin(stageId)

  const supabase = await createClient()
  const { error } = await supabase
    .from('deliverable_stages')
    .update({ status: 'in_progress', note: note || null })
    .eq('id', stageId)

  if (error) {
    console.error('sendBackStageAction error:', error)
    throw new Error(error.message)
  }
  revalidatePath('/manager', 'layout')
  revalidatePath('/member', 'layout')
}

/** Client requested changes (via the Client portal) — manager reassigns it
 *  back to the team to actually work the revision. */
export async function reassignForRevisionAction(stageId: number) {
  await requireStageAccessAsManagerOrAdmin(stageId)

  const supabase = await createClient()
  const { error } = await supabase
    .from('deliverable_stages')
    .update({ status: 'in_progress' })
    .eq('id', stageId)

  if (error) {
    console.error('reassignForRevisionAction error:', error)
    throw new Error(error.message)
  }
  revalidatePath('/manager', 'layout')
  revalidatePath('/member', 'layout')
}
