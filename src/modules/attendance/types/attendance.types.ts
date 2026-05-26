export type AttendanceStatus =
  | 'PRESENT'
  | 'ABSENT'
  | 'LATE'
  | 'WFH'
  | 'HALF_DAY'
  | 'LEAVE'
  | 'HOLIDAY';

export type WorkMode = 'OFFICE' | 'WFH' | 'HYBRID';
export type RegularizationStatus = 'PENDING' | 'APPROVED' | 'DENIED';

/** Shape of each record from GET /attendance/records */
export interface AttendanceRecord {
  id: string;
  referenceNo?: string;
  attendanceDate: string;
  checkInAt: string | null;
  checkOutAt: string | null;
  status: AttendanceStatus;
  workMode: WorkMode | null;
  totalMinutes: number | null;
  notes: string | null;
}

export interface AttendancePagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

/** GET /attendance/records → data: { records: [...], pagination: {} } */
export interface AttendanceRecordsPage {
  records: AttendanceRecord[];
  pagination: AttendancePagination;
}

/** GET /attendance/summary → data: { period, totalDays, present, ... } */
export interface AttendanceSummary {
  period: { startDate: string; endDate: string };
  totalDays: number;
  present: number;
  absent: number;
  leave: number;
  wfh: number;
  halfDay: number;
  holiday: number;
  late: number;
  attendancePercentage: number;
}

export interface AttendanceRecordsParams {
  page?: number;
  limit?: number;
  /** YYYY-MM */
  month?: string;
  fromDate?: string;
  toDate?: string;
  employeeId?: string;
  departmentId?: string;
}

/** POST /attendance/check-in body */
export interface CheckInInput {
  workMode: WorkMode;
  notes?: string;
}

/** POST /attendance/check-out body */
export interface CheckOutInput {
  notes?: string;
}

/** POST /attendance/regularization body */
export interface RegularizationInput {
  /** YYYY-MM-DD */
  attendanceDate: string;
  reason: string;
}

export interface RegularizationRecord {
  id: string;
  attendanceDate: string;
  status: RegularizationStatus;
  reason: string;
  createdAt: string;
}
