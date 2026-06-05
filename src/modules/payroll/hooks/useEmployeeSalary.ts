import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { employeeSalaryApi } from '../services/employee-salary.api';
import type { EmployeeSalaryInput, TaxDeclarationInput } from '../types/payroll.types';

export const SALARY_KEY = ['payroll', 'employee-salary'] as const;
export const PAYSLIPS_KEY = ['payroll', 'employee-payslips'] as const;
export const YTD_KEY = ['payroll', 'employee-ytd'] as const;
export const TAX_DECL_KEY = ['payroll', 'tax-declaration'] as const;

export function useEmployeeSalary(employeeId: string | null) {
  return useQuery({
    queryKey: [...SALARY_KEY, employeeId],
    queryFn: () => employeeSalaryApi.get(employeeId!),
    enabled: !!employeeId,
  });
}

export function useEmployeePayslips(
  employeeId: string | null,
  params?: { page?: number; limit?: number; year?: number },
) {
  return useQuery({
    queryKey: [...PAYSLIPS_KEY, employeeId, params],
    queryFn: () => employeeSalaryApi.listPayslips(employeeId!, params),
    enabled: !!employeeId,
  });
}

export function useEmployeePayslip(employeeId: string | null, payslipId: string | null) {
  return useQuery({
    queryKey: [...PAYSLIPS_KEY, employeeId, 'detail', payslipId],
    queryFn: () => employeeSalaryApi.getPayslip(employeeId!, payslipId!),
    enabled: !!(employeeId && payslipId),
  });
}

export function useEmployeeYtd(employeeId: string | null, fy?: string) {
  return useQuery({
    queryKey: [...YTD_KEY, employeeId, fy ?? 'current'],
    queryFn: () => employeeSalaryApi.getYtd(employeeId!, fy),
    enabled: !!employeeId,
  });
}

export function useTaxDeclaration(employeeId: string | null, fy: string) {
  return useQuery({
    queryKey: [...TAX_DECL_KEY, employeeId, fy],
    queryFn: () => employeeSalaryApi.getTaxDeclaration(employeeId!, fy),
    enabled: !!employeeId && !!fy,
  });
}

export function useSaveTaxDeclaration() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ employeeId, input }: { employeeId: string; input: TaxDeclarationInput }) =>
      employeeSalaryApi.saveTaxDeclaration(employeeId, input),
    onSuccess: (_data, { employeeId }) =>
      qc.invalidateQueries({ queryKey: [...TAX_DECL_KEY, employeeId] }),
  });
}

export function useUpdateTaxDeclaration() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      employeeId,
      input,
    }: {
      employeeId: string;
      input: Partial<TaxDeclarationInput> & { fiscalYear: string };
    }) => employeeSalaryApi.updateTaxDeclaration(employeeId, input),
    onSuccess: (_data, { employeeId }) =>
      qc.invalidateQueries({ queryKey: [...TAX_DECL_KEY, employeeId] }),
  });
}

export function useAssignSalary() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ employeeId, input }: { employeeId: string; input: EmployeeSalaryInput }) =>
      employeeSalaryApi.assign(employeeId, input),
    onSuccess: (_data, { employeeId }) => {
      qc.invalidateQueries({ queryKey: [...SALARY_KEY, employeeId] });
    },
  });
}
