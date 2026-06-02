import type { AttendanceStatus, WorkMode } from '../types/attendance.types';

export const STATUS_CONFIG: Record<
  AttendanceStatus,
  { label: string; textClass: string; bgClass: string }
> = {
  PRESENT: {
    label: 'Present',
    textClass: 'text-success',
    bgClass: 'bg-success/10',
  },
  ABSENT: {
    label: 'Absent',
    textClass: 'text-danger',
    bgClass: 'bg-danger/10',
  },
  LATE: {
    label: 'Late',
    textClass: 'text-warning',
    bgClass: 'bg-warning/10',
  },
  WFH: {
    label: 'WFH',
    textClass: 'text-info',
    bgClass: 'bg-info/10',
  },
  HALF_DAY: {
    label: 'Half Day',
    textClass: 'text-warning',
    bgClass: 'bg-warning/10',
  },
  LEAVE: {
    label: 'Leave',
    textClass: 'text-warning',
    bgClass: 'bg-warning/10',
  },
  HOLIDAY: {
    label: 'Holiday',
    textClass: 'text-dept-product',
    bgClass: 'bg-dept-product/12',
  },
};

export const WORK_MODE_LABELS: Record<WorkMode, string> = {
  OFFICE: 'Office',
  WFH: 'Work from Home',
  HYBRID: 'Hybrid',
};
