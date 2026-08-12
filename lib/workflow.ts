// Server-only. Central state-machine for deliverable_stages.
//
// Every stage-mutating server action must go through `transitionStage`,
// which enforces:
//   1. the requested transition is legal per TRANSITIONS
//   2. the row is currently in the expected `from` state (conditional UPDATE)
//   3. the update is atomic (single SQL statement, race-safe)
//
// Never accepts a status value from the browser. The action decides what
// operation it represents; this module decides what transition that operation
// actually is.

import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'

export const STAGE_STATUSES = [
  'pending',
  'in_progress',
  'manager_review',
  'client_review',
  'feedback',
  'complete',
  'hold',
] as const

export type StageStatus = typeof STAGE_STATUSES[number]

/** Allowed status transitions.
 *
 *  Keys are the CURRENT status; values are the set of statuses that are
 *  legal to move into.
 *
 *  Two "half-transitions" are defined but intentionally not wired to any
 *  server action in Phase 2 — the Client actions will be re-implemented on
 *  top of this module in a later phase:
 *    client_review → complete   (client approval)
 *    client_review → feedback   (client requests changes)
 *
 *  `hold`: The value is displayed by the UI (lib/manager-status.ts,
 *  components/*), but no code path currently writes it to the DB, and no
 *  action moves stages into or out of it. We deliberately leave its
 *  transitions empty for Phase 2. A future phase should introduce explicit
 *  hold entry/exit actions with a dedicated UI. Any pre-existing rows in
 *  `hold` (there are none in the current DB) will simply be un-actionable
 *  until then.
 */
export const TRANSITIONS: Readonly<Record<StageStatus, ReadonlyArray<StageStatus>>> = {
  pending: ['in_progress'],
  in_progress: ['manager_review'],
  manager_review: ['in_progress', 'client_review'],
  client_review: ['complete', 'feedback'],
  feedback: ['in_progress'],
  complete: [],
  hold: [],
}

export function isValidTransition(from: StageStatus, to: StageStatus): boolean {
  return (TRANSITIONS[from] ?? []).includes(to)
}

export function isStageStatus(v: unknown): v is StageStatus {
  return typeof v === 'string' && (STAGE_STATUSES as ReadonlyArray<string>).includes(v)
}

/** Application-level error for illegal or stale transitions. Never carries
 *  raw SQL / driver errors — the caller can safely surface `message` to the
 *  browser. */
export class WorkflowError extends Error {
  readonly code: 'invalid_transition' | 'stale_state' | 'not_found' | 'unknown_status'
  readonly status: number
  constructor(code: WorkflowError['code'], message: string) {
    super(message)
    this.name = 'WorkflowError'
    this.code = code
    this.status = code === 'not_found' ? 404 : 409
  }
}

type TransitionArgs = {
  stageId: number
  /** One or more statuses the row must currently be in. When more than one is
   *  passed, every entry must independently be a legal `from` for `to`. */
  expectedFrom: StageStatus | ReadonlyArray<StageStatus>
  to: StageStatus
  /** Additional columns to update atomically alongside `status` (e.g. assignee
   *  when assigning, note when sending back). Do NOT pass `status` here — that
   *  is what `to` is for; the helper will throw if you do. */
  extra?: Record<string, unknown>
}

/**
 * Atomic conditional status transition:
 *
 *   UPDATE deliverable_stages
 *   SET status = <to>, updated_at = now(), <extra…>
 *   WHERE id = <stageId> AND status IN (<expectedFrom…>)
 *
 * If zero rows change (someone else beat us to it, the browser had stale UI,
 * or the row was in a different state) we throw `WorkflowError('stale_state')`.
 *
 * Never leaks database internals to the caller.
 */
export async function transitionStage(
  supabase: SupabaseClient,
  args: TransitionArgs,
): Promise<void> {
  const { stageId, expectedFrom, to, extra = {} } = args

  const fromArr: ReadonlyArray<StageStatus> = Array.isArray(expectedFrom)
    ? expectedFrom
    : [expectedFrom]

  if (fromArr.length === 0) {
    throw new WorkflowError('invalid_transition', 'No source state supplied.')
  }

  // Every declared `from` must independently permit `to` per TRANSITIONS.
  for (const from of fromArr) {
    if (!isValidTransition(from, to)) {
      throw new WorkflowError(
        'invalid_transition',
        `Transition ${from} → ${to} is not permitted.`,
      )
    }
  }

  // Defence-in-depth: never allow the caller to sneak a status through `extra`.
  if (Object.prototype.hasOwnProperty.call(extra, 'status')) {
    throw new WorkflowError(
      'invalid_transition',
      'Internal: `status` must not be passed via `extra`; use the `to` argument.',
    )
  }

  const nowIso = new Date().toISOString()

  const base = supabase
    .from('deliverable_stages')
    .update({ ...extra, status: to, updated_at: nowIso })
    .eq('id', stageId)

  const conditional = fromArr.length === 1
    ? base.eq('status', fromArr[0])
    : base.in('status', fromArr as unknown as string[])

  // .select() so we can distinguish "updated" (>=1 row) from "no-op" (0 rows).
  const { data, error } = await conditional.select('id, status')

  if (error) {
    console.error('transitionStage: db error on conditional update', { stageId, to, fromArr, error })
    throw new WorkflowError('stale_state', 'Could not update the stage; please refresh and try again.')
  }

  if (data && data.length > 0) return

  // Zero rows matched — figure out why so we return a useful message.
  const { data: probe, error: probeErr } = await supabase
    .from('deliverable_stages')
    .select('status')
    .eq('id', stageId)
    .maybeSingle()

  if (probeErr) {
    console.error('transitionStage: db error on probe', { stageId, probeErr })
    throw new WorkflowError('stale_state', 'Could not verify stage state; please refresh and try again.')
  }
  if (!probe) throw new WorkflowError('not_found', 'Stage not found.')

  const humanFrom = fromArr.length === 1 ? fromArr[0] : fromArr.join(' or ')
  throw new WorkflowError(
    'stale_state',
    `Stage must be in ${humanFrom} to perform this action (currently ${probe.status}).`,
  )
}
