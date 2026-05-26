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
   * Do NOT set Content-Type manually — Axios injects the boundary automatically
   * when the body is a FormData instance.
   * Fields: file (File), documentType (string)
   * Shape: { data: EmployeeDocument }
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
