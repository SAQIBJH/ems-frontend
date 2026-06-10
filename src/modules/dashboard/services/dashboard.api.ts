import { apiClient } from '@/lib/api-client';
import type {
  AnalyticsFilters,
  AnalyticsSummary,
  AttendanceAnalytics,
  AttendanceRange,
  DepartmentHeadcount,
  EmployeeDashboardData,
  EmployeeDocument,
  LeaveSummaryAnalytics,
  ManagerApprovalsResponse,
  ManagerDashboardData,
  RecentActivityItem,
  TeamMember,
  TeamWeeklyAttendance,
  EmployeeTeamResponse,
} from '../types/dashboard.types';

/**
 * Build a clean date-window param object from analytics filters:
 * a custom `from`+`to` span wins over the preset `range`.
 */
function dateWindowParams(filters?: AnalyticsFilters): Record<string, string> {
  if (filters?.from && filters?.to) return { from: filters.from, to: filters.to };
  if (filters?.range) return { range: filters.range };
  return {};
}

function withDepartment(
  params: Record<string, string | number>,
  filters?: AnalyticsFilters,
): Record<string, string | number> {
  return filters?.departmentId ? { ...params, departmentId: filters.departmentId } : params;
}

export const dashboardApi = {
  /**
   * GET /analytics/summary[?departmentId&range|from&to]
   * Returns { totalEmployees, activeToday, onLeaveToday, openRequests }
   */
  getAnalyticsSummary: async (filters?: AnalyticsFilters): Promise<AnalyticsSummary> => {
    const { data } = await apiClient.get<{ data: AnalyticsSummary }>('/analytics/summary', {
      params: withDepartment(dateWindowParams(filters), filters),
    });
    return data.data;
  },

  /**
   * GET /analytics/attendance?range=7d|30d|90d (or from&to)[&departmentId]
   * Returns { range, series: [...] }. A custom `from`+`to` window overrides the preset.
   */
  getAttendanceAnalytics: async (
    range: AttendanceRange,
    filters?: AnalyticsFilters,
  ): Promise<AttendanceAnalytics> => {
    const dateWindow: Record<string, string> =
      filters?.from && filters?.to ? { from: filters.from, to: filters.to } : { range };
    const { data } = await apiClient.get<{ data: AttendanceAnalytics }>('/analytics/attendance', {
      params: withDepartment(dateWindow, filters),
    });
    return data.data;
  },

  /**
   * GET /analytics/headcount-by-department[?departmentId]
   * Returns data[] — flat array
   */
  getHeadcountByDepartment: async (filters?: AnalyticsFilters): Promise<DepartmentHeadcount[]> => {
    const { data } = await apiClient.get<{ data: DepartmentHeadcount[] }>(
      '/analytics/headcount-by-department',
      { params: withDepartment({}, filters) },
    );
    return data.data;
  },

  /**
   * GET /analytics/leave-summary?range=30d (or from&to)[&departmentId]
   * Returns { pending, approved, rejected, withdrawn }
   */
  getLeaveSummary: async (filters?: AnalyticsFilters): Promise<LeaveSummaryAnalytics> => {
    const dateWindow: Record<string, string> =
      filters?.from && filters?.to
        ? { from: filters.from, to: filters.to }
        : { range: filters?.range ?? '30d' };
    const { data } = await apiClient.get<{ data: LeaveSummaryAnalytics }>(
      '/analytics/leave-summary',
      { params: withDepartment(dateWindow, filters) },
    );
    return data.data;
  },

  /**
   * GET /analytics/recent-activity?limit=N[&departmentId]
   * Returns data[] — flat array
   */
  getRecentActivity: async (
    limit = 10,
    filters?: AnalyticsFilters,
  ): Promise<RecentActivityItem[]> => {
    const { data } = await apiClient.get<{ data: RecentActivityItem[] }>(
      '/analytics/recent-activity',
      { params: withDepartment({ limit }, filters) },
    );
    return data.data;
  },

  /**
   * GET /manager/dashboard
   * Returns { managerName, teamSize, pendingApprovals, todayAttendance }
   */
  getManagerDashboard: async (): Promise<ManagerDashboardData> => {
    const { data } = await apiClient.get<{ data: ManagerDashboardData }>('/manager/dashboard');
    return data.data;
  },

  /**
   * GET /manager/approvals
   * Returns { leaveRequests: [...], regularizationRequests: [...] }
   */
  getManagerApprovals: async (): Promise<ManagerApprovalsResponse> => {
    const { data } = await apiClient.get<{ data: ManagerApprovalsResponse }>('/manager/approvals');
    return data.data;
  },

  /**
   * GET /attendance/team/weekly?weekStart=YYYY-MM-DD
   * Weekly attendance grid for the manager's team
   */
  getTeamWeeklyAttendance: async (weekStart?: string): Promise<TeamWeeklyAttendance> => {
    const { data } = await apiClient.get<{ data: TeamWeeklyAttendance }>(
      '/attendance/team/weekly',
      { params: weekStart ? { weekStart } : undefined },
    );
    return data.data;
  },

  /**
   * GET /manager/team
   * Returns team members under the logged-in manager
   */
  getManagerTeam: async (): Promise<TeamMember[]> => {
    const { data } = await apiClient.get<{ data: TeamMember[] }>('/manager/team');
    return data.data;
  },

  /**
   * GET /employee/dashboard
   * Returns { employeeName, designation, department, todayAttendance, pendingLeaves }
   */
  getEmployeeDashboard: async (): Promise<EmployeeDashboardData> => {
    const { data } = await apiClient.get<{ data: EmployeeDashboardData }>('/employee/dashboard');
    return data.data;
  },

  /**
   * GET /employee/team
   * Returns { manager, peers } — live shape from backend.
   */
  getEmployeeTeam: async (): Promise<EmployeeTeamResponse> => {
    const { data } = await apiClient.get<{ data: EmployeeTeamResponse }>('/employee/team');
    return data.data;
  },

  /**
   * GET /employee/documents
   * Returns { documents: [...] } — MSW backed until backend ships.
   */
  getEmployeeDocuments: async (): Promise<EmployeeDocument[]> => {
    const { data } = await apiClient.get<{ data: { documents: EmployeeDocument[] } }>(
      '/employee/documents',
    );
    return data.data.documents;
  },
};
