'use server'

// ============================================================================
// TEMPORARY CLIENT SIMULATION
// ----------------------------------------------------------------------------
// These two actions allow Admin/Manager users to drive stages past
// `client_review` for end-to-end testing until real Client authentication
// and portal are implemented.
//
// WHEN REMOVING:
//   1. Delete this file.
//   2. Delete the "Simulate Client" UI block in
//      components/manager/ApprovalRow.tsx (search for TEMPORARY CLIENT SIMULATION).
//   3. That is all — no other file references this module.
//
// Notes:
//   * These are Admin/Manager server actions. They do NOT create a Client
//     session, do NOT set a Client cookie, and do NOT touch anything under
//     /app/client/**. The role model remains {Admin, Manager, Member}.
//   * They delegate to the shared Phase 2 workflow module and the Phase 3
//     progression engine — no state-machine, next-stage, or progress logic
//     is duplicated here.
// ============================================================================

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { requireStageAccessAsManagerOrAdmin } from '@/lib/auth'
import { WorkflowError } from '@/lib/workflow'
import { completeStageAndAdvance, type CompleteAndAdvanceResult } from '@/lib/progression'

const MAX_FEEDBACK_LENGTH = 2000

/**
 * TEMPORARY CLIENT SIMULATION — Client Approval.
 * Delegates to Phase 3's completeStageAndAdvance. Authorization is the same
 * department-scoped guard used elsewhere for the stage (Phase 1).
 *
 * Legal only from `client_review`; every other current status is rejected by
 * transitionStage inside completeStageAndAdvance.
 */
export async function simulateClientApproveStageAction(stageId: number): Promise<CompleteAndAdvanceResult> {
  await requireStageAccessAsManagerOrAdmin(stageId)
  const supabase = await createClient()
  const result = await completeStageAndAdvance(supabase, stageId)
  revalidatePath('/manager', 'layout')
  revalidatePath('/admin', 'layout')
  return result
}

/**
 * TEMPORARY CLIENT SIMULATION — Client Request Changes.
 * Atomically:
 *   status: client_review → feedback
 *   revision_count: += 1  (exactly once, protected by compound CAS)
 *   note: stored as the latest client feedback
 *
 * Concurrency: the UPDATE matches on both status AND the observed
 * revision_count, so duplicate clicks / concurrent requests can never double-
 * increment. Only one caller wins; the rest get WorkflowError('stale_state').
 */
export async function simulateClientRequestChangesAction(
  stageId: number,
  feedbackNote: string,
): Promise<{ stage_id: number; revision_count: number }> {
  await requireStageAccessAsManagerOrAdmin(stageId)

  const note = (feedbackNote ?? '').trim()
  if (!note) throw new WorkflowError('invalid_transition', 'Client feedback is required.')
  if (note.length > MAX_FEEDBACK_LENGTH) {
    throw new WorkflowError(
      'invalid_transition',
      `Client feedback must be ${MAX_FEEDBACK_LENGTH} characters or fewer.`,
    )
  }

  const supabase = await createClient()

  // Snapshot the current revision_count under the client_review guard so we
  // can bump it atomically. The compound CAS on the UPDATE below (status AND
  // revision_count) prevents a lost increment even in the extreme case where
  // a full revision loop lands the stage back in client_review between our
  // read and our write.
  const { data: current, error: readErr } = await supabase
    .from('deliverable_stages')
    .select('status, revision_count')
    .eq('id', stageId)
    .maybeSingle()

  if (readErr) throw new WorkflowError('stale_state', 'Could not read stage.')
  if (!current) throw new WorkflowError('not_found', 'Stage not found.')
  if (current.status !== 'client_review') {
    throw new WorkflowError(
      'stale_state',
      `Stage is no longer awaiting client review (currently ${current.status}).`,
    )
  }
  const observed = current.revision_count ?? 0

  const { data: rows, error: upErr } = await supabase
    .from('deliverable_stages')
    .update({
      status: 'feedback',
      revision_count: observed + 1,
      note,
      updated_at: new Date().toISOString(),
    })
    .eq('id', stageId)
    .eq('status', 'client_review')
    .eq('revision_count', observed)
    .select('id, revision_count')

  if (upErr) {
    console.error('simulateClientRequestChangesAction: db error', upErr)
    throw new WorkflowError('stale_state', 'Could not record client feedback; please refresh and try again.')
  }
  if (!rows || rows.length === 0) {
    throw new WorkflowError('stale_state', 'Stage is no longer awaiting client review.')
  }

  revalidatePath('/manager', 'layout')
  revalidatePath('/admin', 'layout')

  return { stage_id: stageId, revision_count: rows[0].revision_count }
}
