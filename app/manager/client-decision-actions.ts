'use server'

// ============================================================================
// MANAGER-MEDIATED CLIENT DECISION ACTIONS
// ----------------------------------------------------------------------------
// PMT has NO Client role and NO Client authentication. Clients communicate
// with the account Manager through channels outside PMT (phone, WhatsApp,
// email, meetings). The Manager RECORDS the client's externally-communicated
// decision here.
//
// This file replaces the previous Phase-4 "simulate-client-actions" module
// (which was intentionally temporary). The workflow itself has not changed:
//   * recordClientApprovalAction — client_review → complete
//   * recordClientChangesAction  — client_review → feedback (+revision)
// Only naming, wording, and attribution have moved from "simulation" to
// "permanent Manager-mediated Client decision".
//
// Attribution:
//   * `Recorded by <name>` and `Recorded at <ISO>` are persisted for the
//     changes path INSIDE the existing `deliverable_stages.note` field
//     using a small structured header. The client's actual feedback text
//     follows the header verbatim. No new schema is added.
//   * For the approval path, `deliverable_stages.updated_at` already gives
//     "when". "Who" is returned by the action for the current UI but not
//     persisted (no schema change in this phase).
//
// Every mutation goes through Phase-2 `transitionStage` (atomic conditional
// UPDATE) and Phase-3 `completeStageAndAdvance`. Nothing here reimplements
// state-machine or progression logic.
// ============================================================================

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { requireStageAccessAsManagerOrAdmin } from '@/lib/auth'
import { WorkflowError } from '@/lib/workflow'
import { completeStageAndAdvance, type CompleteAndAdvanceResult } from '@/lib/progression'

const MAX_FEEDBACK_LENGTH = 2000

export type ClientApprovalRecord = CompleteAndAdvanceResult & {
  recordedBy: string
  recordedAt: string
}

/**
 * Record that the Client (contacted externally by the Manager) APPROVED
 * this stage. Delegates to Phase-3 completeStageAndAdvance. Legal only from
 * status = 'client_review'; every other status is rejected by
 * transitionStage inside completeStageAndAdvance.
 *
 * Authorization: Admin, or the Manager whose department owns the stage.
 * Members are rejected by requireStageAccessAsManagerOrAdmin.
 */
export async function recordClientApprovalAction(stageId: number): Promise<ClientApprovalRecord> {
  const { user } = await requireStageAccessAsManagerOrAdmin(stageId)
  const supabase = await createClient()
  const result = await completeStageAndAdvance(supabase, stageId)
  revalidatePath('/manager', 'layout')
  revalidatePath('/admin', 'layout')
  revalidatePath('/member', 'layout')
  return {
    ...result,
    recordedBy: user.name,
    recordedAt: new Date().toISOString(),
  }
}

/**
 * Record that the Client (contacted externally by the Manager) REQUESTED
 * CHANGES to this stage. Atomically:
 *   status: client_review → feedback
 *   revision_count: += 1  (exactly once, protected by compound CAS)
 *   note: `Recorded by <name> on <ISO>:\n\n<client feedback>`
 *
 * Concurrency: the UPDATE matches on both status AND the observed
 * revision_count, so duplicate clicks / concurrent requests never
 * double-increment. Only one caller wins; the rest get
 * WorkflowError('stale_state').
 *
 * Authorization: Admin, or the Manager whose department owns the stage.
 */
export async function recordClientChangesAction(
  stageId: number,
  feedbackNote: string,
): Promise<{ stage_id: number; revision_count: number; recordedBy: string; recordedAt: string }> {
  const { user } = await requireStageAccessAsManagerOrAdmin(stageId)

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
  // revision_count) prevents a lost increment even if a full revision loop
  // lands the stage back in client_review between our read and our write.
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
  const recordedAt = new Date().toISOString()
  const attributedNote = `Recorded by ${user.name} on ${recordedAt}:\n\n${note}`

  const { data: rows, error: upErr } = await supabase
    .from('deliverable_stages')
    .update({
      status: 'feedback',
      revision_count: observed + 1,
      note: attributedNote,
      updated_at: recordedAt,
    })
    .eq('id', stageId)
    .eq('status', 'client_review')
    .eq('revision_count', observed)
    .select('id, revision_count')

  if (upErr) {
    console.error('recordClientChangesAction: db error', upErr)
    throw new WorkflowError('stale_state', 'Could not record client changes; please refresh and try again.')
  }
  if (!rows || rows.length === 0) {
    throw new WorkflowError('stale_state', 'Stage is no longer awaiting client review.')
  }

  revalidatePath('/manager', 'layout')
  revalidatePath('/admin', 'layout')
  revalidatePath('/member', 'layout')

  return {
    stage_id: stageId,
    revision_count: rows[0].revision_count,
    recordedBy: user.name,
    recordedAt,
  }
}
