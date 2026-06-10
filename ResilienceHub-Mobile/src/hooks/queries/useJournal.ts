import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ApiService } from '../../services/api';
import { unwrap, queryKeys } from './utils';

/** Fetches a user's journal entries. Disabled until a userId is available. */
export function useJournal(userId: number | null) {
  return useQuery({
    queryKey: queryKeys.journal(userId ?? 0),
    queryFn: () => unwrap<any[]>(ApiService.getJournalEntries(userId as number)),
    enabled: !!userId,
  });
}

export function useCreateJournal(userId: number | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => unwrap(ApiService.createJournalEntry(userId as number, data)),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.journal(userId ?? 0) }),
  });
}

export function useUpdateJournal(userId: number | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ entryId, data }: { entryId: number; data: any }) =>
      unwrap(ApiService.updateJournalEntry(entryId, data)),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.journal(userId ?? 0) }),
  });
}

export function useDeleteJournal(userId: number | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (entryId: number) => unwrap(ApiService.deleteJournalEntry(entryId)),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.journal(userId ?? 0) }),
  });
}
