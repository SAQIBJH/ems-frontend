import type { ReportType } from '../types/reports.types';

export interface ReportNavItem {
  label: string;
  value: ReportType;
}

export interface ReportNavGroup {
  heading: string;
  items: ReportNavItem[];
}

export const REPORT_NAV: ReportNavGroup[] = [
  {
    heading: 'WORKFORCE',
    items: [
      { label: 'Headcount', value: 'workforce/headcount' },
      { label: 'Turnover', value: 'workforce/turnover' },
      { label: 'Demographics', value: 'workforce/demographics' },
    ],
  },
  {
    heading: 'ATTENDANCE',
    items: [
      { label: 'Monthly Summary', value: 'attendance/summary' },
      { label: 'Absenteeism Trend', value: 'attendance/absenteeism' },
    ],
  },
  {
    heading: 'LEAVE',
    items: [
      { label: 'Utilization', value: 'leave/utilization' },
      { label: 'Pending Requests', value: 'leave/pending' },
    ],
  },
  {
    heading: 'PAYROLL',
    items: [
      { label: 'Payroll Summary', value: 'payroll/summary' },
      { label: 'CTC Analysis', value: 'payroll/ctc-analysis' },
      { label: 'Salary Register', value: 'payroll/salary-register' },
      { label: 'Statutory Register', value: 'payroll/statutory-register' },
      { label: 'Bank Advice', value: 'payroll/bank-advice' },
      { label: 'Variance Register', value: 'payroll/variance-register' },
      { label: 'Pay Equity', value: 'payroll/pay-equity' },
    ],
  },
];

export const DEFAULT_REPORT: ReportType = 'workforce/headcount';
