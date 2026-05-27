// Types
export type {
  ReportMeta,
  ReportPagination,
  ReportTableData,
  ReportData,
  HeadcountSummary,
  HeadcountChartItem,
  HeadcountTableItem,
  HeadcountReport,
  TurnoverSummary,
  TurnoverChartItem,
  TurnoverTableItem,
  TurnoverReport,
  DemographicsBreakdownItem,
  DemographicsData,
  AttendanceSummary,
  AttendanceSummaryItem,
  AttendanceSummaryReport,
  AbsenteeismChartItem,
  AbsenteeismTableItem,
  AbsenteeismReport,
  LeaveUtilizationSummary,
  LeaveUtilizationChartItem,
  LeaveUtilizationTableItem,
  LeaveUtilizationReport,
  LeavePendingItem,
  LeavePendingReport,
  PayrollSummaryMeta,
  PayrollSummaryChartItem,
  PayrollSummaryTableItem,
  PayrollSummaryReport,
  CtcBand,
  CtcPercentiles,
  CtcAnalysisData,
  ReportType,
  ReportExportRequest,
  ReportCommonParams,
  AttendanceSummaryParams,
  LeaveUtilizationParams,
  LeavePendingParams,
  CtcAnalysisParams,
} from './types/reports.types';

// Services
export { reportsApi } from './services/reports.api';

// Hooks
export {
  useHeadcountReport,
  useTurnoverReport,
  useDemographicsReport,
  useExportReport,
} from './hooks/useWorkforceReports';
export { useAttendanceSummaryReport, useAbsenteeismReport } from './hooks/useAttendanceReports';
export { useLeaveUtilizationReport, useLeavePendingReport } from './hooks/useLeaveReports';
export { usePayrollSummaryReport, useCtcAnalysisReport } from './hooks/usePayrollReports';

// Constants
export { REPORT_NAV, DEFAULT_REPORT } from './constants';
export type { ReportNavItem, ReportNavGroup } from './constants';

// Components
export { ReportsPage } from './components/ReportsPage';
export { ReportsNav } from './components/ReportsNav';
export { ReportShell } from './components/ReportShell';
