// Illustrative mock data for the Manager UI — matches the original HTML mockup.
// This is intentionally independent of lib/data/mock-projects.ts (Admin's data).
// Nothing here is derived from or coupled to the colleague's real dataset —
// we're still in UI-only mode, no backend connected yet.
//
// Stage lifecycle (per the real company workflow):
//   blocked        -> waiting on the previous stage to clear
//   ready          -> can start, nobody's picked it up yet
//   in_progress    -> assignee actively working (e.g. Script Research / Scripting)
//   manager_review -> submitted, awaiting the stage's own Manager approval
//   client_review  -> Manager approved, Manager sent it directly to the client
//   feedback       -> client requested changes; `iteration` counts which revision round this is
//   complete       -> client approved; this stage is done, next stage unlocks

export type StageStatus =
  | 'blocked'
  | 'ready'
  | 'in_progress'
  | 'manager_review'
  | 'client_review'
  | 'feedback'
  | 'complete'

export type TaskStatus = 'blocked' | 'ready' | 'in_progress' | 'complete'

export type Task = {
  id: string
  name: string
  order: number
  status: TaskStatus
  assignee: string | null
}

export type Stage = {
  id: string
  name: string
  order: number
  status: StageStatus
  isMine: boolean
  waitingOn?: string
  iteration?: number // only meaningful when status === 'feedback'
  tasks?: Task[] // sub-tasks within this stage, e.g. Content = Script Research -> Scripting
}

export type Deliverable = {
  id: string
  name: string
  type: string
  stages: Stage[]
}

export type Campaign = {
  id: string
  name: string
  client: string
  timeScale: 'Delayed' | 'On-Time'
  etaLabel: string
  deadline: string
  brief: string
  warnings: number
  deliverables: Deliverable[]
}

export const CURRENT_MANAGER = 'Kaushal Shah'
export const MANAGER_TITLE = 'Content Manager'

export const campaigns: Campaign[] = [
  {
    id: 'neo-ver-2',
    name: 'Neo ver 2',
    client: 'Kotak Mutual Fund',
    timeScale: 'Delayed',
    etaLabel: 'ETA in 1d 1h',
    deadline: '15 Aug 2026',
    brief: 'Kotak — need website, need posters. Early brief, placeholder name.',
    warnings: 1,
    deliverables: [
      {
        id: 'launch-key-visual', name: 'Launch Key Visual', type: 'AV',
        stages: [
          { id: 's1', name: 'Content', order: 1, status: 'ready', isMine: true, tasks: [
            { id: 't1', name: 'Script Research', order: 1, status: 'ready', assignee: null },
            { id: 't2', name: 'Scripting', order: 2, status: 'blocked', assignee: null },
          ] },
          { id: 's2', name: 'Design', order: 2, status: 'blocked', isMine: false, waitingOn: 'Waiting on Content' },
          { id: 's3', name: 'Animation', order: 3, status: 'blocked', isMine: false, waitingOn: 'Waiting on Design' },
          { id: 's4', name: 'Review', order: 4, status: 'blocked', isMine: false, waitingOn: 'Waiting on Animation' },
        ],
      },
      {
        id: 'social-teaser-set', name: 'Social Teaser Set', type: 'Infographic',
        stages: [
          { id: 's1', name: 'Content', order: 1, status: 'in_progress', isMine: true, tasks: [
            { id: 't1', name: 'Script Research', order: 1, status: 'complete', assignee: 'Rohan Mehta' },
            { id: 't2', name: 'Scripting', order: 2, status: 'in_progress', assignee: 'Rohan Mehta' },
          ] },
          { id: 's2', name: 'Design', order: 2, status: 'blocked', isMine: false, waitingOn: 'Waiting on Content' },
          { id: 's3', name: 'Review', order: 3, status: 'blocked', isMine: false, waitingOn: 'Waiting on Design' },
        ],
      },
    ],
  },
  {
    id: 'q3-investor-reels',
    name: 'Q3 Investor Reels',
    client: 'Kotak Mutual Fund',
    timeScale: 'On-Time',
    etaLabel: 'ETA in 2d 4h',
    deadline: '20 Aug 2026',
    brief: 'Quarterly investor education reels for Q3 push.',
    warnings: 0,
    deliverables: [
      {
        id: 'reel-1', name: 'Investor Reel #1', type: 'Reel',
        stages: [
          { id: 's1', name: 'Content', order: 1, status: 'complete', isMine: true, tasks: [
            { id: 't1', name: 'Script Research', order: 1, status: 'complete', assignee: 'Karan Shah' },
            { id: 't2', name: 'Scripting', order: 2, status: 'complete', assignee: 'Karan Shah' },
          ] },
          { id: 's2', name: 'Design', order: 2, status: 'ready', isMine: false },
          { id: 's3', name: 'Animation', order: 3, status: 'blocked', isMine: false, waitingOn: 'Waiting on Design' },
          { id: 's4', name: 'Review', order: 4, status: 'blocked', isMine: false, waitingOn: 'Waiting on Animation' },
        ],
      },
    ],
  },
  {
    id: 'know-your-index',
    name: 'Know Your Index — Nifty Next 50',
    client: 'ICICI Prudential Mutual Fund',
    timeScale: 'Delayed',
    etaLabel: 'ETA in 2d',
    deadline: '10 Aug 2026',
    brief: 'Investor education campaign explaining index fund mechanics.',
    warnings: 0,
    deliverables: [
      {
        id: 'infographic-1', name: 'Index Infographic', type: 'Infographic',
        stages: [
          { id: 's1', name: 'Content', order: 1, status: 'manager_review', isMine: true, tasks: [
            { id: 't1', name: 'Script Research', order: 1, status: 'complete', assignee: 'Priya Desai' },
            { id: 't2', name: 'Scripting', order: 2, status: 'complete', assignee: 'Rohan Mehta' },
          ] },
          { id: 's2', name: 'Design', order: 2, status: 'blocked', isMine: false, waitingOn: 'Waiting on Content' },
          { id: 's3', name: 'Review', order: 3, status: 'blocked', isMine: false, waitingOn: 'Waiting on Design' },
        ],
      },
      {
        id: 'fund-guide-1', name: 'Fund Guide Update', type: 'Fund Guide',
        stages: [
          { id: 's1', name: 'Data Update', order: 1, status: 'complete', isMine: true, tasks: [
            { id: 't1', name: 'Data Collection', order: 1, status: 'complete', assignee: 'Ananya Verma' },
            { id: 't2', name: 'Data Verification', order: 2, status: 'complete', assignee: 'Ananya Verma' },
          ] },
          { id: 's2', name: 'Design', order: 2, status: 'complete', isMine: false },
          { id: 's3', name: 'Design Review', order: 3, status: 'client_review', isMine: false },
          { id: 's4', name: 'Final Print Review', order: 4, status: 'blocked', isMine: false, waitingOn: 'Waiting on Design Review' },
        ],
      },
    ],
  },
  {
    id: 'gift-city-av',
    name: 'Gift City AV',
    client: 'Franklin Templeton',
    timeScale: 'Delayed',
    etaLabel: 'ETA in 3d 17h',
    deadline: '12 Aug 2026',
    brief: 'Gift City offerings explainer video for institutional investors.',
    warnings: 1,
    deliverables: [
      {
        id: 'gift-city-video', name: 'Gift City Explainer', type: 'AV',
        stages: [
          { id: 's1', name: 'Content', order: 1, status: 'feedback', isMine: true, iteration: 3, tasks: [
            { id: 't1', name: 'Script Research', order: 1, status: 'complete', assignee: 'Karan Shah' },
            { id: 't2', name: 'Scripting', order: 2, status: 'complete', assignee: 'Karan Shah' },
          ] },
          { id: 's2', name: 'Design', order: 2, status: 'blocked', isMine: false, waitingOn: 'Waiting on Content' },
          { id: 's3', name: 'Animation', order: 3, status: 'blocked', isMine: false, waitingOn: 'Waiting on Design' },
          { id: 's4', name: 'Review', order: 4, status: 'blocked', isMine: false, waitingOn: 'Waiting on Animation' },
        ],
      },
    ],
  },
]

export const teamMembers = [
  { name: 'Karan Shah', role: 'Creative Lead', openTasks: 4, loadPercent: 80, mode: 'In-office' as const },
  { name: 'Rohan Mehta', role: 'Copywriter', openTasks: 2, loadPercent: 40, mode: 'In-office' as const },
  { name: 'Ananya Verma', role: 'Content Associate', openTasks: 2, loadPercent: 45, mode: 'Remote' as const },
  { name: 'Priya Desai', role: 'Freelance Content Writer', openTasks: 1, loadPercent: 20, mode: 'Outsourced' as const },
]

export const leaveItems = [
  { person: 'Ananya Verma', onLeave: 'Fri, 1 Aug', impactedTask: 'Content annotation — Social Teaser Set', etaShift: 'ETA pushes from Fri 4pm → Mon 11am (+2 business days)' },
  { person: 'Karan Shah', onLeave: 'Mon, 4 Aug', impactedTask: 'Content annotation — Neo ver 2', etaShift: 'ETA pushes from Mon 2pm → Tue 10am' },
]

export const activityLog = [
  { person: 'Priya Desai', mode: 'Outsourced', logged: '5h 00m', active: '2h 45m', idle: '2h 15m', flag: 'High idle' as const },
  { person: 'Ananya Verma', mode: 'Remote', logged: '7h 50m', active: '7h 05m', idle: '45m', flag: 'Normal' as const },
]

export const dueTodayTasks = [
  { task: 'Script — first draft', deliverable: 'Know Your Index', client: 'ICICI Prudential MF', assignee: 'Rohan Mehta', status: 'Under Scripting', timeScale: 'Delayed' as const, due: 'Today, 5:00 PM' },
  { task: 'Copywriting', deliverable: 'Social Teaser Set', client: 'Kotak Mutual Fund', assignee: 'Rohan Mehta', status: 'Ready', timeScale: 'On-Time' as const, due: 'Today, 6:00 PM' },
  { task: 'Content annotation', deliverable: 'Gift City AV', client: 'Franklin Templeton', assignee: 'Karan Shah', status: 'Blocked', timeScale: 'Delayed' as const, due: 'Today, 3:00 PM' },
]

export const escalations = [
  { deliverable: 'Launch Key Visual', client: 'Nimbus Foods', issue: 'Content stage unassigned, blocking Design handoff', daysOverdue: 2 },
  { deliverable: 'Gift City AV', client: 'Franklin Templeton', issue: 'Script — 3rd revision, client flagged tone', daysOverdue: 1 },
]

export const recentActivity = [
  { kind: 'done' as const, text: 'Rohan Mehta submitted Script — first draft', meta: 'Know Your Index · ICICI Prudential MF · 42 min ago' },
  { kind: 'approve' as const, text: 'Design team pulled Content annotation into Design', meta: 'SIP Calculator Landing Page · ICICI · 3 hours ago' },
  { kind: 'start' as const, text: 'Rohan Mehta started Copywriting', meta: 'Social Teaser Set · Kotak Mutual Fund · 5 hours ago' },
  { kind: 'done' as const, text: 'Karan Shah completed Content annotation (v3)', meta: 'Gift City AV · Franklin Templeton · yesterday, 6:10 PM' },
]

export const sequences = [
  { id: 'static', name: 'Static Design', isDefault: true, stages: 'Content → Design → Review', types: 'Minimalist, Infographic, Onepager, Carousel, Emailer, Brochure' },
  { id: 'av', name: 'AV / Video Production', isDefault: false, stages: 'Content → Storyboard & Design → Animation → Review', types: 'Main AV, AV, Video, Reel, Short Video, Teaser, GIF' },
  { id: 'data', name: 'Data & Print Documents', isDefault: false, stages: 'Data Update → Design → Design Review → Final Print Review', types: 'Fund Guide, Factsheet, Booklet, PPT' },
]