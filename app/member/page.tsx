import { requireMember, getMyTasks, getMyUnderReview, getMyCompletedProjects, getMyStats } from '@/lib/member-data'
import { MemberSections } from '@/components/member/MemberSections'

export const dynamic = 'force-dynamic'

export default async function MemberHome() {
  const user = await requireMember()

  const [myTasks, underReview, completed, stats] = await Promise.all([
    getMyTasks(),
    getMyUnderReview(),
    getMyCompletedProjects(),
    getMyStats(),
  ])

  const subtitle = [user.role, user.department].filter(Boolean).join(' · ')

  return (
    <>
      <div className="page-head">
        <div>
          <h1 data-testid="member-name">{user.name}</h1>
          <p className="sub" data-testid="member-subtitle">{subtitle}</p>
        </div>
      </div>

      <div className="stat-grid" data-testid="member-kpis">
        <div className="stat-card" data-testid="kpi-clients">
          <div className="l">Clients worked with</div>
          <div className="v">{stats.clientsWorkedWith}</div>
        </div>
        <div className="stat-card" data-testid="kpi-campaigns">
          <div className="l">Campaigns</div>
          <div className="v">{stats.campaigns.total}</div>
          <div className="hint" style={{ marginTop: 4 }}>
            {stats.campaigns.active} active · {stats.campaigns.completed} completed
          </div>
        </div>
        <div className="stat-card" data-testid="kpi-tasks">
          <div className="l">Overall tasks</div>
          <div className="v">{stats.overallTasks.total}</div>
          <div className="hint" style={{ marginTop: 4 }}>
            {stats.overallTasks.active} active · {stats.overallTasks.completed} completed
          </div>
        </div>
        <div className="stat-card" data-testid="kpi-pending">
          <div className="l">Pending approvals</div>
          <div className="v">{stats.pendingApprovals}</div>
        </div>
      </div>

      <MemberSections
        myTasks={myTasks}
        underReview={underReview}
        completed={completed}
      />
    </>
  )
}
