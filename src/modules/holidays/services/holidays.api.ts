import { apiClient } from '@/lib/api-client';
import { formatDateForApi } from '@/lib/date';
import type {
  Holiday,
  HolidayCreateInput,
  HolidayDeleteResult,
  HolidaysData,
  HolidayUpdateInput,
} from '../types/holiday.types';

export const holidaysApi = {
  /**
   * GET /holidays?year=YYYY
   * Returns data: { holidays: [...], total: N }
   */
  list: async (year: number): Promise<HolidaysData> => {
    const { data } = await apiClient.get<{ data: HolidaysData }>('/holidays', {
      params: { year },
    });
    return data.data;
  },

  /**
   * POST /holidays → 201, data = holiday object
   * holidayDate MUST be YYYY-MM-DD (server uses z.string().date() — rejects full ISO).
   */
  create: async (input: HolidayCreateInput): Promise<Holiday> => {
    const body: HolidayCreateInput = {
      ...input,
      holidayDate: formatDateForApi(input.holidayDate),
    };
    const { data } = await apiClient.post<{ data: Holiday }>('/holidays', body);
    return data.data;
  },

  /**
   * PATCH /holidays/:id → 200, data = updated holiday
   * holidayDate, if provided, must be YYYY-MM-DD.
   */
  update: async ({ id, ...patch }: { id: string } & HolidayUpdateInput): Promise<Holiday> => {
    const body: HolidayUpdateInput = {
      ...patch,
      ...(patch.holidayDate && { holidayDate: formatDateForApi(patch.holidayDate) }),
    };
    const { data } = await apiClient.patch<{ data: Holiday }>(`/holidays/${id}`, body);
    return data.data;
  },

  /**
   * DELETE /holidays/:id → 200, data = { id, status: "deleted" }
   */
  remove: async (id: string): Promise<HolidayDeleteResult> => {
    const { data } = await apiClient.delete<{ data: HolidayDeleteResult }>(`/holidays/${id}`);
    return data.data;
  },
};
