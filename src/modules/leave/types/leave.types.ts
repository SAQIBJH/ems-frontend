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
  /** Present on team/requests responses — not in documented shape but returned in practice. */
  employee?: {
    id: string;
    firstName: string;
    lastName: string;
    employeeCode: string;
  };
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

/** POST /leave/requests body. Dates must be YYYY-MM-DD. */
export interface CreateLeaveInput {
  leaveTypeId: string;
  startDate: string;
  endDate: string;
  reason: string;
}
