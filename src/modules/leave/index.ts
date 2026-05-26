// Public API of the leave module

export { LeaveScreen } from './components/LeaveScreen';
export { LeaveRequestsTable } from './components/LeaveRequestsTable';
export { LeaveApprovalsTable } from './components/LeaveApprovalsTable';
export { LeaveBalanceCards } from './components/LeaveBalanceCards';
export { LeaveTeamCalendar } from './components/LeaveTeamCalendar';
export { LeaveStatusBadge } from './components/LeaveStatusBadge';
export { NewLeaveRequestDialog } from './components/NewLeaveRequestDialog';

export {
  useLeaveTypes,
  useLeaveBalance,
  useLeaveRequests,
  useTeamLeaveRequests,
  useTeamLeaveCalendar,
  useTeamCoverage,
} from './hooks/useLeave';
export {
  useCreateLeaveRequest,
  useApproveLeaveRequest,
  useRejectLeaveRequest,
  useWithdrawLeaveRequest,
  useBulkApproveLeave,
  useBulkRejectLeave,
} from './hooks/useLeaveMutations';

export { leaveApi } from './services/leave.api';

export type {
  LeaveType,
  LeaveBalance,
  LeaveRequest,
  LeaveRequestsPage,
  LeaveStatus,
  CreateLeaveInput,
  LeaveListParams,
  TeamCalendarLeaveRange,
  TeamCalendarEmployee,
  TeamCalendarData,
  BulkLeaveFailure,
  BulkLeaveResponse,
  TeamCoverageData,
} from './types/leave.types';
