import { http, HttpResponse } from 'msw';
import type {
  HeadcountReport,
  TurnoverReport,
  DemographicsData,
  AttendanceSummaryReport,
  AbsenteeismReport,
  LeaveUtilizationReport,
  LeavePendingReport,
  PayrollSummaryReport,
  CtcAnalysisData,
} from '@/modules/reports/types/reports.types';

const BASE = '/api/reports';

const META = (reportName: string) => ({
  reportName,
  generatedAt: new Date().toISOString(),
  filters: {},
});

const PAGINATION = (total: number) => ({ page: 1, limit: 20, total, totalPages: 1 });

// ── Headcount ────────────────────────────────────────────────────────────────

const headcountData: HeadcountReport = {
  meta: META('Headcount Report'),
  summary: {
    currentHeadcount: 48,
    changeFromStart: 6,
    changePercent: 14.3,
    netHires: 8,
    netExits: 2,
  },
  chartData: [
    { month: '2024-01', monthLabel: 'Jan 2024', headcount: 42, hires: 0, exits: 0 },
    { month: '2024-02', monthLabel: 'Feb 2024', headcount: 44, hires: 3, exits: 1 },
    { month: '2024-03', monthLabel: 'Mar 2024', headcount: 46, hires: 2, exits: 0 },
    { month: '2024-04', monthLabel: 'Apr 2024', headcount: 47, hires: 2, exits: 1 },
    { month: '2024-05', monthLabel: 'May 2024', headcount: 48, hires: 1, exits: 0 },
  ],
  tableData: {
    items: [
      {
        departmentName: 'Engineering',
        startHeadcount: 10,
        endHeadcount: 12,
        hires: 3,
        exits: 1,
        changePercent: 20.0,
      },
      {
        departmentName: 'Product',
        startHeadcount: 6,
        endHeadcount: 7,
        hires: 1,
        exits: 0,
        changePercent: 16.7,
      },
      {
        departmentName: 'Design',
        startHeadcount: 4,
        endHeadcount: 5,
        hires: 2,
        exits: 1,
        changePercent: 25.0,
      },
      {
        departmentName: 'HR',
        startHeadcount: 5,
        endHeadcount: 5,
        hires: 0,
        exits: 0,
        changePercent: 0.0,
      },
      {
        departmentName: 'Finance',
        startHeadcount: 5,
        endHeadcount: 6,
        hires: 1,
        exits: 0,
        changePercent: 20.0,
      },
      {
        departmentName: 'Operations',
        startHeadcount: 4,
        endHeadcount: 4,
        hires: 1,
        exits: 1,
        changePercent: 0.0,
      },
      {
        departmentName: 'Sales',
        startHeadcount: 8,
        endHeadcount: 9,
        hires: 0,
        exits: 0,
        changePercent: 12.5,
      },
    ],
    pagination: PAGINATION(7),
  },
};

// ── Turnover ─────────────────────────────────────────────────────────────────

const turnoverData: TurnoverReport = {
  meta: META('Turnover Report'),
  summary: {
    totalExits: 4,
    voluntaryExits: 3,
    involuntaryExits: 1,
    averageHeadcount: 46,
    attritionRate: 8.7,
  },
  chartData: [
    { month: '2024-01', monthLabel: 'Jan 2024', exits: 0, attritionRate: 0.0 },
    { month: '2024-02', monthLabel: 'Feb 2024', exits: 1, attritionRate: 2.3 },
    { month: '2024-03', monthLabel: 'Mar 2024', exits: 1, attritionRate: 2.2 },
    { month: '2024-04', monthLabel: 'Apr 2024', exits: 2, attritionRate: 4.3 },
    { month: '2024-05', monthLabel: 'May 2024', exits: 0, attritionRate: 0.0 },
  ],
  tableData: {
    items: [
      {
        employeeId: 'emp_01',
        employeeCode: 'E0021',
        employeeName: 'Amit Kumar',
        departmentName: 'Engineering',
        designation: 'Backend Engineer',
        exitDate: '2024-02-15',
        exitType: 'VOLUNTARY',
        tenure: '1 year 3 months',
      },
      {
        employeeId: 'emp_02',
        employeeCode: 'E0034',
        employeeName: 'Sneha Reddy',
        departmentName: 'Design',
        designation: 'UI Designer',
        exitDate: '2024-03-22',
        exitType: 'VOLUNTARY',
        tenure: '8 months',
      },
      {
        employeeId: 'emp_03',
        employeeCode: 'E0047',
        employeeName: 'Rajiv Nair',
        departmentName: 'Operations',
        designation: 'Operations Analyst',
        exitDate: '2024-04-10',
        exitType: 'INVOLUNTARY',
        tenure: '2 years 1 month',
      },
      {
        employeeId: 'emp_04',
        employeeCode: 'E0052',
        employeeName: 'Pooja Gupta',
        departmentName: 'Sales',
        designation: 'Sales Executive',
        exitDate: '2024-04-28',
        exitType: 'VOLUNTARY',
        tenure: '5 months',
      },
    ],
    pagination: PAGINATION(4),
  },
};

// ── Demographics ─────────────────────────────────────────────────────────────

const demographicsData: DemographicsData = {
  meta: META('Demographics Report'),
  byEmploymentType: [
    { type: 'FULL_TIME', count: 38, percent: 79.2 },
    { type: 'CONTRACT', count: 6, percent: 12.5 },
    { type: 'PART_TIME', count: 3, percent: 6.3 },
    { type: 'INTERNSHIP', count: 1, percent: 2.1 },
  ],
  byDepartment: [
    { departmentName: 'Engineering', count: 12, percent: 25.0 },
    { departmentName: 'Sales', count: 9, percent: 18.8 },
    { departmentName: 'Product', count: 7, percent: 14.6 },
    { departmentName: 'HR', count: 5, percent: 10.4 },
    { departmentName: 'Finance', count: 6, percent: 12.5 },
    { departmentName: 'Design', count: 5, percent: 10.4 },
    { departmentName: 'Operations', count: 4, percent: 8.3 },
  ],
  byGender: [
    { gender: 'MALE', count: 28, percent: 58.3 },
    { gender: 'FEMALE', count: 19, percent: 39.6 },
    { gender: 'OTHER', count: 1, percent: 2.1 },
  ],
};

// ── Attendance Summary ───────────────────────────────────────────────────────

const attendanceSummaryData: AttendanceSummaryReport = {
  meta: META('Attendance Summary'),
  summary: {
    month: '2024-06',
    totalWorkingDays: 22,
    avgAttendancePercent: 91.8,
    totalPresent: 1014,
    totalAbsent: 90,
    totalLeave: 44,
  },
  tableData: {
    items: [
      {
        employeeId: 'emp_01',
        employeeCode: 'E0042',
        employeeName: 'Priya Sharma',
        departmentName: 'Engineering',
        presentDays: 21,
        absentDays: 1,
        leaveDays: 0,
        wfhDays: 5,
        halfDays: 0,
        lateDays: 2,
        attendancePercent: 95.5,
      },
      {
        employeeId: 'emp_02',
        employeeCode: 'E0018',
        employeeName: 'Aman Singh',
        departmentName: 'Product',
        presentDays: 20,
        absentDays: 0,
        leaveDays: 2,
        wfhDays: 8,
        halfDays: 1,
        lateDays: 0,
        attendancePercent: 90.9,
      },
      {
        employeeId: 'emp_03',
        employeeCode: 'E0033',
        employeeName: 'Deepa Rao',
        departmentName: 'HR',
        presentDays: 22,
        absentDays: 0,
        leaveDays: 0,
        wfhDays: 3,
        halfDays: 0,
        lateDays: 1,
        attendancePercent: 100.0,
      },
      {
        employeeId: 'emp_04',
        employeeCode: 'E0055',
        employeeName: 'Ravi Mehta',
        departmentName: 'Finance',
        presentDays: 18,
        absentDays: 3,
        leaveDays: 1,
        wfhDays: 2,
        halfDays: 0,
        lateDays: 5,
        attendancePercent: 81.8,
      },
    ],
    pagination: PAGINATION(48),
  },
};

// ── Absenteeism ──────────────────────────────────────────────────────────────

const absenteeismData: AbsenteeismReport = {
  meta: META('Absenteeism Trend'),
  chartData: [
    { month: '2024-01', monthLabel: 'Jan 2024', absenteeismRate: 3.2, absences: 12, employees: 42 },
    { month: '2024-02', monthLabel: 'Feb 2024', absenteeismRate: 4.1, absences: 18, employees: 44 },
    { month: '2024-03', monthLabel: 'Mar 2024', absenteeismRate: 2.8, absences: 11, employees: 46 },
    { month: '2024-04', monthLabel: 'Apr 2024', absenteeismRate: 3.6, absences: 15, employees: 47 },
    { month: '2024-05', monthLabel: 'May 2024', absenteeismRate: 2.1, absences: 9, employees: 48 },
  ],
  tableData: {
    items: [
      {
        employeeId: 'emp_04',
        employeeName: 'Ravi Mehta',
        absentDays: 5,
        unauthorizedAbsences: 3,
        leaveDays: 2,
        absenteeismRate: 22.7,
      },
      {
        employeeId: 'emp_05',
        employeeName: 'Karan Joshi',
        absentDays: 4,
        unauthorizedAbsences: 4,
        leaveDays: 0,
        absenteeismRate: 18.2,
      },
      {
        employeeId: 'emp_06',
        employeeName: 'Meena Pillai',
        absentDays: 3,
        unauthorizedAbsences: 2,
        leaveDays: 1,
        absenteeismRate: 13.6,
      },
    ],
    pagination: PAGINATION(12),
  },
};

// ── Leave Utilization ────────────────────────────────────────────────────────

const leaveUtilizationData: LeaveUtilizationReport = {
  meta: META('Leave Utilization'),
  summary: {
    year: 2024,
    totalAllocated: 1200,
    totalTaken: 387,
    totalPending: 23,
    utilizationRate: 32.3,
    avgDaysPerEmployee: 8.1,
  },
  chartData: [
    {
      leaveTypeName: 'Annual',
      leaveTypeCode: 'ANNUAL',
      allocated: 504,
      taken: 189,
      pending: 12,
      utilizationRate: 37.5,
    },
    {
      leaveTypeName: 'Sick',
      leaveTypeCode: 'SICK',
      allocated: 288,
      taken: 98,
      pending: 7,
      utilizationRate: 34.0,
    },
    {
      leaveTypeName: 'Casual',
      leaveTypeCode: 'CASUAL',
      allocated: 240,
      taken: 72,
      pending: 4,
      utilizationRate: 30.0,
    },
    {
      leaveTypeName: 'Maternity',
      leaveTypeCode: 'MATERNITY',
      allocated: 168,
      taken: 28,
      pending: 0,
      utilizationRate: 16.7,
    },
  ],
  tableData: {
    items: [
      {
        employeeId: 'emp_01',
        employeeName: 'Priya Sharma',
        annualAllocated: 21,
        annualTaken: 8,
        annualPending: 3,
        annualBalance: 10,
        sickAllocated: 12,
        sickTaken: 2,
        sickBalance: 10,
      },
      {
        employeeId: 'emp_02',
        employeeName: 'Aman Singh',
        annualAllocated: 21,
        annualTaken: 12,
        annualPending: 0,
        annualBalance: 9,
        sickAllocated: 12,
        sickTaken: 5,
        sickBalance: 7,
      },
      {
        employeeId: 'emp_03',
        employeeName: 'Deepa Rao',
        annualAllocated: 21,
        annualTaken: 5,
        annualPending: 2,
        annualBalance: 14,
        sickAllocated: 12,
        sickTaken: 1,
        sickBalance: 11,
      },
    ],
    pagination: PAGINATION(48),
  },
};

// ── Leave Pending ────────────────────────────────────────────────────────────

const leavePendingData: LeavePendingReport = {
  meta: META('Pending Leave Requests'),
  tableData: {
    items: [
      {
        id: 'lr_01',
        referenceNo: 'LR-024',
        employeeName: 'Priya Sharma',
        leaveTypeName: 'Annual',
        startDate: '2024-07-15',
        endDate: '2024-07-17',
        totalDays: 3,
        reason: 'Family trip',
        appliedAt: '2024-07-01T10:00:00.000Z',
        daysPending: 3,
      },
      {
        id: 'lr_02',
        referenceNo: 'LR-025',
        employeeName: 'Karan Joshi',
        leaveTypeName: 'Sick',
        startDate: '2024-07-10',
        endDate: '2024-07-10',
        totalDays: 1,
        reason: 'Not feeling well',
        appliedAt: '2024-07-09T08:00:00.000Z',
        daysPending: 1,
      },
      {
        id: 'lr_03',
        referenceNo: 'LR-026',
        employeeName: 'Meena Pillai',
        leaveTypeName: 'Casual',
        startDate: '2024-07-22',
        endDate: '2024-07-23',
        totalDays: 2,
        reason: 'Personal work',
        appliedAt: '2024-07-12T14:00:00.000Z',
        daysPending: 10,
      },
    ],
    pagination: PAGINATION(23),
  },
};

// ── Payroll Summary ──────────────────────────────────────────────────────────

const payrollSummaryData: PayrollSummaryReport = {
  meta: META('Payroll Summary'),
  summary: {
    totalPayrollCost: 14400000.0,
    avgMonthlyPayroll: 2400000.0,
    totalEmployees: 48,
    currency: 'INR',
    monthsIncluded: 6,
  },
  chartData: [
    {
      month: '2024-01',
      monthLabel: 'Jan 2024',
      totalGross: 2200000.0,
      totalDeductions: 281600.0,
      totalNet: 1918400.0,
      employeeCount: 42,
    },
    {
      month: '2024-02',
      monthLabel: 'Feb 2024',
      totalGross: 2310000.0,
      totalDeductions: 295680.0,
      totalNet: 2014320.0,
      employeeCount: 44,
    },
    {
      month: '2024-03',
      monthLabel: 'Mar 2024',
      totalGross: 2420000.0,
      totalDeductions: 309760.0,
      totalNet: 2110240.0,
      employeeCount: 46,
    },
    {
      month: '2024-04',
      monthLabel: 'Apr 2024',
      totalGross: 2470000.0,
      totalDeductions: 316160.0,
      totalNet: 2153840.0,
      employeeCount: 47,
    },
    {
      month: '2024-05',
      monthLabel: 'May 2024',
      totalGross: 2500000.0,
      totalDeductions: 320000.0,
      totalNet: 2180000.0,
      employeeCount: 48,
    },
  ],
  tableData: {
    items: [
      {
        departmentName: 'Engineering',
        employeeCount: 12,
        totalGross: 720000.0,
        totalDeductions: 92160.0,
        totalNet: 627840.0,
        avgNetPerEmployee: 52320.0,
      },
      {
        departmentName: 'Sales',
        employeeCount: 9,
        totalGross: 405000.0,
        totalDeductions: 51840.0,
        totalNet: 353160.0,
        avgNetPerEmployee: 39240.0,
      },
      {
        departmentName: 'Product',
        employeeCount: 7,
        totalGross: 455000.0,
        totalDeductions: 58240.0,
        totalNet: 396760.0,
        avgNetPerEmployee: 56680.0,
      },
      {
        departmentName: 'HR',
        employeeCount: 5,
        totalGross: 250000.0,
        totalDeductions: 32000.0,
        totalNet: 218000.0,
        avgNetPerEmployee: 43600.0,
      },
      {
        departmentName: 'Finance',
        employeeCount: 6,
        totalGross: 360000.0,
        totalDeductions: 46080.0,
        totalNet: 313920.0,
        avgNetPerEmployee: 52320.0,
      },
    ],
    pagination: PAGINATION(7),
  },
};

// ── CTC Analysis ─────────────────────────────────────────────────────────────

const ctcAnalysisData: CtcAnalysisData = {
  meta: META('CTC Analysis'),
  bands: [
    { label: '< ₹5L', count: 3, percent: 6.3 },
    { label: '₹5L – ₹10L', count: 14, percent: 29.2 },
    { label: '₹10L – ₹20L', count: 22, percent: 45.8 },
    { label: '> ₹20L', count: 9, percent: 18.8 },
  ],
  percentiles: {
    p25: 800000.0,
    p50: 1200000.0,
    p75: 1800000.0,
    p90: 2400000.0,
  },
};

// ── Handlers ─────────────────────────────────────────────────────────────────

export const reportsHandlers = [
  http.get(`${BASE}/workforce/headcount`, () =>
    HttpResponse.json({ success: true, data: headcountData }),
  ),
  http.get(`${BASE}/workforce/turnover`, () =>
    HttpResponse.json({ success: true, data: turnoverData }),
  ),
  http.get(`${BASE}/workforce/demographics`, () =>
    HttpResponse.json({ success: true, data: demographicsData }),
  ),
  http.get(`${BASE}/attendance/summary`, () =>
    HttpResponse.json({ success: true, data: attendanceSummaryData }),
  ),
  http.get(`${BASE}/attendance/absenteeism`, () =>
    HttpResponse.json({ success: true, data: absenteeismData }),
  ),
  http.get(`${BASE}/leave/utilization`, () =>
    HttpResponse.json({ success: true, data: leaveUtilizationData }),
  ),
  http.get(`${BASE}/leave/pending`, () =>
    HttpResponse.json({ success: true, data: leavePendingData }),
  ),
  http.get(`${BASE}/payroll/summary`, () =>
    HttpResponse.json({ success: true, data: payrollSummaryData }),
  ),
  http.get(`${BASE}/payroll/ctc-analysis`, () =>
    HttpResponse.json({ success: true, data: ctcAnalysisData }),
  ),
  http.post(`${BASE}/export`, async ({ request }) => {
    const body = (await request.json()) as { reportType?: string };
    const slug = (body.reportType ?? 'report').replace('/', '-');
    const csv = `"Report","${slug}"\n"Generated at","${new Date().toISOString()}"\n`;
    return new HttpResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${slug}-report.csv"`,
      },
    });
  }),
];
