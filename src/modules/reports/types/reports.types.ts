export interface ReportMeta {
  reportName: string;
  generatedAt: string;
  filters: Record<string, unknown>;
}

export interface ReportPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ReportTableData<TItem> {
  items: TItem[];
  pagination: ReportPagination;
}

export interface ReportData<TSummary, TChartItem, TTableItem> {
  meta: ReportMeta;
  summary: TSummary;
  chartData: TChartItem[];
  tableData: ReportTableData<TTableItem>;
}

// ── Workforce: Headcount ─────────────────────────────────────────────────────

export interface HeadcountSummary {
  currentHeadcount: number;
  changeFromStart: number;
  changePercent: number;
  netHires: number;
  netExits: number;
}

export interface HeadcountChartItem {
  month: string;
  monthLabel: string;
  headcount: number;
  hires: number;
  exits: number;
}

export interface HeadcountTableItem {
  departmentName: string;
  startHeadcount: number;
  endHeadcount: number;
  hires: number;
  exits: number;
  changePercent: number;
}

export type HeadcountReport = ReportData<HeadcountSummary, HeadcountChartItem, HeadcountTableItem>;

// ── Workforce: Turnover ──────────────────────────────────────────────────────

export interface TurnoverSummary {
  totalExits: number;
  voluntaryExits: number;
  involuntaryExits: number;
  averageHeadcount: number;
  attritionRate: number;
}

export interface TurnoverChartItem {
  month: string;
  monthLabel: string;
  exits: number;
  attritionRate: number;
}

export interface TurnoverTableItem {
  employeeId: string;
  employeeCode: string;
  employeeName: string;
  departmentName: string;
  designation: string;
  exitDate: string;
  exitType: 'VOLUNTARY' | 'INVOLUNTARY';
  tenure: string;
}

export type TurnoverReport = ReportData<TurnoverSummary, TurnoverChartItem, TurnoverTableItem>;

// ── Workforce: Demographics ──────────────────────────────────────────────────

export interface DemographicsBreakdownItem {
  type?: string;
  gender?: string;
  departmentName?: string;
  count: number;
  percent: number;
}

export interface DemographicsData {
  meta: ReportMeta;
  byEmploymentType: Array<{ type: string; count: number; percent: number }>;
  byDepartment: Array<{ departmentName: string; count: number; percent: number }>;
  byGender: Array<{ gender: string; count: number; percent: number }>;
}

// ── Attendance: Monthly Summary ──────────────────────────────────────────────

export interface AttendanceSummary {
  month: string;
  totalWorkingDays: number;
  avgAttendancePercent: number;
  totalPresent: number;
  totalAbsent: number;
  totalLeave: number;
}

export interface AttendanceSummaryItem {
  employeeId: string;
  employeeCode: string;
  employeeName: string;
  departmentName: string;
  presentDays: number;
  absentDays: number;
  leaveDays: number;
  wfhDays: number;
  halfDays: number;
  lateDays: number;
  attendancePercent: number;
}

export type AttendanceSummaryReport = {
  meta: ReportMeta;
  summary: AttendanceSummary;
  tableData: ReportTableData<AttendanceSummaryItem>;
};

// ── Attendance: Absenteeism ──────────────────────────────────────────────────

export interface AbsenteeismChartItem {
  month: string;
  monthLabel: string;
  absenteeismRate: number;
  absences: number;
  employees: number;
}

export interface AbsenteeismTableItem {
  employeeId: string;
  employeeName: string;
  absentDays: number;
  unauthorizedAbsences: number;
  leaveDays: number;
  absenteeismRate: number;
}

export type AbsenteeismReport = {
  meta: ReportMeta;
  chartData: AbsenteeismChartItem[];
  tableData: ReportTableData<AbsenteeismTableItem>;
};

// ── Leave: Utilization ───────────────────────────────────────────────────────

export interface LeaveUtilizationSummary {
  year: number;
  totalAllocated: number;
  totalTaken: number;
  totalPending: number;
  utilizationRate: number;
  avgDaysPerEmployee: number;
}

export interface LeaveUtilizationChartItem {
  leaveTypeName: string;
  leaveTypeCode: string;
  allocated: number;
  taken: number;
  pending: number;
  utilizationRate: number;
}

export interface LeaveUtilizationTableItem {
  employeeId: string;
  employeeName: string;
  annualAllocated: number;
  annualTaken: number;
  annualPending: number;
  annualBalance: number;
  sickAllocated: number;
  sickTaken: number;
  sickBalance: number;
}

export type LeaveUtilizationReport = ReportData<
  LeaveUtilizationSummary,
  LeaveUtilizationChartItem,
  LeaveUtilizationTableItem
>;

// ── Leave: Pending Requests ──────────────────────────────────────────────────

export interface LeavePendingItem {
  id: string;
  referenceNo: string;
  employeeName: string;
  leaveTypeName: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string;
  appliedAt: string;
  daysPending: number;
}

export type LeavePendingReport = {
  meta: ReportMeta;
  tableData: ReportTableData<LeavePendingItem>;
};

// ── Payroll: Summary ─────────────────────────────────────────────────────────

export interface PayrollSummaryMeta {
  totalPayrollCost: number;
  avgMonthlyPayroll: number;
  totalEmployees: number;
  currency: string;
  monthsIncluded: number;
}

export interface PayrollSummaryChartItem {
  month: string;
  monthLabel: string;
  totalGross: number;
  totalDeductions: number;
  totalNet: number;
  employeeCount: number;
}

export interface PayrollSummaryTableItem {
  departmentName: string;
  employeeCount: number;
  totalGross: number;
  totalDeductions: number;
  totalNet: number;
  avgNetPerEmployee: number;
}

export type PayrollSummaryReport = ReportData<
  PayrollSummaryMeta,
  PayrollSummaryChartItem,
  PayrollSummaryTableItem
>;

// ── Payroll: CTC Analysis ────────────────────────────────────────────────────

export interface CtcBand {
  label: string;
  count: number;
  percent: number;
}

export interface CtcPercentiles {
  p25: number;
  p50: number;
  p75: number;
  p90: number;
}

export interface CtcAnalysisData {
  meta: ReportMeta;
  bands: CtcBand[];
  percentiles: CtcPercentiles;
}

// ── Export ───────────────────────────────────────────────────────────────────

export type ReportType =
  | 'workforce/headcount'
  | 'workforce/turnover'
  | 'workforce/demographics'
  | 'attendance/summary'
  | 'attendance/absenteeism'
  | 'leave/utilization'
  | 'leave/pending'
  | 'payroll/summary'
  | 'payroll/ctc-analysis'
  | 'payroll/salary-register'
  | 'payroll/statutory-register'
  | 'payroll/bank-advice'
  | 'payroll/variance-register';

export interface ReportExportRequest {
  reportType: ReportType;
  format: 'CSV';
  filters?: Record<string, unknown>;
}

// ── Common query params ──────────────────────────────────────────────────────

export interface ReportCommonParams {
  startDate?: string;
  endDate?: string;
  departmentId?: string;
  employmentType?: string;
}

export interface AttendanceSummaryParams {
  month?: string;
  departmentId?: string;
  page?: number;
  limit?: number;
}

export interface LeaveUtilizationParams {
  year?: number;
  departmentId?: string;
  leaveTypeId?: string;
}

export interface LeavePendingParams {
  departmentId?: string;
  leaveTypeId?: string;
  page?: number;
  limit?: number;
}

export interface CtcAnalysisParams {
  departmentId?: string;
  asOf?: string;
}
