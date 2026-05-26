export type LeaveStatus = 'PENDING' | 'APPROVED' | 'DENIED' | 'REJECTED' | 'WITHDRAWN';

/** GET /leave/types → data[] */
export interface LeaveType {
  id: string;
  name: string;
  code: string;
  annualAllowance: number;
  carryForwardAllowed: boolean;
  isPaid: boolean;
}

/** One entry from GET /leave/balance → data.balances[] */
export interface LeaveBalance {
  id: string;
  leaveTypeId: string;
  leaveTypeName: string;
  leaveTypeCode: string;
  total: number;
  used: number;
  pending: number;
  available: number;
}

/** GET /leave/requests and GET /leave/team/requests share this shape. */
export interface LeaveRequest {
  id: string;
  referenceNo?: string;
  leaveTypeId: string;
  leaveTypeName: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  status: LeaveStatus;
  reason: string;
  submittedAt: string;
  decidedAt: string | null;
  approverComment: string | null;
  employeeCode: string | null;
  employeeName: string | null;
  employee?: {
    id: string;
    firstName: string;
    lastName: string;
    employeeCode: string;
  };
}

/** One failed item from bulk approve/reject — POST /leave/requests/bulk/approve|reject */
export interface BulkLeaveFailure {
  id: string;
  code: string;
  message: string;
}

/** POST /leave/requests/bulk/approve|reject → data */
export interface BulkLeaveResponse {
  succeeded: string[];
  failed: BulkLeaveFailure[];
}

/** GET /leave/team/coverage?date=YYYY-MM-DD → data */
export interface TeamCoverageData {
  date: string;
  totalTeam: number;
  onLeave: number;
  available: number;
  coveragePercent: number;
  thresholdPercent: number;
  isBelowThreshold: boolean;
}

export interface LeaveRequestsPagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

/** GET /leave/requests → data: { requests: [...], pagination: {} } */
export interface LeaveRequestsPage {
  requests: LeaveRequest[];
  pagination: LeaveRequestsPagination;
}

export interface LeaveListParams {
  page?: number;
  limit?: number;
  status?: LeaveStatus;
  leaveTypeId?: string;
  fromDate?: string;
  toDate?: string;
}

/** One leave range entry in the team calendar — GET /leave/team/calendar */
export interface TeamCalendarLeaveRange {
  id: string;
  /** Full ISO datetime string, e.g. "2026-05-27T18:30:00.000Z" */
  startDate: string;
  endDate: string;
  totalDays: number;
  status: LeaveStatus;
  leaveType: string;
  leaveTypeCode: string;
}

export interface TeamCalendarEmployee {
  id: string;
  name: string;
  employeeCode: string;
  leaves: TeamCalendarLeaveRange[];
}

/** GET /leave/team/calendar?month=YYYY-MM → data */
export interface TeamCalendarData {
  month: string;
  employees: TeamCalendarEmployee[];
}

/** POST /leave/requests body. Dates must be YYYY-MM-DD. */
export interface CreateLeaveInput {
  leaveTypeId: string;
  startDate: string;
  endDate: string;
  reason: string;
}
