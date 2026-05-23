import { useMutation, useQueryClient } from '@tanstack/react-query';
import { settingsApi } from '../services/settings.api';
import type {
  EmailTemplateType,
  EmailTemplateUpdateInput,
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
