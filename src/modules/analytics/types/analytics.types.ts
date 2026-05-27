export type WorkforceTrendRange = '6m' | '12m' | '2y';
export type DeptPerfRange = '30d' | '90d';

export interface WorkforceTrendPoint {
  month: string;
  monthLabel: string;
  headcount: number;
  hires: number;
  exits: number;
  netChange: number;
}

export interface AttritionTrendPoint {
  month: string;
  monthLabel: string;
  rate: number;
  exits: number;
}

export interface AttritionData {
  currentMonthRate: number;
  rollingAnnualRate: number;
  trend: AttritionTrendPoint[];
}

export interface PayrollCostPoint {
  month: string;
  monthLabel: string;
  totalNet: number;
  totalGross: number;
  employeeCount: number;
  avgNetPerEmployee: number;
}

export interface DepartmentPerformanceRow {
  departmentId: string;
  departmentName: string;
  headcount: number;
  attendanceRate: number;
  leaveRate: number;
  pendingApprovals: number;
  avgTenureMonths: number;
}
