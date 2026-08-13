'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import {
  requireStageAccessAsManagerOrAdmin,
  requireStageSubmitAccess,
  assertMemberInDepartment,
  AuthError,
} from '@/lib/auth'
import { transitionStage, WorkflowError } from '@/lib/workflow'

/**
 * Resolve a Member's Supabase Auth user_id (auth.users.id) from their
 * managers.email. Uses the service-role admin API. Returns null if no
 * matching auth user exists (e.g. Member row was created but the person
 * never registered/confirmed).
 *
 * The auth Admin API's listUsers endpoint doesn't accept a server-side
 * email filter, so we paginate and match in memory. The workspace's user
 * base is tiny (single-digit users at Phase 5); this is acceptable and
 * runs only during a Manager assign click.
 */
async function resolveAuthUserIdByEmail(email: string): Promise<string | null> {
  const admin = createAdminClient()
  const needle = email.toLowerCase()
  const perPage = 200
  let page = 1
  // Hard cap to prevent runaway loops if listUsers ever misbehaves.
  while (page <= 25) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage })
    if (error) {
      console.error('resolveAuthUserIdByEmail: listUsers failed', error)
      return null
    }
    const users = data?.users ?? []
    const match = users.find(u => (u.email ?? '').toLowerCase() === needle)
    if (match) return match.id
    if (users.length < perPage) return null
    page += 1
  }
  return null
}

/**
 * Manager (or Admin) assigns a Member to a stage.
 *
 * Phase 5 change: writes BOTH the legacy `assignee` display name AND the
 * authoritative `assignee_user_id` UUID. Every Member-side query and
 * every Member-side server action uses `assignee_user_id` for ownership;
 * the text column is retained for backwards compatibility with existing
 * Manager views (Workload table, MyStageCard header, etc.).
 *
 * Validation (Phase 5 §4):
 *   1. authenticate Manager/Admin  (requireStageAccessAsManagerOrAdmin)
 *   2. verify stage access          ( "   "   "     "  )
 *   3. resolve stage department     ( "   "   "     "  )
 *   4. resolve target Member        (assertMemberInDepartment: exists + role=Member + same department)
 *   5. resolve auth.users.id        (resolveAuthUserIdByEmail)
 *   6. write assignee_user_id + assignee (atomic UPDATE via transitionStage.extra)
 *
 * Never trusts a browser-supplied role, department, or user_id.
 */
export async function assignToStageAction(stageId: number, assigneeName: string) {
  const { department } = await requireStageAccessAsManagerOrAdmin(stageId)
  if (!department) throw new AuthError('Stage has no department; contact an admin')

  await assertMemberInDepartment(assigneeName, department)

  const supabase = await createClient()

  // Look up the target Member's email from the managers row we just validated.
  const { data: memberRow } = await supabase
    .from('managers')
    .select('email')
    .eq('name', assigneeName)
    .eq('role', 'Member')
    .eq('department', department)
    .maybeSingle()

  if (!memberRow?.email) throw new AuthError('Assignee has no email on file; contact an admin')

  const authUserId = await resolveAuthUserIdByEmail(memberRow.email)
  if (!authUserId) throw new AuthError('Assignee has not registered a login yet')

  await transitionStage(supabase, {
    stageId,
    expectedFrom: 'pending',
    to: 'in_progress',
    extra: { assignee: assigneeName, assignee_user_id: authUserId },
  })

  revalidatePath('/manager', 'layout')
  revalidatePath('/member', 'layout')
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
