import { apiClient } from '@/lib/api-client';
import type {
  PayGroup,
  PayGroupComponentInput,
  PayGroupInput,
  PayScheduleRecord,
} from '../types/payroll.types';

/* The backend coerces a null `overrideCalculationType` to "" and feeds it to a
 * Prisma enum column, which 500s the whole create/update (verified live). When a
 * component carries no override, send `{ componentId }` only; include the override
 * fields verbatim only when an override calculation type is actually set. */
type WireGroupComponent =
  | { componentId: string }
  | {
      componentId: string;
      overrideCalculationType: PayGroupComponentInput['overrideCalculationType'];
      overrideValue: PayGroupComponentInput['overrideValue'];
      overrideFormula: PayGroupComponentInput['overrideFormula'];
    };

function toWireGroupBody<T extends Partial<PayGroupInput>>(
  body: T,
): Omit<T, 'components'> & { components?: WireGroupComponent[] } {
  if (!body.components) return body;
  return {
    ...body,
    components: body.components.map((c) =>
      c.overrideCalculationType == null
        ? { componentId: c.componentId }
        : {
            componentId: c.componentId,
            overrideCalculationType: c.overrideCalculationType,
            overrideValue: c.overrideValue,
            overrideFormula: c.overrideFormula,
          },
    ),
  };
}

export const payGroupsApi = {
  list: async (): Promise<PayGroup[]> => {
    const { data } = await apiClient.get<{ data: PayGroup[] }>('/payroll/groups');
    return data.data;
  },

  create: async (input: PayGroupInput): Promise<PayGroup> => {
    const { data } = await apiClient.post<{ data: PayGroup }>(
      '/payroll/groups',
      toWireGroupBody(input),
    );
    return data.data;
  },

  update: async ({ id, ...body }: { id: string } & Partial<PayGroupInput>): Promise<PayGroup> => {
    const { data } = await apiClient.patch<{ data: PayGroup }>(
      `/payroll/groups/${id}`,
      toWireGroupBody(body),
    );
    return data.data;
  },

  remove: async (id: string): Promise<{ deleted: boolean }> => {
    const { data } = await apiClient.delete<{ data: { deleted: boolean } }>(
      `/payroll/groups/${id}`,
    );
    return data.data;
  },

  listSchedules: async (): Promise<PayScheduleRecord[]> => {
    const { data } = await apiClient.get<{ data: PayScheduleRecord[] }>('/payroll/schedules');
    return data.data;
  },
};
