import { useQuery } from '@tanstack/react-query';
import { ApiService } from '../../services/api';
import { unwrap, queryKeys } from './utils';

/** Clients assigned to the logged-in therapist. Pass `enabled=false` for non-therapist roles. */
export function useTherapistClients(enabled = true) {
  return useQuery({
    queryKey: queryKeys.therapistClients,
    queryFn: () => unwrap<any[]>(ApiService.getTherapistClients()),
    enabled,
  });
}

/** Resource assignments the therapist has made to clients. */
export function useTherapistAssignments(enabled = true) {
  return useQuery({
    queryKey: ['therapistAssignments'],
    queryFn: () => unwrap<any[]>(ApiService.getTherapistAssignments()),
    enabled,
  });
}

export function useTherapistJournalStats() {
  return useQuery({
    queryKey: ['therapistStats', 'journal'],
    queryFn: () => unwrap<{ totalCount: number }>(ApiService.getTherapistJournalStats()),
  });
}

export function useTherapistThoughtStats() {
  return useQuery({
    queryKey: ['therapistStats', 'thoughts'],
    queryFn: () => unwrap<{ totalCount: number }>(ApiService.getTherapistThoughtStats()),
  });
}

export function useTherapistGoalStats() {
  return useQuery({
    queryKey: ['therapistStats', 'goals'],
    queryFn: () => unwrap<{ totalCount: number }>(ApiService.getTherapistGoalStats()),
  });
}

/** Pending/sent client invitations (therapist + admin directory). */
export function useInvitations() {
  return useQuery({
    queryKey: ['invitations'],
    queryFn: () => unwrap<any[]>(ApiService.getInvitations()),
  });
}
