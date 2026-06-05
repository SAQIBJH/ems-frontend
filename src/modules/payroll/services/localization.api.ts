import { apiClient } from '@/lib/api-client';
import type {
  BankField,
  Country,
  LegalEntity,
  LegalEntityInput,
} from '../types/localization.types';

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
};
