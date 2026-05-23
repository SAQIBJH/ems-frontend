import { useMutation, useQueryClient } from '@tanstack/react-query';
import { attendanceApi } from '../services/attendance.api';
import type { CheckInInput, CheckOutInput, RegularizationInput } from '../types/attendance.types';

export function useCheckIn() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CheckInInput) => attendanceApi.checkIn(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
    },
  });
}

export function useCheckOut() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input?: CheckOutInput) => attendanceApi.checkOut(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
    },
  });
}

export function useRequestRegularization() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: RegularizationInput) => attendanceApi.requestRegularization(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
    },
  });
}

export function useApproveRegularization() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, comment }: { id: string; comment?: string }) =>
      attendanceApi.approveRegularization({ id, comment }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
    },
  });
}

export function useDenyRegularization() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, comment }: { id: string; comment?: string }) =>
      attendanceApi.denyRegularization({ id, comment }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
    },
  });
}
