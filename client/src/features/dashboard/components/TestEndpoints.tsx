import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import useActiveUser from '@/hooks/use-active-user';

export default function TestEndpoints() {
  const { activeUserId } = useActiveUser();

  // Fetch protective factors usage with effectiveness ratings
  const { data: protectiveFactors, isLoading: isLoadingProtectiveFactors } = useQuery<any[]>({
    queryKey: activeUserId ? [`/api/users/${activeUserId}/protective-factor-usage`] : [],
    enabled: !!activeUserId,
  });
  
  // Fetch coping strategies usage with effectiveness ratings
  const { data: copingStrategies, isLoading: isLoadingCopingStrategies } = useQuery<any[]>({
    queryKey: activeUserId ? [`/api/users/${activeUserId}/coping-strategy-usage`] : [],
    enabled: !!activeUserId,
  });

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>API Endpoint Test</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="font-medium">Protective Factor Usage with Effectiveness:</h3>
              {isLoadingProtectiveFactors ? (
                <p>Loading...</p>
              ) : protectiveFactors?.length ? (
                <pre className="bg-muted p-2 rounded-md overflow-auto text-xs">
                  {JSON.stringify(protectiveFactors, null, 2)}
                </pre>
              ) : (
                <p>No data available</p>
              )}
            </div>
            
            <div>
              <h3 className="font-medium">Coping Strategy Usage with Effectiveness:</h3>
              {isLoadingCopingStrategies ? (
                <p>Loading...</p>
              ) : copingStrategies?.length ? (
                <pre className="bg-muted p-2 rounded-md overflow-auto text-xs">
                  {JSON.stringify(copingStrategies, null, 2)}
                </pre>
              ) : (
                <p>No data available</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}