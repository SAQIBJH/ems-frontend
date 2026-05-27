import { http, HttpResponse } from 'msw';
import type {
  WorkforceTrendPoint,
  AttritionData,
  PayrollCostPoint,
  DepartmentPerformanceRow,
} from '@/modules/analytics/types/analytics.types';

const WORKFORCE_TREND_6M: WorkforceTrendPoint[] = [
  { month: '2025-12', monthLabel: 'Dec 2025', headcount: 42, hires: 2, exits: 1, netChange: 1 },
  { month: '2026-01', monthLabel: 'Jan 2026', headcount: 43, hires: 3, exits: 2, netChange: 1 },
  { month: '2026-02', monthLabel: 'Feb 2026', headcount: 44, hires: 2, exits: 1, netChange: 1 },
  { month: '2026-03', monthLabel: 'Mar 2026', headcount: 46, hires: 3, exits: 1, netChange: 2 },
  { month: '2026-04', monthLabel: 'Apr 2026', headcount: 47, hires: 2, exits: 1, netChange: 1 },
  { month: '2026-05', monthLabel: 'May 2026', headcount: 48, hires: 2, exits: 1, netChange: 1 },
];

const WORKFORCE_TREND_12M: WorkforceTrendPoint[] = [
  { month: '2025-06', monthLabel: 'Jun 2025', headcount: 38, hires: 1, exits: 0, netChange: 1 },
  { month: '2025-07', monthLabel: 'Jul 2025', headcount: 39, hires: 2, exits: 1, netChange: 1 },
  { month: '2025-08', monthLabel: 'Aug 2025', headcount: 40, hires: 2, exits: 1, netChange: 1 },
  { month: '2025-09', monthLabel: 'Sep 2025', headcount: 41, hires: 2, exits: 1, netChange: 1 },
  { month: '2025-10', monthLabel: 'Oct 2025', headcount: 41, hires: 1, exits: 1, netChange: 0 },
  { month: '2025-11', monthLabel: 'Nov 2025', headcount: 42, hires: 2, exits: 1, netChange: 1 },
  ...WORKFORCE_TREND_6M,
];

const WORKFORCE_TREND_2Y: WorkforceTrendPoint[] = [
  { month: '2024-06', monthLabel: 'Jun 2024', headcount: 30, hires: 1, exits: 1, netChange: 0 },
  { month: '2024-07', monthLabel: 'Jul 2024', headcount: 31, hires: 2, exits: 1, netChange: 1 },
  { month: '2024-08', monthLabel: 'Aug 2024', headcount: 32, hires: 2, exits: 1, netChange: 1 },
  { month: '2024-09', monthLabel: 'Sep 2024', headcount: 33, hires: 2, exits: 1, netChange: 1 },
  { month: '2024-10', monthLabel: 'Oct 2024', headcount: 34, hires: 2, exits: 1, netChange: 1 },
  { month: '2024-11', monthLabel: 'Nov 2024', headcount: 35, hires: 2, exits: 1, netChange: 1 },
  { month: '2024-12', monthLabel: 'Dec 2024', headcount: 36, hires: 2, exits: 1, netChange: 1 },
  { month: '2025-01', monthLabel: 'Jan 2025', headcount: 37, hires: 2, exits: 1, netChange: 1 },
  { month: '2025-02', monthLabel: 'Feb 2025', headcount: 37, hires: 1, exits: 1, netChange: 0 },
  { month: '2025-03', monthLabel: 'Mar 2025', headcount: 38, hires: 2, exits: 1, netChange: 1 },
  { month: '2025-04', monthLabel: 'Apr 2025', headcount: 38, hires: 1, exits: 1, netChange: 0 },
  { month: '2025-05', monthLabel: 'May 2025', headcount: 38, hires: 1, exits: 1, netChange: 0 },
  ...WORKFORCE_TREND_12M,
];

const ATTRITION_DATA: Record<string, AttritionData> = {
  '6m': {
    currentMonthRate: 2.1,
    rollingAnnualRate: 8.3,
    trend: [
      { month: '2025-12', monthLabel: 'Dec 2025', rate: 2.4, exits: 1 },
      { month: '2026-01', monthLabel: 'Jan 2026', rate: 4.7, exits: 2 },
      { month: '2026-02', monthLabel: 'Feb 2026', rate: 2.3, exits: 1 },
      { month: '2026-03', monthLabel: 'Mar 2026', rate: 2.2, exits: 1 },
      { month: '2026-04', monthLabel: 'Apr 2026', rate: 2.1, exits: 1 },
      { month: '2026-05', monthLabel: 'May 2026', rate: 2.1, exits: 1 },
    ],
  },
  '12m': {
    currentMonthRate: 2.1,
    rollingAnnualRate: 8.3,
    trend: [
      { month: '2025-06', monthLabel: 'Jun 2025', rate: 0.0, exits: 0 },
      { month: '2025-07', monthLabel: 'Jul 2025', rate: 2.6, exits: 1 },
      { month: '2025-08', monthLabel: 'Aug 2025', rate: 2.5, exits: 1 },
      { month: '2025-09', monthLabel: 'Sep 2025', rate: 2.4, exits: 1 },
      { month: '2025-10', monthLabel: 'Oct 2025', rate: 2.4, exits: 1 },
      { month: '2025-11', monthLabel: 'Nov 2025', rate: 2.4, exits: 1 },
      { month: '2025-12', monthLabel: 'Dec 2025', rate: 2.4, exits: 1 },
      { month: '2026-01', monthLabel: 'Jan 2026', rate: 4.7, exits: 2 },
      { month: '2026-02', monthLabel: 'Feb 2026', rate: 2.3, exits: 1 },
      { month: '2026-03', monthLabel: 'Mar 2026', rate: 2.2, exits: 1 },
      { month: '2026-04', monthLabel: 'Apr 2026', rate: 2.1, exits: 1 },
      { month: '2026-05', monthLabel: 'May 2026', rate: 2.1, exits: 1 },
    ],
  },
  '2y': {
    currentMonthRate: 2.1,
    rollingAnnualRate: 8.3,
    trend: [
      { month: '2024-06', monthLabel: 'Jun 2024', rate: 3.3, exits: 1 },
      { month: '2024-07', monthLabel: 'Jul 2024', rate: 3.2, exits: 1 },
      { month: '2024-08', monthLabel: 'Aug 2024', rate: 3.1, exits: 1 },
      { month: '2024-09', monthLabel: 'Sep 2024', rate: 3.0, exits: 1 },
      { month: '2024-10', monthLabel: 'Oct 2024', rate: 2.9, exits: 1 },
      { month: '2024-11', monthLabel: 'Nov 2024', rate: 2.9, exits: 1 },
      { month: '2024-12', monthLabel: 'Dec 2024', rate: 2.8, exits: 1 },
      { month: '2025-01', monthLabel: 'Jan 2025', rate: 2.7, exits: 1 },
      { month: '2025-02', monthLabel: 'Feb 2025', rate: 2.7, exits: 1 },
      { month: '2025-03', monthLabel: 'Mar 2025', rate: 2.6, exits: 1 },
      { month: '2025-04', monthLabel: 'Apr 2025', rate: 2.6, exits: 1 },
      { month: '2025-05', monthLabel: 'May 2025', rate: 2.6, exits: 1 },
      { month: '2025-06', monthLabel: 'Jun 2025', rate: 0.0, exits: 0 },
      { month: '2025-07', monthLabel: 'Jul 2025', rate: 2.6, exits: 1 },
      { month: '2025-08', monthLabel: 'Aug 2025', rate: 2.5, exits: 1 },
      { month: '2025-09', monthLabel: 'Sep 2025', rate: 2.4, exits: 1 },
      { month: '2025-10', monthLabel: 'Oct 2025', rate: 2.4, exits: 1 },
      { month: '2025-11', monthLabel: 'Nov 2025', rate: 2.4, exits: 1 },
      { month: '2025-12', monthLabel: 'Dec 2025', rate: 2.4, exits: 1 },
      { month: '2026-01', monthLabel: 'Jan 2026', rate: 4.7, exits: 2 },
      { month: '2026-02', monthLabel: 'Feb 2026', rate: 2.3, exits: 1 },
      { month: '2026-03', monthLabel: 'Mar 2026', rate: 2.2, exits: 1 },
      { month: '2026-04', monthLabel: 'Apr 2026', rate: 2.1, exits: 1 },
      { month: '2026-05', monthLabel: 'May 2026', rate: 2.1, exits: 1 },
    ],
  },
};

const PAYROLL_COST_6M: PayrollCostPoint[] = [
  {
    month: '2025-12',
    monthLabel: 'Dec 2025',
    totalNet: 1918400,
    totalGross: 2200000,
    employeeCount: 42,
    avgNetPerEmployee: 45676,
  },
  {
    month: '2026-01',
    monthLabel: 'Jan 2026',
    totalNet: 1965000,
    totalGross: 2250000,
    employeeCount: 43,
    avgNetPerEmployee: 45698,
  },
  {
    month: '2026-02',
    monthLabel: 'Feb 2026',
    totalNet: 2012000,
    totalGross: 2305000,
    employeeCount: 44,
    avgNetPerEmployee: 45727,
  },
  {
    month: '2026-03',
    monthLabel: 'Mar 2026',
    totalNet: 2105000,
    totalGross: 2410000,
    employeeCount: 46,
    avgNetPerEmployee: 45761,
  },
  {
    month: '2026-04',
    monthLabel: 'Apr 2026',
    totalNet: 2152000,
    totalGross: 2465000,
    employeeCount: 47,
    avgNetPerEmployee: 45787,
  },
  {
    month: '2026-05',
    monthLabel: 'May 2026',
    totalNet: 2198400,
    totalGross: 2520000,
    employeeCount: 48,
    avgNetPerEmployee: 45800,
  },
];

const PAYROLL_COST_12M: PayrollCostPoint[] = [
  {
    month: '2025-06',
    monthLabel: 'Jun 2025',
    totalNet: 1730000,
    totalGross: 1980000,
    employeeCount: 38,
    avgNetPerEmployee: 45526,
  },
  {
    month: '2025-07',
    monthLabel: 'Jul 2025',
    totalNet: 1775000,
    totalGross: 2030000,
    employeeCount: 39,
    avgNetPerEmployee: 45513,
  },
  {
    month: '2025-08',
    monthLabel: 'Aug 2025',
    totalNet: 1820000,
    totalGross: 2085000,
    employeeCount: 40,
    avgNetPerEmployee: 45500,
  },
  {
    month: '2025-09',
    monthLabel: 'Sep 2025',
    totalNet: 1866000,
    totalGross: 2137000,
    employeeCount: 41,
    avgNetPerEmployee: 45512,
  },
  {
    month: '2025-10',
    monthLabel: 'Oct 2025',
    totalNet: 1866000,
    totalGross: 2137000,
    employeeCount: 41,
    avgNetPerEmployee: 45512,
  },
  {
    month: '2025-11',
    monthLabel: 'Nov 2025',
    totalNet: 1918400,
    totalGross: 2200000,
    employeeCount: 42,
    avgNetPerEmployee: 45676,
  },
  ...PAYROLL_COST_6M,
];

const DEPT_PERFORMANCE_30D: DepartmentPerformanceRow[] = [
  {
    departmentId: 'dept_01',
    departmentName: 'Engineering',
    headcount: 12,
    attendanceRate: 93.2,
    leaveRate: 4.5,
    pendingApprovals: 2,
    avgTenureMonths: 18.4,
  },
  {
    departmentId: 'dept_02',
    departmentName: 'Product',
    headcount: 6,
    attendanceRate: 96.1,
    leaveRate: 3.2,
    pendingApprovals: 0,
    avgTenureMonths: 14.2,
  },
  {
    departmentId: 'dept_03',
    departmentName: 'Design',
    headcount: 4,
    attendanceRate: 88.5,
    leaveRate: 6.8,
    pendingApprovals: 1,
    avgTenureMonths: 10.8,
  },
  {
    departmentId: 'dept_04',
    departmentName: 'Marketing',
    headcount: 5,
    attendanceRate: 94.0,
    leaveRate: 3.8,
    pendingApprovals: 0,
    avgTenureMonths: 12.3,
  },
  {
    departmentId: 'dept_05',
    departmentName: 'Operations',
    headcount: 7,
    attendanceRate: 91.3,
    leaveRate: 5.1,
    pendingApprovals: 3,
    avgTenureMonths: 22.6,
  },
  {
    departmentId: 'dept_06',
    departmentName: 'HR',
    headcount: 3,
    attendanceRate: 97.8,
    leaveRate: 2.1,
    pendingApprovals: 0,
    avgTenureMonths: 25.0,
  },
];

const DEPT_PERFORMANCE_90D: DepartmentPerformanceRow[] = DEPT_PERFORMANCE_30D.map((d) => ({
  ...d,
  attendanceRate: +(d.attendanceRate - 0.5).toFixed(1),
}));

function getWorkforceTrend(range: string): WorkforceTrendPoint[] {
  if (range === '12m') return WORKFORCE_TREND_12M;
  if (range === '2y') return WORKFORCE_TREND_2Y;
  return WORKFORCE_TREND_6M;
}

function getPayrollCost(range: string): PayrollCostPoint[] {
  if (range === '12m') return PAYROLL_COST_12M;
  return PAYROLL_COST_6M;
}

function getDeptPerf(range: string): DepartmentPerformanceRow[] {
  if (range === '90d') return DEPT_PERFORMANCE_90D;
  return DEPT_PERFORMANCE_30D;
}

export const analyticsHandlers = [
  http.get('/api/analytics/workforce-trend', ({ request }) => {
    const range = new URL(request.url).searchParams.get('range') ?? '6m';
    return HttpResponse.json({ success: true, data: getWorkforceTrend(range) });
  }),

  http.get('/api/analytics/attrition', ({ request }) => {
    const range = new URL(request.url).searchParams.get('range') ?? '6m';
    const data = ATTRITION_DATA[range] ?? ATTRITION_DATA['6m'];
    return HttpResponse.json({ success: true, data });
  }),

  http.get('/api/analytics/payroll-cost', ({ request }) => {
    const range = new URL(request.url).searchParams.get('range') ?? '6m';
    return HttpResponse.json({ success: true, data: getPayrollCost(range) });
  }),

  http.get('/api/analytics/department-performance', ({ request }) => {
    const range = new URL(request.url).searchParams.get('range') ?? '30d';
    return HttpResponse.json({ success: true, data: getDeptPerf(range) });
  }),
];
