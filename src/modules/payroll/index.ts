// Types
export type {
  ComponentType,
  CalculationType,
  PaySchedule,
  PayrollRunStatus,
  PayslipStatus,
  SalaryComponent,
  SalaryComponentInput,
  PayGroupComponent,
  PayGroupComponentInput,
  PayGroup,
  PayGroupInput,
  PayScheduleRecord,
  CalculatedComponent,
  SalaryHistory,
  EmployeeSalaryPayGroup,
  EmployeeSalary,
  EmployeeSalaryInput,
  PayslipLine,
  PayslipOneTime,
  PayslipEmployee,
  PayslipCompany,
  PayslipYtd,
  Payslip,
  PayslipSummary,
  ProofStatus,
  TaxDeclaration,
  TaxDeclarationItem,
  TaxDeclarationInput,
  LoanType,
  LoanInterestMethod,
  LoanStatus,
  LoanInstallmentStatus,
  LoanScheduleEntry,
  Loan,
  LoanInput,
  PayslipRunItem,
  PayrollRunWarning,
  PayrollRunDeptSummary,
  PayrollRunSummary,
  PayrollRun,
  PayrollRunInput,
  PayrollInput,
  PayrollInputOneTime,
  PayrollInputsPage,
  PayrollInputImportResult,
  PayrollRunsPage,
  PayrollRunsParams,
  PayslipsPage,
  PayslipRunPage,
} from './types/payroll.types';

// Localization types
export type { BankField, Country, LegalEntity, LegalEntityInput } from './types/localization.types';

// Statutory pack types
export type {
  RoundingMode,
  RoundingPolicy,
  ProrationBasis,
  ProrationPolicy,
  TaxSlab,
  TaxSurcharge,
  TaxRegime,
  ContributionParty,
  ContributionScheme,
  LocalTaxSlab,
  LocalTax,
  StatutoryPack,
  StatutoryPackInput,
  RunConfigSnapshotRef,
} from './types/statutory.types';

// Money utils
export {
  currencyDecimals,
  localeForCurrency,
  toMinor,
  fromMinor,
  formatMajor,
  formatMoney,
} from './utils/money.utils';
export type { FormatMoneyOptions } from './utils/money.utils';

// Services
export { localizationApi } from './services/localization.api';
export { loansApi } from './services/loans.api';
export { payrollComponentsApi } from './services/payroll-components.api';
export { payGroupsApi } from './services/pay-groups.api';
export { employeeSalaryApi } from './services/employee-salary.api';
export { payrollRunsApi } from './services/payroll-runs.api';

// Hooks
export {
  usePayrollComponents,
  useCreateComponent,
  useUpdateComponent,
  useDeleteComponent,
} from './hooks/usePayrollComponents';
export {
  usePayGroups,
  usePaySchedules,
  useCreatePayGroup,
  useUpdatePayGroup,
  useDeletePayGroup,
} from './hooks/usePayGroups';
export {
  usePayrollRuns,
  usePayrollRun,
  useRunPayslips,
  useRunPayslip,
  useInitiatePayrollRun,
  useCalculatePayrollRun,
  useApprovePayrollRun,
  useMarkPaidPayrollRun,
  useAdjustPayslip,
  useRunInputs,
  useUpdateRunInput,
  useImportRunInputs,
} from './hooks/usePayrollRuns';
export {
  useEmployeeSalary,
  useEmployeePayslips,
  useEmployeePayslip,
  useEmployeeYtd,
  useAssignSalary,
  useTaxDeclaration,
  useSaveTaxDeclaration,
  useUpdateTaxDeclaration,
} from './hooks/useEmployeeSalary';
export { useEmployeeLoans, useCreateLoan, useForecloseLoan } from './hooks/useLoans';
export {
  useCountries,
  useBankSchema,
  useLegalEntities,
  useCreateLegalEntity,
  useUpdateLegalEntity,
  useStatutoryPacks,
  useCreateStatutoryPack,
  useUpdateStatutoryPack,
} from './hooks/useLocalization';

// Utils
export {
  evaluateFormula,
  validateFormula,
  resolveComponentOrder,
  computeComponentBreakdown,
  computeComponentTotals,
  evaluateSlab,
  computeRegimeTax,
  projectPeriodTax,
  computeContribution,
  registerSlabTables,
  clearSlabTables,
} from './utils/formula.utils';
export type { ComponentTotals, PeriodTaxArgs, ContributionResult } from './utils/formula.utils';

// Constants
export { COMPONENT_TYPE_CONFIG, CALCULATION_TYPE_CONFIG, RUN_STATUS_CONFIG } from './constants';

// Validations
export { salaryComponentSchema } from './validations/salary-component.schema';
export type { SalaryComponentFormValues } from './validations/salary-component.schema';
export { payGroupSchema } from './validations/pay-group.schema';
export type { PayGroupFormValues } from './validations/pay-group.schema';
export { payrollRunSchema } from './validations/payroll-run.schema';
export type { PayrollRunFormValues } from './validations/payroll-run.schema';

// Components (exported for use in settings pages and elsewhere)
export { SalaryComponentsPanel } from './components/SalaryComponentsPanel';
export { SalaryComponentDrawer } from './components/SalaryComponentDrawer';
export { PayGroupsPanel } from './components/PayGroupsPanel';
export { PayGroupDrawer } from './components/PayGroupDrawer';
export { PaySchedulesPanel } from './components/PaySchedulesPanel';
export { LegalEntitiesPanel } from './components/LegalEntitiesPanel';
export { LegalEntityDrawer } from './components/LegalEntityDrawer';
export { StatutoryPacksPanel } from './components/StatutoryPacksPanel';
export { PayrollScreen } from './components/PayrollScreen';
export { PayrollRunsTab } from './components/PayrollRunsTab';
export { InitiateRunDialog } from './components/InitiateRunDialog';
export { PayrollRunDetail } from './components/PayrollRunDetail';
export { RunInputsPanel } from './components/RunInputsPanel';
export { PayslipDrawer } from './components/PayslipDrawer';
export { AdjustmentDialog } from './components/AdjustmentDialog';
export { MyPayslipsPage } from './components/MyPayslipsPage';
export { TaxDeclarationCard } from './components/TaxDeclarationCard';
export { LoansCard } from './components/LoansCard';
