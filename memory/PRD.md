# PMT-Tool — Product Requirements & Implementation Log

## Original problem statement (verbatim, latest instruction)
Phase 5: implement the REAL MEMBER workflow and Member dashboard.
Sections: My Tasks, Under Review, Completed Projects. KPI cards: Clients worked with, Campaigns, Overall tasks, Pending approvals.
Authoritative ownership: deliverable_stages.assignee_user_id UUID → auth.users(id). Manager assignment writes it. Member queries/actions derive ownership from it. Never modify authentication, lib/auth.ts, lib/workflow.ts, lib/progression.ts, phase-4 simulate-client-actions, DB schema (after migration), DB data, RLS, or Client functionality.

## Architecture
- Next.js 16 App Router + TypeScript + Supabase (existing).
- Auth: Supabase Auth (Phase 1). Roles Admin/Manager/Member; Client not implemented.
- Workflow state machine: `lib/workflow.ts::transitionStage` (Phase 2). Atomic conditional UPDATE.
- Progression engine: `lib/progression.ts::completeStageAndAdvance` (Phase 3).
- Temp Client simulation (Phase 4): `app/manager/simulate-client-actions.ts` + UI in `components/manager/ApprovalRow.tsx`. Marked for future removal.
- Server actions preview fix: `next.config.ts` `experimental.serverActions.allowedOrigins` includes both `pmt-repo-restore.*` and legacy `71f6ab03-*` hosts.

## User personas
- **Admin** (`product@finace.co`): manages clients, projects, users, sequences, org settings.
- **Design Manager** (`james@gmail.com`): assigns Design stages to Members, reviews submissions, runs Phase-4 Client simulation.
- **Design Member** (`belsareharsh814@gmail.com` / harsh belsare): sees only their own tasks, starts / submits / reworks.

## Static / core requirements
- Ownership: `deliverable_stages.assignee_user_id` UUID FK to `auth.users(id)`, `ON DELETE SET NULL`, indexed. Legacy `assignee` text column retained for compat.
- Member sections: 1) My Tasks (pending/in_progress/feedback) 2) Under Review (manager_review/client_review) 3) Completed Projects (complete).
- Members must never approve their own work; never trigger Client approval.
- UI labels: In Progress, Rework Needed, Pending Review, Approved — presentation only, DB statuses unchanged.
- Members can only see stages where `assignee_user_id === auth.uid`.
- Manager assign validation (Phase-5 §4): Manager/Admin auth → stage access → dept resolution → target Member exists (role=Member, dept matches stage) → resolve auth_user_id → write assignee + assignee_user_id atomically.

## What's been implemented (dates)
### 2026-08-13 — Phase 5 delivered
- DB migration (user-run in Supabase SQL Editor): added `deliverable_stages.assignee_user_id UUID NULL REFERENCES auth.users(id) ON DELETE SET NULL` and `idx_deliverable_stages_assignee_user_id`. Existing 35 production stages left with `assignee_user_id = NULL`.
- `lib/member-data.ts` — new: `requireMember`, `requireStageOwnership`, `getMyTasks`, `getMyUnderReview`, `getMyCompletedProjects`, `getMyStats`, `memberUiLabel`. Owner check strictly `assignee_user_id === authUserId`. No name fallback. Batched queries (stages → deliverables → projects).
- `app/member/actions.ts` — new: `startWorkAction` (pending→in_progress), `resumeWorkAction` (feedback→in_progress), `submitForReviewAction` (in_progress→manager_review). Each calls `requireStageOwnership` then Phase-2 `transitionStage`. Never mutates revision_count.
- `app/manager/actions.ts` — `assignToStageAction` extended: writes both `assignee` (name) AND `assignee_user_id` (uuid) atomically via `transitionStage.extra`. Uses `createAdminClient().auth.admin.listUsers` to resolve email → auth.users.id.
- `app/member/layout.tsx` — new header “PMT | My Work” with initials avatar and Log out. Redirects non-Member roles.
- `app/member/page.tsx` — new server component: authenticated name/subtitle, 4 KPI cards (clients / campaigns / tasks / pending approvals), 3 sections.
- `components/member/{MemberSections, MyTasksTable, UnderReviewTable, CompletedTable, FeedbackModal}.tsx` — new client components. FeedbackModal reads `deliverable_stages.note`; shows "No specific feedback left yet." when empty. Dismissible.

### 2026-08-13 — Preview environment
- `.env.local` created (Supabase URL/anon/service-role/site-url).
- Supervisor program `nextjs` added (`/etc/supervisor/conf.d/nextjs.conf`, mirrored to `/app/.emergent/nextjs.conf` for persistence). Runs `npx next start -H 0.0.0.0 -p 3000`.
- `next.config.ts` — `experimental.serverActions.allowedOrigins` includes both preview hostnames.
- `app/login/page.tsx` — try/catch/finally around handleSubmit so submitting state always resets.

## KPI formulas (Phase 5 §1)
- **Clients worked with** = |distinct project.client_name across all owned stages|.
- **Campaigns** = |distinct project_id owned|; active = project has any non-complete owned stage; completed = all owned stages of that project are complete.
- **Overall tasks** = count of owned stages; active = status ≠ complete; completed = status = complete.
- **Pending approvals** = count of owned stages currently in status `manager_review`.

## What's been verified
- `npx tsc --noEmit`: PASS
- ESLint on all Phase-5 files: PASS
- `npx next build`: PASS (23 routes, 0 errors)
- Testing-agent E2E (iteration_6.json): **10/10 scenarios PASS**, 0 defects.
- Post-run DB state: 35 stages, 0 with non-null `assignee_user_id`, no PMT-TEST leftovers.

## Backlog (out of Phase 5 scope)
- P1: Real Client authentication + Client portal (remove Phase-4 simulation once ready).
- P1: RLS policies on `deliverable_stages`, `projects`, `deliverables`, `managers`.
- P1: Email onboarding (Resend/Brevo); currently `email.ts` scaffold exists but unused.
- P2: Cache `auth_user_id` per Member on the `managers` row to avoid `listUsers` pagination on each assign click.
- P2: Add data-testids to Manager `Assign…` select and Approve / Send-back buttons for future automation reliability.
- P2: Replace `window.alert()` failures in `MyStageCard`/`ApprovalRow` with inline error UX (Phase-5 Member components already use inline errors).
- P2: Skills section, activity feed, leave/WFH, analytics, notifications (explicitly out of Phase 5).
- P3: Move preview supervisor config into a first-class Emergent `.emergent/` bootstrap so it survives cold pod restarts automatically.

## Notes
- Node 20 vs Supabase's Node-22 preference: EBADENGINE warnings only. Build + runtime green.
- Temporary Phase-4 Client simulation is intentionally retained; do NOT delete without wiring the real Client portal first.
- Existing production stages remain unassigned as originally directed.
