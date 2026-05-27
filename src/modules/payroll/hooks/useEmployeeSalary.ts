import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { employeeSalaryApi } from '../services/employee-salary.api';
import type { EmployeeSalaryInput } from '../types/payroll.types';

export const SALARY_KEY = ['payroll', 'employee-salary'] as const;
export const PAYSLIPS_KEY = ['payroll', 'employee-payslips'] as const;

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
