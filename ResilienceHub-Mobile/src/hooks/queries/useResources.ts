import { useQuery } from '@tanstack/react-query';
import { ApiService } from '../../services/api';
import { unwrap, queryKeys } from './utils';

/** Global resource library. */
export function useResources() {
  return useQuery({
    queryKey: queryKeys.resources,
    queryFn: () => unwrap<any[]>(ApiService.getResources()),
  });
}
