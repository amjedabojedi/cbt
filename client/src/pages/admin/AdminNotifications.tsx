import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AppLayout from "@/components/layout/AppLayout";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Bell, Trash2, Eye, EyeOff } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Notification {
  id: number;
  title: string;
  body: string;
  type: string;
  isRead: boolean;
  createdAt: string;
  userId: number;
  userName?: string;
  userEmail?: string;
}

export default function AdminNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const { toast } = useToast();

  useEffect(() => {
    fetchNotifications();
  }, []);

  async function fetchNotifications() {
    try {
      setLoading(true);
      const response = await apiRequest("GET", "/api/admin/notifications");
      if (response.ok) {
        const data = await response.json();
        setNotifications(data);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
      toast({
        title: "Error",
        description: "Failed to fetch notifications",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  async function markAsRead(id: number) {
    try {
      const response = await apiRequest("POST", `/api/notifications/read/${id}`);
      if (response.ok) {
        setNotifications(notifications.map(notification => 
          notification.id === id ? { ...notification, isRead: true } : notification
        ));
        toast({
          title: "Success",
          description: "Notification marked as read",
        });
      }
    } catch (error) {
      console.error("Error marking notification as read:", error);
      toast({
        title: "Error",
        description: "Failed to mark notification as read",
        variant: "destructive",
      });
    }
  }

  async function deleteNotification(id: number) {
    try {
      const response = await apiRequest("DELETE", `/api/notifications/${id}`);
      if (response.ok) {
        setNotifications(notifications.filter(notification => notification.id !== id));
        toast({
          title: "Success",
          description: "Notification deleted",
        });
      }
    } catch (error) {
      console.error("Error deleting notification:", error);
      toast({
        title: "Error",
        description: "Failed to delete notification",
        variant: "destructive",
      });
    }
  }

  async function createTestNotification() {
    try {
      const response = await apiRequest("POST", "/api/notifications/test");
      if (response.ok) {
        await fetchNotifications();
        toast({
          title: "Success",
          description: "Test notification created",
        });
      }
    } catch (error) {
      console.error("Error creating test notification:", error);
      toast({
        title: "Error",
        description: "Failed to create test notification",
        variant: "destructive",
      });
    }
  }

  function getNotificationColor(type: string) {
    switch (type) {
      case 'reminder': return 'bg-blue-100 text-blue-800';
      case 'alert': return 'bg-red-100 text-red-800';
      case 'system': return 'bg-gray-100 text-gray-800';
      case 'therapist_message': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  const filteredNotifications = notifications.filter(notification => {
    switch (activeTab) {
      case 'unread':
        return !notification.isRead;
      case 'read':
        return notification.isRead;
      default:
        return true;
    }
  });

  const unreadCount = notifications.filter(n => !n.isRead).length;

  if (loading) {
    return (
      <AppLayout title="System Notifications">
        <div className="flex items-center justify-center min-h-[500px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="System Notifications">
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Bell className="h-6 w-6" />
              System Notifications
            </h1>
            <p className="text-muted-foreground">
              Manage system-wide notifications and alerts
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={createTestNotification}
              variant="outline"
            >
              Create Test
            </Button>
            <Button
              onClick={fetchNotifications}
              variant="outline"
            >
              Refresh
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Notifications ({notifications.length})</span>
              {unreadCount > 0 && (
                <Badge variant="destructive">
                  {unreadCount} unread
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="all">All ({notifications.length})</TabsTrigger>
                <TabsTrigger value="unread">Unread ({unreadCount})</TabsTrigger>
                <TabsTrigger value="read">Read ({notifications.length - unreadCount})</TabsTrigger>
              </TabsList>
              
              <TabsContent value={activeTab} className="mt-4">
                <ScrollArea className="h-[600px]">
                  {filteredNotifications.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No notifications found
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {filteredNotifications.map((notification) => (
                        <Card key={notification.id} className={`${!notification.isRead ? 'border-l-4 border-l-blue-500' : ''}`}>
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <h4 className="font-medium">{notification.title}</h4>
                                  <Badge 
                                    variant="secondary" 
                                    className={getNotificationColor(notification.type)}
                                  >
                                    {notification.type}
                                  </Badge>
                                  {!notification.isRead && (
                                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground mb-2">
                                  {notification.body}
                                </p>
                                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                  <span>
                                    {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                                  </span>
                                  {notification.userName && (
                                    <span>User: {notification.userName}</span>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-2 ml-4">
                                {!notification.isRead && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => markAsRead(notification.id)}
                                    className="h-8 w-8 p-0"
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                )}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => deleteNotification(notification.id)}
                                  className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
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
    </AppLayout>
  );
}