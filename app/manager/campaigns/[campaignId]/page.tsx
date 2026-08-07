'use client'
import Link from 'next/link'
import { Fragment } from 'react'
import { useParams, notFound } from 'next/navigation'
import { useManagerStore } from '@/lib/data/manager-store'
import { Stage, StageStatus, Task } from '@/lib/data/manager-mock-data'

const STATUS_META: Record<StageStatus, { label: string; bg: string; fg: string }> = {
  blocked: { label: 'Blocked', bg: 'var(--surface-2)', fg: 'var(--muted)' },
  ready: { label: 'Ready', bg: 'var(--success-soft)', fg: 'var(--success)' },
  in_progress: { label: 'In Progress', bg: 'var(--primary-soft)', fg: 'var(--primary)' },
  manager_review: { label: 'Manager Review', bg: 'var(--violet-soft)', fg: 'var(--violet)' },
  client_review: { label: 'Client Review', bg: 'var(--amber-soft)', fg: 'var(--amber)' },
  feedback: { label: 'Feedback', bg: 'var(--danger-soft)', fg: 'var(--danger)' },
  complete: { label: 'Complete', bg: 'var(--success-soft)', fg: 'var(--success)' },
}

const TASK_STATUS_META: Record<string, { label: string; bg: string; fg: string }> = {
  blocked: { label: 'Blocked', bg: 'var(--surface-2)', fg: 'var(--muted)' },
  ready: { label: 'Ready', bg: 'var(--success-soft)', fg: 'var(--success)' },
  in_progress: { label: 'In Progress', bg: 'var(--primary-soft)', fg: 'var(--primary)' },
  complete: { label: 'Done', bg: 'var(--success-soft)', fg: 'var(--success)' },
}

const TEAM_NAMES = ['Karan Shah', 'Rohan Mehta', 'Ananya Verma', 'Priya Desai']

function statusLabel(stage: Stage) {
  if (stage.status === 'feedback') return `Feedback · Iteration ${stage.iteration ?? 1}`
  return STATUS_META[stage.status].label
}

function TaskRow({ task, onAssign, onComplete }: { task: Task; onAssign: (name: string) => void; onComplete: () => void }) {
  const m = TASK_STATUS_META[task.status]
  return (
    <div style={{ padding: '4px 0', fontSize: 10.5, borderBottom: '1px dashed var(--border)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ color: 'var(--ink-soft)', fontWeight: 600 }}>{task.name}</div>
        <span style={{ fontSize: 9.5, fontWeight: 700, padding: '2px 7px', borderRadius: 20, background: m.bg, color: m.fg }}>{m.label}</span>
      </div>
      {task.status === 'blocked' && <div style={{ color: 'var(--muted)', marginTop: 2 }}>Waiting on previous task</div>}
      {(task.status === 'ready') && (
        <select
          onChange={(e) => e.target.value && onAssign(e.target.value)}
          defaultValue=""
          style={{ width: '100%', marginTop: 3, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 5, padding: '3px 5px', fontSize: 10 }}
        >
          <option value="">Assign…</option>
          {TEAM_NAMES.map((n) => <option key={n} value={n}>{n}</option>)}
        </select>
      )}
      {task.status === 'in_progress' && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 3 }}>
          <span style={{ color: 'var(--muted)' }}>{task.assignee}</span>
          <button onClick={onComplete} className="btn btn-ghost" style={{ padding: '2px 8px', fontSize: 9.5 }}>Mark done</button>
        </div>
      )}
      {task.status === 'complete' && <div style={{ color: 'var(--muted)', marginTop: 2 }}>{task.assignee}</div>}
    </div>
  )
}

export default function ManagerCampaignDetail() {
  const params = useParams<{ campaignId: string }>()
  const campaigns = useManagerStore((s) => s.campaigns)
  const assignMember = useManagerStore((s) => s.assignMember)
  const completeTask = useManagerStore((s) => s.completeTask)
  const approveStage = useManagerStore((s) => s.approveStage)

  const campaign = campaigns.find((c) => c.id === params.campaignId)
  if (!campaign) return notFound()

  return (
    <div>
      <div className="hint" style={{ marginBottom: 10 }}>
        <Link href="/manager/campaigns" style={{ color: 'var(--ink-soft)' }}>Campaigns</Link> · {campaign.client} · {campaign.name}
      </div>

      <div className="page-head">
        <div>
          <h1>{campaign.name} <span className="status-pill progress">In progress</span></h1>
          <p className="sub" style={{ maxWidth: 480 }}>{campaign.brief}</p>
        </div>
        <div className="stat-card" style={{ minWidth: 210 }}>
          <div className="l">ETA</div>
          <div className="v">{campaign.etaLabel}</div>
          <div className="hint" style={{ marginTop: 8 }}>Deadline: <b style={{ color: 'var(--ink-soft)' }}>{campaign.deadline}</b></div>
          {campaign.warnings > 0 && <div className="hint" style={{ color: 'var(--danger)', marginTop: 4 }}>⚠ {campaign.warnings} warning{campaign.warnings > 1 ? 's' : ''}</div>}
        </div>
      </div>

      <p className="hint" style={{ marginBottom: 16 }}>
        All stages are shown for context — this is how every manager sees the full picture, including feedback
        rounds happening on stages they don&apos;t own. You can only assign and manage <b style={{ color: 'var(--ink-soft)' }}>Content</b>;
        other stages are read-only, and each stays Blocked until the one before it clears client approval.
      </p>

      {campaign.deliverables.map((d) => (
        <div key={d.id} style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 9 }}>
            {d.name} <span className="hint">— {d.type}</span>
          </div>
          <div className="stage-chain">
            {d.stages.map((s) => {
              const meta = STATUS_META[s.status]
              if (!s.isMine) {
                return (
                  <div key={s.id} className="stage-card" style={{ background: 'var(--surface-2)', opacity: 0.75 }}>
                    <span className="stage-num">{s.order}</span>
                    <span className="stage-status" style={{ background: meta.bg, color: meta.fg }}>{statusLabel(s)}</span>
                    <div className="nm">{s.name} <span style={{ fontSize: 10, opacity: 0.6 }}>🔒</span></div>
                    {s.waitingOn && <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 7, fontStyle: 'italic' }}>{s.waitingOn}</div>}
                  </div>
                )
              }
              return (
                <div key={s.id} className="stage-card" style={{ borderColor: 'var(--primary)', boxShadow: '0 0 0 1px var(--primary)' }}>
                  <span className="stage-num">{s.order}</span>
                  <span className="stage-status" style={{ background: meta.bg, color: meta.fg }}>{statusLabel(s)}</span>
                  <div className="nm">{s.name}</div>
                  {s.tasks && (s.status === 'ready' || s.status === 'in_progress' || s.status === 'feedback') && (
                    <div style={{ borderTop: '1px solid var(--border)', marginTop: 6, paddingTop: 4 }}>
                      {s.tasks.map((t) => (
                        <TaskRow
                          key={t.id}
                          task={t}
                          onAssign={(name) => assignMember(campaign.id, d.id, s.id, t.id, name)}
                          onComplete={() => completeTask(campaign.id, d.id, s.id, t.id)}
                        />
                      ))}
                    </div>
                  )}
                  {s.status === 'manager_review' && (
                    <button onClick={() => approveStage(campaign.id, d.id, s.id)} className="btn btn-primary" style={{ width: '100%', marginTop: 6, fontSize: 10.5, padding: '5px 7px' }}>
                      Review &amp; approve
                    </button>
                  )}
                  {s.status === 'client_review' && (
                    <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 7, fontStyle: 'italic' }}>Sent to client, awaiting response</div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      ))}

      <div className="card">
        <div className="panel-head"><h2>Schedule</h2><span className="hint">Stage timeline across every deliverable</span></div>
        <div className="panel-body" style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11.5 }}>
            <tbody>
              {campaign.deliverables.map((d) => (
                <Fragment key={d.id}>
                  <tr style={{ background: 'var(--surface-2)' }}>
                    <td colSpan={2} style={{ fontWeight: 700, color: 'var(--ink)', padding: '7px 10px' }}>{d.name}</td>
                  </tr>
                  {d.stages.map((s) => {
                    const m = STATUS_META[s.status]
                    return (
                      <tr key={s.id}>
                        <td style={{ color: 'var(--ink-soft)', fontWeight: 600, padding: '7px 10px', whiteSpace: 'nowrap', width: 170 }}>{s.order}. {s.name}</td>
                        <td style={{ padding: '7px 10px', borderBottom: '1px solid var(--surface-2)' }}>
                          <div style={{
                            height: 16, borderRadius: 4, width: s.status === 'blocked' ? '18%' : '35%',
                            background: s.status === 'blocked' ? 'var(--surface-2)' : m.fg,
                            border: s.status === 'blocked' ? '1px dashed var(--border)' : undefined,
                          }} />
                        </td>
                      </tr>
                    )
                  })}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}