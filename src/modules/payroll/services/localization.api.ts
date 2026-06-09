import { apiClient } from '@/lib/api-client';
import type {
  BankField,
  Country,
  LegalEntity,
  LegalEntityInput,
} from '../types/localization.types';
import type { StatutoryPack, StatutoryPackInput } from '../types/statutory.types';

export const localizationApi = {
  listCountries: async (): Promise<Country[]> => {
    const { data } = await apiClient.get<{ data: Country[] }>('/payroll/countries');
    return data.data;
  },

  getBankSchema: async (country: string): Promise<BankField[]> => {
    const { data } = await apiClient.get<{ data: { country: string; fields: BankField[] } }>(
      `/payroll/countries/${country}/bank-schema`,
    );
    return data.data.fields;
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

  listStatutoryPacks: async (country?: string): Promise<StatutoryPack[]> => {
    const { data } = await apiClient.get<{ data: StatutoryPack[] }>('/payroll/statutory-packs', {
      params: country ? { country } : undefined,
    });
    return data.data;
  },

  createStatutoryPack: async (input: StatutoryPackInput): Promise<StatutoryPack> => {
    const { data } = await apiClient.post<{ data: StatutoryPack }>(
      '/payroll/statutory-packs',
      input,
    );
    return data.data;
  },

  updateStatutoryPack: async ({
    id,
    ...body
  }: { id: string } & Partial<StatutoryPackInput>): Promise<StatutoryPack> => {
    const { data } = await apiClient.patch<{ data: StatutoryPack }>(
      `/payroll/statutory-packs/${id}`,
      body,
    );
    return data.data;
  },

  deleteStatutoryPack: async (id: string): Promise<void> => {
    // Backend returns { success, data: { deleted: true } }; a 409 PACK_IN_USE is
    // surfaced when a legal entity still references the pack.
    await apiClient.delete(`/payroll/statutory-packs/${id}`);
  },
};
