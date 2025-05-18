import { useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/auth';
import { refreshData, getRelatedQueryKeys } from '@/lib/refreshUtils';

/**
 * Hook for handling consistent data refreshing after mutations
 */
export function useRefreshData() {
  const { toast } = useToast();
  const { user } = useAuth();
  
  /**
   * Function to refresh data after a successful operation
   * @param entityType - Type of entity that was modified
   * @param action - Action that was performed (create, update, delete)
   * @param entityId - ID of the entity (if applicable)
   * @param message - Success message to display
   * @param shouldReload - Whether to reload the page
   */
  const refreshAfterOperation = useCallback((
    entityType: string,
    action: 'create' | 'update' | 'delete',
    entityId?: number,
    message?: string,
    shouldReload: boolean = false
  ) => {
    // Determine related query keys to invalidate
    const queryKeys = getRelatedQueryKeys(entityType, entityId, user?.id);
    
    // Create default success message if none provided
    const defaultMessage = {
      create: `${entityType.charAt(0).toUpperCase() + entityType.slice(1)} created successfully`,
      update: `${entityType.charAt(0).toUpperCase() + entityType.slice(1)} updated successfully`,
      delete: `${entityType.charAt(0).toUpperCase() + entityType.slice(1)} deleted successfully`,
    };
    
    // Show success toast
    toast({
      title: `${action.charAt(0).toUpperCase() + action.slice(1)} Successful`,
      description: message || defaultMessage[action],
    });
    
    // Refresh data
    refreshData(queryKeys, shouldReload);
  }, [toast, user]);
  
  return { refreshAfterOperation };
}