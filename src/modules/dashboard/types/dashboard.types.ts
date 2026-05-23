/** GET /analytics/summary */
export interface AnalyticsSummary {
  totalEmployees: number;
  activeToday: number;
  onLeaveToday: number;
  openRequests: number;
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

/** One entry in GET /analytics/recent-activity */
export interface RecentActivityItem {
  id: string;
  action: string;
  entity_type: string | undefined;
  entity_id: string;
  user_email: string;
  created_at: string;
}

/** GET /manager/dashboard */
export interface ManagerDashboardData {
  managerName: string;
  teamSize: number;
  pendingApprovals: number;
  todayAttendance: Record<string, unknown>;
}

/** One entry in GET /manager/team or GET /employee/team */
export interface TeamMember {
  id: string;
  firstName: string;
  lastName: string;
  designation: string;
  workEmail: string;
  employmentStatus: string;
  department?: { id: string; name: string } | null;
}

/** GET /employee/dashboard */
export interface EmployeeDashboardData {
  employeeName: string;
  designation: string;
  department: string;
  todayAttendance: Record<string, unknown>;
  pendingLeaves: number;
}

export type AttendanceRange = '7d' | '30d' | '90d';
