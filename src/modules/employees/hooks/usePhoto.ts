'use client';

import { useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/query-client';
import { photoApi } from '../services/photo.api';

function invalidate(employeeId: string) {
  // Refresh the open profile (so the new photoUrl shows) and any list view.
  queryClient.invalidateQueries({ queryKey: ['employees', employeeId] });
  queryClient.invalidateQueries({ queryKey: ['employees'] });
  // When a user edits their OWN photo, the topbar avatar (fed by GET /auth/me)
  // must update too. Refetching /auth/me is cheap, so invalidate unconditionally.
  queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
}

export function useUploadPhoto(employeeId: string) {
  return useMutation({
    mutationFn: (file: File) => photoApi.upload(employeeId, file),
    onSuccess: () => invalidate(employeeId),
  });
}

export function useDeletePhoto(employeeId: string) {
  return useMutation({
    mutationFn: () => photoApi.remove(employeeId),
    onSuccess: () => invalidate(employeeId),
  });
}
