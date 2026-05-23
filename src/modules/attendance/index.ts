// Public API of the attendance module

export { AttendanceCalendar } from './components/AttendanceCalendar';
export { AttendanceSummaryCards } from './components/AttendanceSummaryCards';
export { CheckInOutCard } from './components/CheckInOutCard';
export { RegularizationDialog } from './components/RegularizationDialog';

export {
  useAttendanceRecords,
  useAttendanceSummary,
  useRegularizations,
} from './hooks/useAttendance';
export {
  useCheckIn,
  useCheckOut,
  useRequestRegularization,
  useApproveRegularization,
  useDenyRegularization,
} from './hooks/useAttendanceMutations';

export { attendanceApi } from './services/attendance.api';

export type {
  AttendanceRecord,
  AttendanceSummary,
  AttendanceRecordsPage,
  AttendanceStatus,
  WorkMode,
  RegularizationRecord,
  RegularizationStatus,
} from './types/attendance.types';
