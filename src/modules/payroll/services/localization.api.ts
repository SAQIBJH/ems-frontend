import { apiClient } from '@/lib/api-client';
import type { Country, LegalEntity, LegalEntityInput } from '../types/localization.types';

export const localizationApi = {
  listCountries: async (): Promise<Country[]> => {
    const { data } = await apiClient.get<{ data: Country[] }>('/payroll/countries');
    return data.data;
  },

  listLegalEntities: async (): Promise<LegalEntity[]> => {
    const { data } = await apiClient.get<{ data: LegalEntity[] }>('/payroll/legal-entities');
    return data.data;
  },

  createLegalEntity: async (input: LegalEntityInput): Promise<LegalEntity> => {
    const { data } = await apiClient.post<{ data: LegalEntity }>('/payroll/legal-entities', input);
    return data.data;
  },

  updateLegalEntity: async ({
    id,
    ...body
  }: { id: string } & Partial<LegalEntityInput>): Promise<LegalEntity> => {
    const { data } = await apiClient.patch<{ data: LegalEntity }>(
      `/payroll/legal-entities/${id}`,
      body,
    );
    return data.data;
  },
};
