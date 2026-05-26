import { apiClient } from '@/lib/api-client';

export interface AuditLogEntry {
  id: string;
  user_email: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  entity_type: string;
  entity_id: string;
  created_at: string;
}

export const auditLogsApi = {
  listForEmployee: async (employeeId: string): Promise<AuditLogEntry[]> => {
    const { data } = await apiClient.get<{ data: { logs: AuditLogEntry[] } }>('/audit-logs', {
      params: { entity: 'Employee', entityId: employeeId, limit: 20 },
    });
    return data.data.logs;
  },
};
