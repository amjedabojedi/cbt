import { queryClient } from "@/lib/queryClient";

/**
 * Utility to refresh data after mutations
 * @param queryKeys - Array of query keys to invalidate
 * @param shouldReload - Whether to reload the page (defaults to false)
 */
export function refreshData(queryKeys: string[], shouldReload: boolean = false) {
  // Invalidate all specified queries
  queryKeys.forEach(key => {
    queryClient.invalidateQueries({ queryKey: [key] });
  });
  
  // Optionally reload the page
  if (shouldReload) {
    window.location.reload();
  }
}

/**
 * Get related query keys that should be invalidated when a specific entity is modified
 * @param entityType - Type of entity being modified (e.g., 'emotion', 'thought', 'journal')
 * @param entityId - ID of the entity (if applicable)
 * @param userId - User ID (if applicable)
 */
export function getRelatedQueryKeys(entityType: string, entityId?: number, userId?: number): string[] {
  const baseKeys: string[] = [];
  
  // Common patterns for query keys
  switch (entityType) {
    case 'emotion':
      baseKeys.push('/api/emotions');
      if (userId) {
        baseKeys.push(`/api/users/${userId}/emotions`);
        baseKeys.push(`/api/users/${userId}/emotions/count`);
      }
      if (entityId) {
        baseKeys.push(`/api/emotions/${entityId}`);
      }
      // Dashboard stats also need to be refreshed
      baseKeys.push('/api/dashboard');
      break;
      
    case 'thought':
      baseKeys.push('/api/thoughts');
      if (userId) {
        baseKeys.push(`/api/users/${userId}/thoughts`);
        baseKeys.push(`/api/users/${userId}/thoughts/count`);
      }
      if (entityId) {
        baseKeys.push(`/api/thoughts/${entityId}`);
      }
      // Dashboard stats also need to be refreshed
      baseKeys.push('/api/dashboard');
      break;
      
    case 'journal':
      baseKeys.push('/api/journals');
      if (userId) {
        baseKeys.push(`/api/users/${userId}/journals`);
        baseKeys.push(`/api/users/${userId}/journals/count`);
      }
      if (entityId) {
        baseKeys.push(`/api/journals/${entityId}`);
      }
      // Dashboard stats also need to be refreshed
      baseKeys.push('/api/dashboard');
      break;
      
    case 'goal':
      baseKeys.push('/api/goals');
      if (userId) {
        baseKeys.push(`/api/users/${userId}/goals`);
        baseKeys.push(`/api/users/${userId}/goals/count`);
      }
      if (entityId) {
        baseKeys.push(`/api/goals/${entityId}`);
        baseKeys.push(`/api/goals/${entityId}/milestones`);
      }
      // Dashboard stats also need to be refreshed
      baseKeys.push('/api/dashboard');
      break;
      
    case 'milestone':
      if (entityId) {
        baseKeys.push(`/api/milestones/${entityId}`);
      }
      // Parent goal data also needs to be refreshed
      baseKeys.push('/api/goals');
      // Dashboard stats also need to be refreshed
      baseKeys.push('/api/dashboard');
      break;
      
    case 'resource':
      baseKeys.push('/api/resources');
      if (entityId) {
        baseKeys.push(`/api/resources/${entityId}`);
      }
      break;
      
    case 'client':
      baseKeys.push('/api/users/clients');
      if (entityId) {
        baseKeys.push(`/api/users/${entityId}`);
      }
      break;
      
    case 'reframe':
      baseKeys.push('/api/reframe');
      baseKeys.push('/api/reframe/practice-history');
      if (userId) {
        baseKeys.push(`/api/users/${userId}/reframe`);
      }
      // Dashboard stats also need to be refreshed
      baseKeys.push('/api/dashboard');
      break;
      
    default:
      // For any other entity type, invalidate the entire cache
      baseKeys.push('/api/dashboard');
  }
  
  return baseKeys;
}