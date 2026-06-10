/** GET /analytics/summary */
export interface AnalyticsSummary {
  totalEmployees: number;
  activeToday: number;
  onLeaveToday: number;
  openRequests: number;
  /** Optional deltas block — live as of 2026-05-25 */
  deltas?: {
    totalEmployees?: { delta?: number; deltaLabel?: string };
    activeToday?: { deltaPercent?: number };
    onLeaveToday?: { delta?: number };
    openRequests?: { urgent?: number };
  };
}

/** One point in GET /analytics/attendance series */
export interface AttendanceSeriesPoint {
  date: string;
  present: number;
  absent: number;
  leave: number;
  wfh: number;
  halfDay: number;
}

/** GET /analytics/attendance?range=7d|30d|90d */
export interface AttendanceAnalytics {
  range: string;
  series: AttendanceSeriesPoint[];
}

/** One entry in GET /analytics/headcount-by-department */
export interface DepartmentHeadcount {
  departmentId: string;
  departmentName: string;
  employeeCount: number;
  activeCount: number;
}

/** GET /analytics/leave-summary */
export interface LeaveSummaryAnalytics {
  pending: number;
  approved: number;
  rejected: number;
  withdrawn: number;
}

/** One entry in GET /analytics/recent-activity (live camelCase shape + optional entity fields) */
export interface RecentActivityItem {
  id: string;
  actorName: string;
  actorEmail: string | null;
  action: string;
  actionLabel: string;
  description: string;
  entityType: string;
  entityId: string;
  createdAt: string;
  timestamp: string;
  displayTime: string;
  /** Extended fields — live as of 2026-05-25 */
  entity_label?: string;
  entity_url?: string | null;
}

/** One leave request item in GET /manager/approvals */
export interface ManagerLeaveApproval {
  id: string;
  employeeCode: string;
  employeeName: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string;
  status: string;
}

/** One regularization item in GET /manager/approvals */
export interface ManagerRegularizationApproval {
  id: string;
  employeeCode: string;
  employeeName: string;
  attendanceDate: string;
  reason: string;
  status: string;
}

/** GET /manager/approvals */
export interface ManagerApprovalsResponse {
  leaveRequests: ManagerLeaveApproval[];
  regularizationRequests: ManagerRegularizationApproval[];
}

/** GET /manager/dashboard (extended live shape 2026-05-25) */
export interface ManagerDashboardData {
  managerName: string;
  teamSize: number;
  pendingApprovals: number;
  approvalBreakdown?: { leave: number; regularization: number };
  presentToday?: number;
  avgAttendancePercent?: number;
  todayAttendance: Record<string, unknown>;
}

/** One member row in GET /attendance/team/weekly */
export interface TeamWeeklyMember {
  employeeId: string;
  name: string;
  designation: string;
  days: { date: string; code: string }[];
}

/** GET /attendance/team/weekly */
export interface TeamWeeklyAttendance {
  weekStart: string;
  members: TeamWeeklyMember[];
}

/** One entry in GET /manager/team */
export interface TeamMember {
  id: string;
  firstName: string;
  lastName: string;
  designation: string;
  workEmail: string;
  employmentStatus: string;
  department?: { id: string; name: string } | null;
}

/** Person shape returned by GET /employee/team */
export interface TeamPerson {
  name: string;
  designation: string;
  email?: string;
}

/** GET /employee/team — live response shape */
export interface EmployeeTeamResponse {
  manager: TeamPerson | null;
  peers: TeamPerson[];
}

/** One item in leaveBalanceSummary from GET /employee/dashboard */
export interface EmployeeLeaveBalance {
  code: string;
  name: string;
  available: number;
}

/** GET /employee/documents → data.documents[] */
export interface EmployeeDocument {
  id: string;
  filename: string;
  category: string;
  sizeBytes: number;
  status: 'VERIFIED' | 'PENDING' | 'REJECTED';
  uploadedAt: string;
}

/** GET /employee/dashboard */
export interface EmployeeDashboardData {
  employeeName: string;
  designation: string;
  department: string;
  todayAttendance: {
    checkedInAt: string | null;
    checkedOutAt: string | null;
    workMode: string | null;
    status: string | null;
  } | null;
  pendingLeaves: number;
  leaveBalanceSummary: EmployeeLeaveBalance[];
}

export type AttendanceRange = '7d' | '30d' | '90d';

/**
 * Optional org-analytics filters threaded through the analytics endpoints.
 * All fields optional — omitting them yields the unfiltered org-wide result
 * (so the Dashboard widgets, which pass nothing, are unaffected).
 *
 * - `departmentId` scopes a metric to a single department.
 * - A date window is either a preset (`range`) OR a custom span (`from`+`to`);
 *   when `from`+`to` are both present they take precedence over `range`.
 *
 * NOTE (backend): as of 2026-06-10 the live endpoints **accept and ignore**
 * these params (verified — still 200). Filtering is implemented FE-first and
 * documented in docs/BACKEND_API_REQUESTS.md; once the backend honours them the
 * data filters with no FE change.
 */
export interface AnalyticsFilters {
  departmentId?: string;
  range?: string;
  from?: string;
  to?: string;
}
