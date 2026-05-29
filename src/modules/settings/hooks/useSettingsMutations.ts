import { useMutation, useQueryClient } from '@tanstack/react-query';
import { settingsApi } from '../services/settings.api';
import type {
  AttendanceRulesUpdateInput,
  AuthSettingsUpdateInput,
  EmailIntegrationUpdateInput,
  EmailTemplateType,
  EmailTemplateUpdateInput,
  LeaveTypeCreateInput,
  LeaveTypeUpdateInput,
  NotificationPrefsUpdateInput,
  StorageIntegrationUpdateInput,
  TenantSettingsUpdateInput,
} from '../types/settings.types';

export function useUpdateTenantSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: TenantSettingsUpdateInput) => settingsApi.updateTenant(input),
    onSuccess: (updated) => {
      queryClient.setQueryData(['settings', 'tenant'], updated);
    },
  });
}

export function useUpdateEmailTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ type, input }: { type: EmailTemplateType; input: EmailTemplateUpdateInput }) =>
      settingsApi.updateEmailTemplate(type, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings', 'email-templates'] });
    },
  });
}

export function useUpdateBranding() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: FormData | { primary_color_hex?: string; logo_url?: string }) =>
      settingsApi.updateBranding(input),
    onSuccess: (updated) => {
      queryClient.setQueryData(['settings', 'branding'], updated);
    },
  });
}

export function useCreateLeaveType() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: LeaveTypeCreateInput) => settingsApi.createLeaveType(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings', 'leave-types'] });
    },
  });
}

export function useUpdateLeaveType() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: LeaveTypeUpdateInput }) =>
      settingsApi.updateLeaveType(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings', 'leave-types'] });
    },
  });
}

export function useDeleteLeaveType() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => settingsApi.deleteLeaveType(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings', 'leave-types'] });
    },
  });
}

export function useUpdateAttendanceRules() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: AttendanceRulesUpdateInput) => settingsApi.updateAttendanceRules(input),
    onSuccess: (updated) => {
      queryClient.setQueryData(['settings', 'attendance-rules'], updated);
    },
  });
}

export function useUpdateAuthSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: AuthSettingsUpdateInput) => settingsApi.updateAuthSettings(input),
    onSuccess: (updated) => {
      queryClient.setQueryData(['settings', 'auth'], updated);
    },
  });
}

export function useUpdateNotificationPrefs() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: NotificationPrefsUpdateInput) => settingsApi.updateNotificationPrefs(input),
    onSuccess: (updated) => {
      queryClient.setQueryData(['settings', 'notification-prefs'], updated);
    },
  });
}

export function useUpdateEmailIntegration() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: EmailIntegrationUpdateInput) => settingsApi.updateEmailIntegration(input),
    onSuccess: (updated) => {
      queryClient.setQueryData(['settings', 'integrations', 'email'], updated);
    },
  });
}

export function useTestEmailIntegration() {
  return useMutation({
    mutationFn: (to: string) => settingsApi.testEmailIntegration(to),
  });
}

export function useUpdateStorageIntegration() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: StorageIntegrationUpdateInput) =>
      settingsApi.updateStorageIntegration(input),
    onSuccess: (updated) => {
      queryClient.setQueryData(['settings', 'integrations', 'storage'], updated);
    },
  });
}

export function useTestStorageIntegration() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => settingsApi.testStorageIntegration(),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['settings', 'integrations', 'storage'] });
    },
  });
}
