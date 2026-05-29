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

export function useBranding() {
  return useQuery({
    queryKey: ['settings', 'branding'],
    queryFn: settingsApi.getBranding,
    staleTime: 5 * 60_000,
  });
}

export function useLeaveTypes() {
  return useQuery({
    queryKey: ['settings', 'leave-types'],
    queryFn: settingsApi.getLeaveTypes,
    staleTime: 5 * 60_000,
  });
}

export function useAttendanceRules() {
  return useQuery({
    queryKey: ['settings', 'attendance-rules'],
    queryFn: settingsApi.getAttendanceRules,
    staleTime: 5 * 60_000,
  });
}

export function useAuthSettings() {
  return useQuery({
    queryKey: ['settings', 'auth'],
    queryFn: settingsApi.getAuthSettings,
    staleTime: 5 * 60_000,
  });
}

export function useNotificationPrefs() {
  return useQuery({
    queryKey: ['settings', 'notification-prefs'],
    queryFn: settingsApi.getNotificationPrefs,
    staleTime: 60_000,
  });
}

export function useEmailIntegration() {
  return useQuery({
    queryKey: ['settings', 'integrations', 'email'],
    queryFn: settingsApi.getEmailIntegration,
    staleTime: 5 * 60_000,
  });
}

export function useEmailDeliveryStats() {
  return useQuery({
    queryKey: ['settings', 'integrations', 'email', 'stats'],
    queryFn: settingsApi.getEmailDeliveryStats,
    staleTime: 5 * 60_000,
  });
}
