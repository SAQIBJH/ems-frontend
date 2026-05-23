import { useMutation, useQueryClient } from '@tanstack/react-query';
import { permissionsApi } from '../services/permissions.api';
import type { UpdateRolePermissionsInput } from '../types/permissions.types';

export function useUpdateRolePermissions() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateRolePermissionsInput) => permissionsApi.updateRolePermissions(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings', 'roles-permissions'] });
    },
  });
}
