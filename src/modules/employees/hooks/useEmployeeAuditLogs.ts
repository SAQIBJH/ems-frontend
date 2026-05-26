import { useQuery } from '@tanstack/react-query';
import { auditLogsApi } from '../services/auditLogs.api';

export function useEmployeeAuditLogs(employeeId: string, enabled = true) {
  return useQuery({
    queryKey: ['audit-logs', 'employee', employeeId],
    queryFn: () => auditLogsApi.listForEmployee(employeeId),
    enabled,
  });
}
