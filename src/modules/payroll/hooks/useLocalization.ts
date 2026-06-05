import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { localizationApi } from '../services/localization.api';
import type { LegalEntityInput } from '../types/localization.types';

export const COUNTRIES_KEY = ['payroll', 'countries'] as const;
export const LEGAL_ENTITIES_KEY = ['payroll', 'legal-entities'] as const;

export function useCountries() {
  return useQuery({
    queryKey: COUNTRIES_KEY,
    queryFn: () => localizationApi.listCountries(),
    staleTime: 1000 * 60 * 60, // countries rarely change
  });
}

export function useLegalEntities() {
  return useQuery({
    queryKey: LEGAL_ENTITIES_KEY,
    queryFn: () => localizationApi.listLegalEntities(),
  });
}

export function useCreateLegalEntity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: LegalEntityInput) => localizationApi.createLegalEntity(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: LEGAL_ENTITIES_KEY }),
  });
}

export function useUpdateLegalEntity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: { id: string } & Partial<LegalEntityInput>) =>
      localizationApi.updateLegalEntity(args),
    onSuccess: () => qc.invalidateQueries({ queryKey: LEGAL_ENTITIES_KEY }),
  });
}
