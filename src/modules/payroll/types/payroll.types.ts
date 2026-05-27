export type ComponentType = 'EARNING' | 'DEDUCTION' | 'BENEFIT' | 'REIMBURSEMENT';
export type CalculationType = 'FLAT' | 'PERCENTAGE' | 'FORMULA';
export type PaySchedule = 'MONTHLY' | 'BIWEEKLY' | 'WEEKLY';
export type PayrollRunStatus =
  | 'DRAFT'
  | 'CALCULATING'
  | 'REVIEW'
  | 'APPROVED'
  | 'PAID'
  | 'CANCELLED';
export type PayslipStatus = 'PENDING' | 'PAID' | 'HELD';

/* ── Salary Components ─────────────────────────────────────────────────────── */

export interface SalaryComponent {
  id: string;
  name: string;
  code: string;
  type: ComponentType;
  calculationType: CalculationType;
  value: number | null;
  basisCode: string | null;
  formula: string | null;
  taxable: boolean;
  active: boolean;
  displayOrder: number;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SalaryComponentInput {
  name: string;
  code: string;
  type: ComponentType;
  calculationType: CalculationType;
  value: number | null;
  basisCode: string | null;
  formula: string | null;
  taxable: boolean;
  active: boolean;
  displayOrder: number;
  description?: string | null;
}

/* ── Pay Groups ───────────────────────────────────────────────────────────── */

export interface PayGroupComponent {
  componentId: string;
  componentCode: string;
  componentName: string;
  componentType: ComponentType;
  overrideCalculationType: CalculationType | null;
  overrideValue: number | null;
  overrideFormula: string | null;
}

export interface PayGroup {
  id: string;
  name: string;
  code: string;
  currency: string;
  paySchedule: PaySchedule;
  description: string | null;
  active: boolean;
  employeeCount: number;
  components: PayGroupComponent[];
  createdAt: string;
  updatedAt: string;
}

export interface PayGroupComponentInput {
  componentId: string;
  overrideCalculationType: CalculationType | null;
  overrideValue: number | null;
  overrideFormula: string | null;
}

export interface PayGroupInput {
  name: string;
  code: string;
  currency: string;
  paySchedule: PaySchedule;
  description?: string | null;
  active: boolean;
  components: PayGroupComponentInput[];
}

/* ── Pay Schedules ─────────────────────────────────────────────────────────── */

export interface PayScheduleRecord {
  id: string;
  name: string;
  frequency: PaySchedule;
  startDate: string;
  timezone: string;
  nextRunDate: string;
  active: boolean;
}

/* ── Employee Salary Config ────────────────────────────────────────────────── */

export interface CalculatedComponent {
  code: string;
  name: string;
  type: ComponentType;
  monthlyAmount: number;
  taxable: boolean;
}

export interface SalaryHistory {
  id: string;
  annualCtc: number;
  effectiveFrom: string;
  effectiveTo: string | null;
  payGroupCode: string;
}

export interface EmployeeSalaryPayGroup {
  id: string;
  name: string;
  code: string;
  currency: string;
  paySchedule: PaySchedule;
}

export interface EmployeeSalary {
  id: string;
  employeeId: string;
  payGroupId: string;
  payGroup: EmployeeSalaryPayGroup;
  annualCtc: number;
  effectiveFrom: string;
  effectiveTo: string | null;
  bankAccountName: string;
  bankAccountNumber: string;
  bankIfscCode: string;
  bankName: string;
  calculatedComponents: CalculatedComponent[];
  monthlyGross: number;
  monthlyDeductions: number;
  monthlyNet: number;
  history: SalaryHistory[];
  createdAt: string;
  updatedAt: string;
}

export interface EmployeeSalaryInput {
  payGroupId: string;
  annualCtc: number;
  effectiveFrom: string;
  bankAccountName: string;
  bankAccountNumber: string;
  bankIfscCode: string;
  bankName: string;
}

/* ── Payslips ─────────────────────────────────────────────────────────────── */

export interface PayslipLine {
  code: string;
  name: string;
  amount: number;
  taxable?: boolean;
}

export interface PayslipOneTime {
  description: string;
  amount: number;
}

export interface PayslipEmployee {
  id: string;
  firstName: string;
  lastName: string;
  employeeCode: string;
  designation: string;
  departmentName: string;
  panNumber?: string;
}

export interface PayslipCompany {
  name: string;
  address: string;
  logoUrl: string | null;
}

export interface Payslip {
  id: string;
  period: string;
  periodLabel: string;
  currency: string;
  employee: PayslipEmployee;
  company: PayslipCompany;
  earnings: PayslipLine[];
  deductions: PayslipLine[];
  oneTimeAdditions: PayslipOneTime[];
  oneTimeDeductions: PayslipOneTime[];
  grossEarnings: number;
  totalDeductions: number;
  netPay: number;
  workingDays: number;
  presentDays: number;
  leaveDays: number;
  lopDays: number;
  status: PayslipStatus;
  paymentDate: string | null;
  paymentReference: string | null;
  payrollRunId: string;
  generatedAt: string;
}

export interface PayslipSummary {
  id: string;
  period: string;
  periodLabel: string;
  currency: string;
  grossEarnings: number;
  totalDeductions: number;
  netPay: number;
  status: PayslipStatus;
  paymentDate: string | null;
  payrollRunId: string;
}

export interface PayslipRunItem {
  id: string;
  employeeId: string;
  employeeCode: string;
  employeeName: string;
  departmentName: string;
  designation: string;
  currency: string;
  grossEarnings: number;
  totalDeductions: number;
  netPay: number;
  workingDays: number;
  presentDays: number;
  lopDays: number;
  status: PayslipStatus;
  hasAdjustments: boolean;
}

/* ── Payroll Runs ─────────────────────────────────────────────────────────── */

export interface PayrollRunWarning {
  employeeId: string;
  employeeName: string;
  message: string;
}

export interface PayrollRunDeptSummary {
  departmentName: string;
  employeeCount: number;
  totalNet: number;
}

export interface PayrollRunSummary {
  byDepartment: PayrollRunDeptSummary[];
  warnings: PayrollRunWarning[];
}

export interface PayrollRun {
  id: string;
  period: string;
  periodLabel: string;
  status: PayrollRunStatus;
  employeeCount: number;
  totalGross: number;
  totalDeductions: number;
  totalNet: number;
  currency: string;
  initiatedBy?: string;
  approvedBy?: string | null;
  processedAt?: string | null;
  approvedAt?: string | null;
  paidAt?: string | null;
  summary?: PayrollRunSummary;
  createdAt: string;
}

export interface PayrollRunInput {
  period: string;
  payGroupIds?: string[];
  includeAllActiveEmployees: boolean;
}

export interface PayrollRunsPage {
  items: PayrollRun[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface PayrollRunsParams {
  page?: number;
  limit?: number;
  year?: number;
  status?: PayrollRunStatus;
}

export interface PayslipsPage {
  items: PayslipSummary[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface PayslipRunPage {
  items: PayslipRunItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
