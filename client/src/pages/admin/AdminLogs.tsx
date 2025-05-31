import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2, FileText, User, Trash2, AlertTriangle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface SystemLog {
  id: number;
  action: string;
  performedBy: number | null;
  details: Record<string, any>;
  ipAddress: string | null;
  timestamp: string;
  performerName?: string;
  performerEmail?: string;
}

export default function AdminLogs() {
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const { toast } = useToast();

  useEffect(() => {
    fetchLogs();
  }, []);

  async function fetchLogs() {
    try {
      setLoading(true);
      const response = await apiRequest("GET", "/api/admin/logs");
      if (response.ok) {
        const data = await response.json();
        setLogs(data);
      }
    } catch (error) {
      console.error("Error fetching logs:", error);
      toast({
        title: "Error",
        description: "Failed to fetch system logs",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  async function clearLogs() {
    try {
      const response = await apiRequest("DELETE", "/api/admin/logs");
      if (response.ok) {
        setLogs([]);
        toast({
          title: "Success",
          description: "System logs cleared",
        });
      }
    } catch (error) {
      console.error("Error clearing logs:", error);
      toast({
        title: "Error",
        description: "Failed to clear logs",
        variant: "destructive",
      });
    }
  }

  function getActionIcon(action: string) {
    switch (action) {
      case 'user_created':
      case 'user_updated':
        return <User className="h-4 w-4" />;
      case 'user_deleted':
        return <Trash2 className="h-4 w-4" />;
      case 'system_error':
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  }

  function getActionColor(action: string) {
    switch (action) {
      case 'user_created':
        return 'bg-green-100 text-green-800';
      case 'user_updated':
        return 'bg-blue-100 text-blue-800';
      case 'user_deleted':
        return 'bg-red-100 text-red-800';
      case 'system_error':
        return 'bg-red-100 text-red-800';
      case 'login':
        return 'bg-blue-100 text-blue-800';
      case 'logout':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  const filteredLogs = logs.filter(log => {
    switch (activeTab) {
      case 'user_actions':
        return ['user_created', 'user_updated', 'user_deleted', 'login', 'logout'].includes(log.action);
      case 'system_events':
        return ['system_error', 'system_startup', 'system_shutdown'].includes(log.action);
      case 'errors':
        return log.action.includes('error');
      default:
        return true;
    }
  });

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[500px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <FileText className="h-6 w-6" />
              System Logs
            </h1>
            <p className="text-muted-foreground">
              Monitor system activities and user actions
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={clearLogs}
              variant="destructive"
              disabled={logs.length === 0}
            >
              Clear Logs
            </Button>
            <Button
              onClick={fetchLogs}
              variant="outline"
            >
              Refresh
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Activity Log ({logs.length} entries)</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="all">All ({logs.length})</TabsTrigger>
                <TabsTrigger value="user_actions">
                  User Actions ({logs.filter(l => ['user_created', 'user_updated', 'user_deleted', 'login', 'logout'].includes(l.action)).length})
                </TabsTrigger>
                <TabsTrigger value="system_events">
                  System Events ({logs.filter(l => ['system_error', 'system_startup', 'system_shutdown'].includes(l.action)).length})
                </TabsTrigger>
                <TabsTrigger value="errors">
                  Errors ({logs.filter(l => l.action.includes('error')).length})
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value={activeTab} className="mt-4">
                <ScrollArea className="h-[600px]">
                  {filteredLogs.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No logs found for this category
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {filteredLogs.map((log) => (
                        <Card key={log.id} className="border-l-4 border-l-gray-300">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  {getActionIcon(log.action)}
                                  <h4 className="font-medium">{log.action.replace(/_/g, ' ').toUpperCase()}</h4>
                                  <Badge 
                                    variant="secondary" 
                                    className={getActionColor(log.action)}
                                  >
                                    {log.action}
                                  </Badge>
                                </div>
                                
                                {log.details && Object.keys(log.details).length > 0 && (
                                  <div className="bg-gray-50 rounded p-3 mb-2">
                                    <h5 className="text-sm font-medium mb-1">Details:</h5>
                                    <pre className="text-xs text-muted-foreground whitespace-pre-wrap">
                                      {JSON.stringify(log.details, null, 2)}
                                    </pre>
                                  </div>
                                )}
                                
                                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                  <span>
                                    {formatDistanceToNow(new Date(log.timestamp), { addSuffix: true })}
                                  </span>
                                  {log.performerName && (
                                    <span>By: {log.performerName}</span>
                                  )}
                                  {log.ipAddress && (
                                    <span>IP: {log.ipAddress}</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}