import { apiClient } from '@/lib/api-client';
import type {
  AnalyticsSummary,
  AttendanceAnalytics,
  AttendanceRange,
  DepartmentHeadcount,
  EmployeeDashboardData,
  LeaveSummaryAnalytics,
  ManagerApprovalsResponse,
  ManagerDashboardData,
  RecentActivityItem,
  TeamMember,
  TeamWeeklyAttendance,
  EmployeeTeamResponse,
} from '../types/dashboard.types';

export const dashboardApi = {
  /**
   * GET /analytics/summary
   * Returns { totalEmployees, activeToday, onLeaveToday, openRequests }
   */
  getAnalyticsSummary: async (): Promise<AnalyticsSummary> => {
    const { data } = await apiClient.get<{ data: AnalyticsSummary }>('/analytics/summary');
    return data.data;
  },

  /**
   * GET /analytics/attendance?range=7d|30d|90d
   * Returns { range, series: [...] }
   */
  getAttendanceAnalytics: async (range: AttendanceRange): Promise<AttendanceAnalytics> => {
    const { data } = await apiClient.get<{ data: AttendanceAnalytics }>('/analytics/attendance', {
      params: { range },
    });
    return data.data;
  },

  /**
   * GET /analytics/headcount-by-department
   * Returns data[] — flat array
   */
  getHeadcountByDepartment: async (): Promise<DepartmentHeadcount[]> => {
    const { data } = await apiClient.get<{ data: DepartmentHeadcount[] }>(
      '/analytics/headcount-by-department',
    );
    return data.data;
  },

  /**
   * GET /analytics/leave-summary?range=30d
   * Returns { pending, approved, rejected, withdrawn }
   */
  getLeaveSummary: async (): Promise<LeaveSummaryAnalytics> => {
    const { data } = await apiClient.get<{ data: LeaveSummaryAnalytics }>(
      '/analytics/leave-summary',
      { params: { range: '30d' } },
    );
    return data.data;
  },

  /**
   * GET /analytics/recent-activity?limit=N
   * Returns data[] — flat array
   */
  getRecentActivity: async (limit = 10): Promise<RecentActivityItem[]> => {
    const { data } = await apiClient.get<{ data: RecentActivityItem[] }>(
      '/analytics/recent-activity',
      { params: { limit } },
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
};
