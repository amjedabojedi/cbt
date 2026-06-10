import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ApiService } from '../../services/api';
import { unwrap, queryKeys } from './utils';

/** Admin dashboard aggregate stats. */
export function useAdminStats() {
  return useQuery({
    queryKey: queryKeys.adminStats,
    queryFn: () => unwrap<any>(ApiService.getAdminStats()),
  });
}

/** All users (admin user-management). */
export function useAllUsers() {
  return useQuery({
    queryKey: queryKeys.allUsers,
    queryFn: () => unwrap<any[]>(ApiService.getAllUsers()),
  });
}

export function useUpdateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, data }: { userId: number; data: any }) =>
      unwrap(ApiService.updateUser(userId, data)),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.allUsers }),
  });
}

export function useDeleteUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: number) => unwrap(ApiService.deleteUser(userId)),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.allUsers }),
  });
}
