import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ApiService } from '../../services/api';
import { unwrap, queryKeys } from './utils';

export interface Notification {
  id: number;
  title: string;
  body: string;
  isRead: boolean;
  createdAt?: string;
}

/** Fetches the current user's notifications with caching + background refetch. */
export function useNotifications() {
  return useQuery({
    queryKey: queryKeys.notifications,
    queryFn: () => unwrap<Notification[]>(ApiService.getNotifications()),
  });
}

/** Marks a single notification read and patches it in the cache (no refetch). */
export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => unwrap(ApiService.markNotificationRead(id)),
    onSuccess: (_data, id) => {
      qc.setQueryData<Notification[]>(queryKeys.notifications, (prev) =>
        (prev ?? []).map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
    },
  });
}

/** Marks every notification read and patches the cache. */
export function useMarkAllNotificationsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => unwrap(ApiService.markAllNotificationsRead()),
    onSuccess: () => {
      qc.setQueryData<Notification[]>(queryKeys.notifications, (prev) =>
        (prev ?? []).map((n) => ({ ...n, isRead: true }))
      );
    },
  });
}

/** Deletes a single notification and removes it from the cache. */
export function useDeleteNotification() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => unwrap(ApiService.deleteNotification(id)),
    onSuccess: (_data, id) => {
      qc.setQueryData<Notification[]>(queryKeys.notifications, (prev) =>
        (prev ?? []).filter((n) => n.id !== id)
      );
    },
  });
}

/** Clears all notifications and empties the cache. */
export function useClearAllNotifications() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => unwrap(ApiService.clearAllNotifications()),
    onSuccess: () => {
      qc.setQueryData<Notification[]>(queryKeys.notifications, []);
    },
  });
}
