'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import { queryClient } from '@/lib/query-client';
import { documentsApi } from '../services/documents.api';
import type { DocumentType } from '../types/employee.types';

export function useEmployeeDocuments(employeeId: string) {
  return useQuery({
    queryKey: ['employees', employeeId, 'documents'],
    queryFn: () => documentsApi.list(employeeId),
    enabled: !!employeeId,
  });
}

export function useUploadDocument(employeeId: string) {
  return useMutation({
    mutationFn: ({ file, documentType }: { file: File; documentType: DocumentType }) =>
      documentsApi.upload(employeeId, file, documentType),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees', employeeId, 'documents'] });
    },
  });
}

export function useRemoveDocument(employeeId: string) {
  return useMutation({
    mutationFn: (docId: string) => documentsApi.remove(employeeId, docId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees', employeeId, 'documents'] });
    },
  });
}
