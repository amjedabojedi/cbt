import { useClientContext } from "@/context/ClientContext";
import useActiveUser from "@/hooks/use-active-user";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function ClientDebug() {
  const { viewingClientId, viewingClientName } = useClientContext();
  const { activeUserId, isViewingSelf, apiPath } = useActiveUser();
  
  if (process.env.NODE_ENV === 'production') {
    return null;
  }
  
  return (
    <Card className="mb-4 border-dashed border-yellow-500">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm text-yellow-600">Debug Information</CardTitle>
      </CardHeader>
      <CardContent className="text-xs">
        <div className="space-y-1">
          <div><strong>Client Context:</strong> {viewingClientId ? `Viewing client: ${viewingClientName} (ID: ${viewingClientId})` : 'Not viewing client'}</div>
          <div><strong>Active User ID:</strong> {activeUserId}</div>
          <div><strong>Is Viewing Self:</strong> {isViewingSelf ? 'Yes' : 'No'}</div>
          <div><strong>API Path Prefix:</strong> {apiPath}</div>
        </div>
      </CardContent>
    </Card>
  );
}