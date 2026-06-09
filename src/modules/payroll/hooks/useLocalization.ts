import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { localizationApi } from '../services/localization.api';
import type { LegalEntityInput } from '../types/localization.types';
import type { StatutoryPackInput } from '../types/statutory.types';

export const COUNTRIES_KEY = ['payroll', 'countries'] as const;
export const LEGAL_ENTITIES_KEY = ['payroll', 'legal-entities'] as const;
export const STATUTORY_PACKS_KEY = ['payroll', 'statutory-packs'] as const;

export function useCountries() {
  return useQuery({
    queryKey: COUNTRIES_KEY,
    queryFn: () => localizationApi.listCountries(),
    staleTime: 1000 * 60 * 60, // countries rarely change
  });
}

export function useBankSchema(country: string | undefined) {
  return useQuery({
    queryKey: ['payroll', 'bank-schema', country] as const,
    queryFn: () => localizationApi.getBankSchema(country as string),
    enabled: !!country,
    staleTime: 1000 * 60 * 60,
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

export function useStatutoryPacks(country?: string) {
  return useQuery({
    queryKey: [...STATUTORY_PACKS_KEY, country ?? 'all'] as const,
    queryFn: () => localizationApi.listStatutoryPacks(country),
  });
}

export function useCreateStatutoryPack() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: StatutoryPackInput) => localizationApi.createStatutoryPack(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: STATUTORY_PACKS_KEY }),
  });
}

export function useUpdateStatutoryPack() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: { id: string } & Partial<StatutoryPackInput>) =>
      localizationApi.updateStatutoryPack(args),
    onSuccess: () => qc.invalidateQueries({ queryKey: STATUTORY_PACKS_KEY }),
  });
}

export function useDeleteStatutoryPack() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => localizationApi.deleteStatutoryPack(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: STATUTORY_PACKS_KEY }),
  });
}
