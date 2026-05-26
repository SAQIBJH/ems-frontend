import { apiClient } from '@/lib/api-client';
import type { DocumentType, EmployeeDocument } from '../types/employee.types';

export const documentsApi = {
  /**
   * GET /employees/:id/documents
   * Shape: { data: { documents: EmployeeDocument[] } }
   */
  list: async (employeeId: string): Promise<EmployeeDocument[]> => {
    const { data } = await apiClient.get<{ data: { documents: EmployeeDocument[] } }>(
      `/employees/${employeeId}/documents`,
    );
    return data.data.documents;
  },

  /**
   * POST /employees/:id/documents  (multipart/form-data)
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
