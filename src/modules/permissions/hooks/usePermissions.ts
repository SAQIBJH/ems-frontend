import { useQuery } from '@tanstack/react-query';
import { permissionsApi } from '../services/permissions.api';

export function useRolesPermissions() {
  return useQuery({
    queryKey: ['settings', 'roles-permissions'],
    queryFn: permissionsApi.getRolesPermissions,
    staleTime: 60_000,
  });
}
