import { useQuery } from '@tanstack/react-query';
import { ApiService } from '../../services/api';
import { unwrap, queryKeys } from './utils';

/** The authenticated user's full profile (name, etc. — richer than AuthContext identity). */
export function useCurrentUser() {
  return useQuery({
    queryKey: queryKeys.currentUser,
    queryFn: () => unwrap<any>(ApiService.getCurrentUser()),
  });
}
