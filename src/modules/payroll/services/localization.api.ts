import { apiClient } from '@/lib/api-client';
import type {
  BankField,
  Country,
  LegalEntity,
  LegalEntityInput,
  WeekDay,
} from '../types/localization.types';
import type { StatutoryPack, StatutoryPackInput } from '../types/statutory.types';
import { deriveWorkWeekDays, deriveWorkWeekPattern } from '../utils/work-week.utils';

const DEFAULT_WEEK: WeekDay[] = ['MON', 'TUE', 'WED', 'THU', 'FRI'];

/** Ensure an entity always carries workWeekDays/hoursPerDay, deriving from a legacy
 *  coarse enum when an older backend only returns `workWeekPattern`. */
function normalizeEntity(e: LegalEntity): LegalEntity {
  if (e.workWeekDays && e.workWeekDays.length > 0) return e;
  return {
    ...e,
    workWeekDays: e.workWeekPattern ? deriveWorkWeekDays(e.workWeekPattern) : DEFAULT_WEEK,
    hoursPerDay: e.hoursPerDay ?? 8,
  };
}

/** Send a best-effort `workWeekPattern` alongside `workWeekDays` so a backend that still
 *  expects the coarse enum keeps working (faithful day-set is sent for newer backends). */
function withDerivedPattern<T extends Partial<LegalEntityInput>>(body: T) {
  return body.workWeekDays
    ? { ...body, workWeekPattern: deriveWorkWeekPattern(body.workWeekDays) }
    : body;
}

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
    return data.data.map(normalizeEntity);
  },

  createLegalEntity: async (input: LegalEntityInput): Promise<LegalEntity> => {
    const { data } = await apiClient.post<{ data: LegalEntity }>(
      '/payroll/legal-entities',
      withDerivedPattern(input),
    );
    return normalizeEntity(data.data);
  },

  updateLegalEntity: async ({
    id,
    ...body
  }: { id: string } & Partial<LegalEntityInput>): Promise<LegalEntity> => {
    const { data } = await apiClient.patch<{ data: LegalEntity }>(
      `/payroll/legal-entities/${id}`,
      withDerivedPattern(body),
    );
    return normalizeEntity(data.data);
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
