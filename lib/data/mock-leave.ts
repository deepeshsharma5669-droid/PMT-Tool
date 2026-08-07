export type LeaveRequest = {
  id: string
  employeeName: string
  role: string
  department: string
  project: string
  submissionDate: string
  daysApplied: number
  startDate: string
  endDate: string
  reason: string
  status: 'Pending' | 'Approved' | 'Rejected'
}

export const leaveRequests: LeaveRequest[] = [
  { id: 'lv1', employeeName: 'Meera Nair', role: 'Designer', department: 'Creative', project: 'Q3 Investor Reels', submissionDate: '2026-08-01', daysApplied: 1, startDate: '2026-08-08', endDate: '2026-08-08', reason: 'Personal work', status: 'Pending' },
  { id: 'lv2', employeeName: 'Bhavya Darji', role: 'Designer', department: 'Creative', project: 'IPru Distributor Engagement Campaign', submissionDate: '2026-08-02', daysApplied: 3, startDate: '2026-08-11', endDate: '2026-08-13', reason: 'Family function', status: 'Pending' },
  { id: 'lv3', employeeName: 'Aniket Bangal', role: 'Designer', department: 'Creative', project: 'Bajaj Mapping Updation', submissionDate: '2026-08-03', daysApplied: 2, startDate: '2026-08-15', endDate: '2026-08-16', reason: 'Medical', status: 'Pending' },
  { id: 'lv4', employeeName: 'Shreshth Sawant', role: 'Manager', department: 'Client Servicing', project: 'FT Sapphire Equity Long Short SIF', submissionDate: '2026-07-28', daysApplied: 5, startDate: '2026-08-20', endDate: '2026-08-24', reason: 'Vacation', status: 'Approved' },
  { id: 'lv5', employeeName: 'Simran Baraskar', role: 'Copywriter', department: 'Content', project: 'AMFI_SEBI Check Tool AV', submissionDate: '2026-07-30', daysApplied: 1, startDate: '2026-08-05', endDate: '2026-08-05', reason: 'Personal work', status: 'Rejected' },
]