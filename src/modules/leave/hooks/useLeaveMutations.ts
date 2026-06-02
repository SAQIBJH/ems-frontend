import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { AxiosError } from 'axios';

import type { ApiError } from '@/types/api';
import { leaveApi } from '../services/leave.api';
import type { CreateLeaveInput, LeaveRequestsPage, LeaveStatus } from '../types/leave.types';

function extractMessage(err: unknown, fallback: string): string {
  return (err as AxiosError<ApiError>)?.response?.data?.error?.message ?? fallback;
}

export function useCreateLeaveRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateLeaveInput) => leaveApi.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leave'] });
    },
  });
}

export function useApproveLeaveRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: { id: string; comment?: string }) => leaveApi.approve(vars),
    onMutate: async ({ id }) => {
      await queryClient.cancelQueries({ queryKey: ['leave', 'team-requests'] });
      const prev = queryClient.getQueriesData<LeaveRequestsPage>({
        queryKey: ['leave', 'team-requests'],
      });
      queryClient.setQueriesData<LeaveRequestsPage>(
        { queryKey: ['leave', 'team-requests'] },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            requests: old.requests.map((r) =>
              r.id === id ? { ...r, status: 'APPROVED' as LeaveStatus } : r,
            ),
          };
        },
      );
      return { prev };
    },
    onError: (err, _, context) => {
      context?.prev.forEach(([key, data]) => {
        queryClient.setQueryData(key, data);
      });
      toast.error(extractMessage(err, 'Failed to approve leave request'));
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['leave'] });
      queryClient.invalidateQueries({ queryKey: ['manager', 'approvals'] });
    },
  });
}

export function useRejectLeaveRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: { id: string; comment: string }) => leaveApi.reject(vars),
    onMutate: async ({ id }) => {
      await queryClient.cancelQueries({ queryKey: ['leave', 'team-requests'] });
      const prev = queryClient.getQueriesData<LeaveRequestsPage>({
        queryKey: ['leave', 'team-requests'],
      });
      queryClient.setQueriesData<LeaveRequestsPage>(
        { queryKey: ['leave', 'team-requests'] },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            requests: old.requests.map((r) =>
              r.id === id ? { ...r, status: 'DENIED' as LeaveStatus } : r,
            ),
          };
        },
      );
      return { prev };
    },
    onError: (err, _, context) => {
      context?.prev.forEach(([key, data]) => {
        queryClient.setQueryData(key, data);
      });
      toast.error(extractMessage(err, 'Failed to deny leave request'));
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['leave'] });
      queryClient.invalidateQueries({ queryKey: ['manager', 'approvals'] });
    },
  });
}

export function useBulkApproveLeave() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: { ids: string[]; comment?: string }) => leaveApi.bulkApprove(vars),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leave'] });
      queryClient.invalidateQueries({ queryKey: ['manager', 'approvals'] });
    },
    onError: (err) => {
      toast.error(extractMessage(err, 'Bulk approve failed'));
    },
  });
}

export function useBulkRejectLeave() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: { ids: string[]; comment?: string }) => leaveApi.bulkReject(vars),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leave'] });
      queryClient.invalidateQueries({ queryKey: ['manager', 'approvals'] });
    },
    onError: (err) => {
      toast.error(extractMessage(err, 'Bulk deny failed'));
    },
  });
}

export function useWithdrawLeaveRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => leaveApi.withdraw(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['leave', 'requests'] });
      const prev = queryClient.getQueriesData<LeaveRequestsPage>({
        queryKey: ['leave', 'requests'],
      });
      queryClient.setQueriesData<LeaveRequestsPage>({ queryKey: ['leave', 'requests'] }, (old) => {
        if (!old) return old;
        return {
          ...old,
          requests: old.requests.map((r) =>
            r.id === id ? { ...r, status: 'WITHDRAWN' as LeaveStatus } : r,
          ),
        };
      });
      return { prev };
    },
    onError: (err, _, context) => {
      context?.prev.forEach(([key, data]) => {
        queryClient.setQueryData(key, data);
      });
      toast.error(extractMessage(err, 'Failed to withdraw leave request'));
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['leave'] });
    },
  });
}
