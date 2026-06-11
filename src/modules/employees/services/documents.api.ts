import { apiClient } from '@/lib/api-client';
import type { DocumentType, EmployeeDocument } from '../types/employee.types';

export const documentsApi = {
  /**
   * GET /employees/:id/documents
   * Backend returns either { data: { documents: [...] } } or { data: [...] } —
   * handle both and always return an array (never undefined).
   */
  list: async (employeeId: string): Promise<EmployeeDocument[]> => {
    const { data } = await apiClient.get<{ data: unknown }>(`/employees/${employeeId}/documents`);
    const d = data.data;
    if (Array.isArray(d)) return d as EmployeeDocument[];
    if (d && typeof d === 'object' && Array.isArray((d as Record<string, unknown>).documents)) {
      return (d as Record<string, unknown>).documents as EmployeeDocument[];
    }
    return [];
  },

  /**
   * POST /employees/:id/documents  (multipart/form-data)
   * Fields: file (File), documentType (string)
   * Shape: { data: EmployeeDocument }
   *
   * We MUST override Content-Type to `multipart/form-data` here. The shared axios
   * instance (`lib/api-client.ts`) sets a default `Content-Type: application/json`;
   * with that default in place, axios 1.x serializes a FormData body to JSON
   * (`formDataToJSON` → the File becomes `{}`) and the file is never sent. Setting
   * the header to `multipart/form-data` makes axios pass the FormData through, and
   * the platform fills in the real boundary.
   */
  upload: async (
    employeeId: string,
    file: File,
    documentType: DocumentType,
  ): Promise<EmployeeDocument> => {
    const form = new FormData();
    form.append('file', file);
    form.append('documentType', documentType);
    const { data } = await apiClient.post<{ data: EmployeeDocument }>(
      `/employees/${employeeId}/documents`,
      form,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    );
    return data.data;
  },

  /**
   * DELETE /employees/:id/documents/:docId
   */
  remove: async (employeeId: string, docId: string): Promise<void> => {
    await apiClient.delete(`/employees/${employeeId}/documents/${docId}`);
  },
};
