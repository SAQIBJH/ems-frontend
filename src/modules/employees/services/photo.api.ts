import { apiClient } from '@/lib/api-client';
import type { PhotoUploadResult } from '../types/employee.types';

export const photoApi = {
  /**
   * POST /employees/:id/photo  (multipart/form-data)
   * Field: file (File) — any image format (JPEG/PNG/WebP/GIF). The backend
   * resizes to max 800×800, converts to WebP, and deletes the old photo.
   * Shape: { data: { id, profilePhotoUrl } }
   *
   * We MUST override Content-Type to `multipart/form-data` here — same reason as
   * documents.api.ts: the shared axios instance defaults to application/json,
   * under which axios 1.x serializes FormData to JSON and the File is dropped.
   */
  upload: async (employeeId: string, file: File): Promise<PhotoUploadResult> => {
    const form = new FormData();
    form.append('file', file);
    const { data } = await apiClient.post<{ data: PhotoUploadResult }>(
      `/employees/${employeeId}/photo`,
      form,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    );
    return data.data;
  },

  /**
   * DELETE /employees/:id/photo → 200
   * Removes the photo from Cloudinary and clears profilePhotoUrl.
   */
  remove: async (employeeId: string): Promise<void> => {
    await apiClient.delete(`/employees/${employeeId}/photo`);
  },
};
