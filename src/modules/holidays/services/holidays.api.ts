import { apiClient } from '@/lib/api-client';
import { formatDateForApi } from '@/lib/date';
import type {
  Holiday,
  HolidayCreateInput,
  HolidayDeleteResult,
  HolidaysData,
  HolidayUpdateInput,
  IcsImportCommitResult,
  IcsImportJob,
  IcsImportPreview,
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

  /**
   * POST /holidays/import (multipart) → 202, data = { jobId, previewUrl }
   * Live backend (Fastify multipart). The axios client defaults to
   * `Content-Type: application/json`; for a FormData body that default makes the
   * backend reject the request as non-multipart (406 FST_INVALID_MULTIPART_CONTENT_TYPE).
   * Set Content-Type to undefined so the browser sets `multipart/form-data` + boundary.
   */
  startImport: async (file: File): Promise<IcsImportJob> => {
    const form = new FormData();
    form.append('file', file);
    const { data } = await apiClient.post<{ data: IcsImportJob }>('/holidays/import', form, {
      headers: { 'Content-Type': undefined },
    });
    return data.data;
  },

  /**
   * GET /holidays/import/:jobId/preview
   */
  getImportPreview: async (jobId: string): Promise<IcsImportPreview> => {
    const { data } = await apiClient.get<{ data: IcsImportPreview }>(
      `/holidays/import/${jobId}/preview`,
    );
    return data.data;
  },

  /**
   * POST /holidays/import/:jobId/commit → { imported, overwritten, skipped }
   */
  commitImport: async (
    jobId: string,
    overwriteExisting: boolean,
  ): Promise<IcsImportCommitResult> => {
    const { data } = await apiClient.post<{ data: IcsImportCommitResult }>(
      `/holidays/import/${jobId}/commit`,
      { overwriteExisting },
    );
    return data.data;
  },
};
