import { useMutation, useQueryClient } from '@tanstack/react-query';
import { holidaysApi } from '../services/holidays.api';
import type { HolidayCreateInput, HolidayUpdateInput } from '../types/holiday.types';

export function useCreateHoliday(year: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: HolidayCreateInput) => holidaysApi.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['holidays', year] });
    },
  });
}

export function useUpdateHoliday(year: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: { id: string } & HolidayUpdateInput) => holidaysApi.update(vars),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['holidays', year] });
    },
  });
}

export function useDeleteHoliday(year: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => holidaysApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['holidays', year] });
    },
  });
}
