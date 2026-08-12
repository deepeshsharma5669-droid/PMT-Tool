'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function assignToStageAction(stageId: number, assigneeName: string) {
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

/** Team member's work is done — sends it to the manager for review. */
export async function markReadyForReviewAction(stageId: number) {
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
}

/** Manager approves internally — sends it on to the client. */
export async function approveStageAction(stageId: number) {
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
}

/** Client requested changes (via the Client portal) — manager reassigns it
 *  back to the team to actually work the revision. */
export async function reassignForRevisionAction(stageId: number) {
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
}