// Server-only. Stage progression + deliverable/project progress calculation.
//
// This module is *infrastructure*. Phase 3 does NOT wire it to any existing
// server action. It will be called by the future Client-approval action
// (Phase 5+) and, if desired, by an admin "force-complete" tool.
//
// Progress formula (per Phase 3 spec):
//   deliverable_percent = 100 * (# stages with status='complete') / (# stages)
//                        (0 if the deliverable has no stages)
//   project_percent     = avg(deliverable_percent) across all deliverables
//                        (0 if the project has no deliverables)
//   Both are clamped to [0, 100].
//
// Concurrency model:
//   1. Stage transition uses lib/workflow.ts:transitionStage which does a
//      race-safe conditional UPDATE (WHERE id=? AND status=?). Only one
//      concurrent caller succeeds; the other gets WorkflowError('stale_state').
//   2. After the stage transition succeeds, project.completion_percent is
//      recomputed from the live rows. This step is self-healing:
//      - If it fails mid-way, the next successful completion recomputes the
//        correct value.
//      - Two concurrent completions across different stages both recompute
//        and converge to the same final value.
//   3. If strict transactional atomicity across (stage_update + project_update)
//      is ever required, migrate to a Postgres RPC (pmt_complete_stage_and_advance).
//      Not required for Phase 3 because this function is not yet wired to any
//      user-facing action.

import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'
import { transitionStage, WorkflowError, type StageStatus } from './workflow'

export type StageRow = {
  id: number
  deliverable_id: number
  stage_order: number
  status: string
  stage_name: string
}

/** Loads all sibling stages of a deliverable ordered by stage_order (ascending).
 *  Returns the row whose stage_order is the immediately-next one after `current`.
 *  Uses row comparison rather than `+ 1` so gaps in stage_order don't break us.
 *  Returns null if the current stage is the final stage in the deliverable. */
export async function getNextStage(
  supabase: SupabaseClient,
  current: { deliverable_id: number; stage_order: number },
): Promise<StageRow | null> {
  const { data, error } = await supabase
    .from('deliverable_stages')
    .select('id, deliverable_id, stage_order, status, stage_name')
    .eq('deliverable_id', current.deliverable_id)
    .gt('stage_order', current.stage_order)
    .order('stage_order', { ascending: true })
    .limit(1)
    .maybeSingle()

  if (error) throw new WorkflowError('stale_state', 'Could not resolve next stage.')
  return (data as StageRow) ?? null
}

export type DeliverableProgress = {
  deliverable_id: number
  total_stages: number
  completed_stages: number
  percent: number
  is_complete: boolean
}

/** Reads live deliverable_stages rows and returns progress. Source of truth is
 *  the actual stage statuses — never trusts a snapshot column. */
export async function calculateDeliverableProgress(
  supabase: SupabaseClient,
  deliverableId: number,
): Promise<DeliverableProgress> {
  const { data, error } = await supabase
    .from('deliverable_stages')
    .select('id, status')
    .eq('deliverable_id', deliverableId)

  if (error) throw new WorkflowError('stale_state', 'Could not read deliverable stages.')

  const total = data?.length ?? 0
  const completed = (data ?? []).filter((r) => r.status === 'complete').length
  const percent = total === 0 ? 0 : clamp(Math.round((100 * completed) / total))
  return {
    deliverable_id: deliverableId,
    total_stages: total,
    completed_stages: completed,
    percent,
    is_complete: total > 0 && completed === total,
  }
}

export type ProjectProgress = {
  project_id: number
  deliverables_count: number
  percent: number
  per_deliverable: DeliverableProgress[]
}

/** Reads live deliverable + stage rows for a project and returns the project
 *  progress = average of per-deliverable percents. Zero deliverables → 0%. */
export async function calculateProjectProgress(
  supabase: SupabaseClient,
  projectId: number,
): Promise<ProjectProgress> {
  const { data: delivs, error: dErr } = await supabase
    .from('deliverables')
    .select('id')
    .eq('project_id', projectId)

  if (dErr) throw new WorkflowError('stale_state', 'Could not read deliverables.')

  const per: DeliverableProgress[] = []
  for (const d of delivs ?? []) {
    per.push(await calculateDeliverableProgress(supabase, d.id))
  }

  const percent =
    per.length === 0 ? 0 : clamp(Math.round(per.reduce((s, p) => s + p.percent, 0) / per.length))

  return {
    project_id: projectId,
    deliverables_count: per.length,
    percent,
    per_deliverable: per,
  }
}

/** Recomputes projects.completion_percent from live rows and persists it.
 *  Best-effort: throws WorkflowError on failure, but callers should treat this
 *  as advisory — the underlying stage row is already the source of truth and
 *  the next successful completion will recompute correctly.
 *  ALSO synchronises the (denormalised) projects.deliverables count from the
 *  live count of deliverables rows so it stops drifting further. */
export async function recomputeProjectProgress(
  supabase: SupabaseClient,
  projectId: number,
): Promise<ProjectProgress> {
  const progress = await calculateProjectProgress(supabase, projectId)

  const { error } = await supabase
    .from('projects')
    .update({
      completion_percent: progress.percent,
      deliverables: progress.deliverables_count,
    })
    .eq('id', projectId)

  if (error) {
    console.error('recomputeProjectProgress: failed to persist', { projectId, error })
    throw new WorkflowError('stale_state', 'Could not update project progress.')
  }

  return progress
}

export type CompleteAndAdvanceResult = {
  stage_id: number
  deliverable_id: number
  project_id: number
  next_stage_id: number | null
  next_stage_status: string | null
  deliverable: DeliverableProgress
  project: ProjectProgress
  warnings: string[]
}

/**
 * The core progression engine.
 *
 *   client_review → complete
 *   → verify + find next stage (do NOT modify later stages)
 *   → recompute deliverable percent (derived from actual rows)
 *   → recompute + persist project.completion_percent
 *
 * Preconditions:
 *   - stage exists
 *   - stage.status === 'client_review'  (the only status the workflow matrix
 *     permits transitioning to 'complete')
 *
 * On stale/duplicate calls the conditional UPDATE inside transitionStage sees
 * status != 'client_review' and throws WorkflowError('stale_state'). Only the
 * first caller succeeds — the second caller does NOT re-run the recompute
 * (which would still produce a correct value, but we don't want to double
 * work).
 *
 * Never modifies:
 *   - the current stage's assignee, note, revision_count, or stage_order
 *   - any later stage's status, assignee, or stage_order
 *   - the deliverable row (there is no persisted deliverable status column)
 *   - revision_count on any row (revision handling is a future phase)
 *
 * IMPORTANT: this function performs authorization NEEDING to already have been
 * done by the caller. It is server-side infrastructure. Do not expose it
 * directly to browser requests without an auth guard around it.
 */
export async function completeStageAndAdvance(
  supabase: SupabaseClient,
  stageId: number,
): Promise<CompleteAndAdvanceResult> {
  const warnings: string[] = []

  // Load the current stage FIRST so we know its deliverable/project even if the
  // transition throws (useful for error surfaces).
  const { data: stage, error: sErr } = await supabase
    .from('deliverable_stages')
    .select('id, deliverable_id, stage_order, status')
    .eq('id', stageId)
    .maybeSingle()

  if (sErr) throw new WorkflowError('stale_state', 'Could not read stage.')
  if (!stage) throw new WorkflowError('not_found', 'Stage not found.')

  // The 'client_review' → 'complete' transition is the ONLY legal path per the
  // Phase 2 matrix. transitionStage will reject anything else with a 409.
  await transitionStage(supabase, {
    stageId,
    expectedFrom: 'client_review' as StageStatus,
    to: 'complete' as StageStatus,
  })

  // Find the next stage but DO NOT modify it. Per Phase 3 spec §6, we do not
  // introduce a persisted 'ready' state; the next stage is already actionable
  // by virtue of being 'pending'. We only validate the invariant that the next
  // stage is not already 'complete' (which would indicate data corruption).
  const next = await getNextStage(supabase, {
    deliverable_id: stage.deliverable_id,
    stage_order: stage.stage_order,
  })

  if (next && next.status === 'complete') {
    warnings.push(
      `data-integrity: next stage id=${next.id} was already complete before the previous stage advanced. Not modified.`,
    )
  }

  // Look up the project id via the deliverable row.
  const { data: deliv, error: dErr } = await supabase
    .from('deliverables')
    .select('project_id')
    .eq('id', stage.deliverable_id)
    .maybeSingle()

  if (dErr || !deliv?.project_id) {
    // Stage completion already succeeded and is durable. Progress recompute is
    // best-effort; report the anomaly but don't fail the completion.
    warnings.push('could-not-locate-project-for-recompute')
    const del = await calculateDeliverableProgress(supabase, stage.deliverable_id)
    return {
      stage_id: stage.id,
      deliverable_id: stage.deliverable_id,
      project_id: -1,
      next_stage_id: next?.id ?? null,
      next_stage_status: next?.status ?? null,
      deliverable: del,
      project: { project_id: -1, deliverables_count: 0, percent: 0, per_deliverable: [] },
      warnings,
    }
  }

  const deliverable = await calculateDeliverableProgress(supabase, stage.deliverable_id)
  const project = await recomputeProjectProgress(supabase, deliv.project_id)

  return {
    stage_id: stage.id,
    deliverable_id: stage.deliverable_id,
    project_id: deliv.project_id,
    next_stage_id: next?.id ?? null,
    next_stage_status: next?.status ?? null,
    deliverable,
    project,
    warnings,
  }
}

function clamp(n: number): number {
  if (!Number.isFinite(n)) return 0
  if (n < 0) return 0
  if (n > 100) return 100
  return n
}
