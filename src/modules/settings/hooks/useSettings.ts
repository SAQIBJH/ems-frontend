import { useQuery } from '@tanstack/react-query';
import { settingsApi } from '../services/settings.api';
import type { AuditLogsParams } from '../types/settings.types';

export function useTenantSettings() {
  return useQuery({
    queryKey: ['settings', 'tenant'],
    queryFn: settingsApi.getTenant,
    staleTime: 5 * 60_000,
  });
}

export function useEmailTemplates() {
  return useQuery({
    queryKey: ['settings', 'email-templates'],
    queryFn: settingsApi.getEmailTemplates,
    staleTime: 5 * 60_000,
  });
}

export function useAuditLogs(params: AuditLogsParams = {}) {
  return useQuery({
    queryKey: ['settings', 'audit-logs', params],
    queryFn: () => settingsApi.getAuditLogs(params),
    staleTime: 30_000,
  });
}
