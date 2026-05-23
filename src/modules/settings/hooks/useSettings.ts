import { useQuery } from '@tanstack/react-query';
import { settingsApi } from '../services/settings.api';

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
