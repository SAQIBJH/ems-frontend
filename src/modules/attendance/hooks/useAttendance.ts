import { useQuery } from '@tanstack/react-query';
import { attendanceApi } from '../services/attendance.api';
import type { AttendanceRecordsParams } from '../types/attendance.types';

export function useAttendanceToday() {
  return useQuery({
    queryKey: ['attendance', 'today'],
    queryFn: attendanceApi.getToday,
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
}

export function useAttendanceRecords(params?: AttendanceRecordsParams) {
  return useQuery({
    queryKey: ['attendance', 'records', params ?? {}],
    queryFn: () => attendanceApi.getRecords(params),
  });
}

export function useAttendanceSummary() {
  return useQuery({
    queryKey: ['attendance', 'summary'],
    queryFn: attendanceApi.getSummary,
  });
}

export function useRegularizations() {
  return useQuery({
    queryKey: ['attendance', 'regularizations'],
    queryFn: attendanceApi.getRegularizations,
  });
}
