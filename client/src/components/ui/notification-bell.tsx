import { useState, useEffect } from "react";
import { Bell } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/lib/auth";
import { useWebSocketContext } from "@/context/WebSocketContext";

interface Notification {
  id: number;
  title: string;
  body: string;
  type: string;
  isRead: boolean;
  createdAt: string;
  link?: string;
  linkPath?: string;
}

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const { lastMessage, isConnected } = useWebSocketContext();

  // Fetch notifications when component mounts or dropdown is opened
  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  // Fetch unread count on mount and every minute, but only if user is authenticated
  useEffect(() => {
    if (user?.id) {
      fetchUnreadCount();
      const interval = setInterval(fetchUnreadCount, 60000);
      return () => clearInterval(interval);
    } else {
      setUnreadCount(0);
      setNotifications([]);
    }
  }, [user?.id]);

  // Handle WebSocket messages for real-time notifications
  useEffect(() => {
    if (lastMessage && lastMessage.data) {
      try {
        const messageData = typeof lastMessage.data === 'string' 
          ? JSON.parse(lastMessage.data) 
          : lastMessage.data;
        
        if (messageData.type === 'new_notification') {
          setUnreadCount(prev => prev + 1);
          
          // Add to notifications list if dropdown is open
          if (isOpen && messageData.notification) {
            setNotifications(prev => [messageData.notification, ...prev]);
          }
          
          // Show toast notification
          toast({
            title: messageData.notification?.title || 'New Notification',
            description: messageData.notification?.body || '',
            duration: 5000,
          });
        }
      } catch (error) {
        console.error("Error parsing WebSocket message:", error);
      }
    }
  }, [lastMessage, isOpen, toast]);

  async function fetchNotifications() {
    try {
      const response = await apiRequest("GET", "/api/notifications?limit=10");
      if (response.ok) {
        const data = await response.json();
        setNotifications(data);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  }

  async function fetchUnreadCount() {
    try {
      if (!user?.id) {
        setUnreadCount(0);
        return;
      }
      
      const timestampedUrl = `/api/notifications/unread?_t=${Date.now()}`;
      
      const response = await fetch(timestampedUrl, {
        method: 'GET',
        headers: {
          'X-User-ID': user.id.toString(),
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
          'X-Timestamp': Date.now().toString()
        },
        credentials: 'include'
      });
      
      if (response.ok) {
        try {
          const data = await response.json();
          if (Array.isArray(data)) {
            setUnreadCount(data.length);
          } else {
            setUnreadCount(0);
          }
        } catch (parseError) {
          console.error("Error parsing unread count response");
          setUnreadCount(0);
        }
      }
    } catch (error) {
      console.error("Error fetching unread count - will retry later");
    }
  }

  async function markAsRead(id: number) {
    try {
      const response = await apiRequest("POST", `/api/notifications/read/${id}`);
      if (response.ok) {
        setNotifications(notifications.map(notification => 
          notification.id === id ? { ...notification, isRead: true } : notification
        ));
        setUnreadCount(prevCount => Math.max(0, prevCount - 1));
        
        setTimeout(() => fetchUnreadCount(), 500);
      }
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  }

  async function markAllAsRead() {
    try {
      const timestamp = Date.now();
      
      setNotifications(notifications.map(notification => ({ ...notification, isRead: true })));
      setUnreadCount(0);
      
      const response = await fetch(`/api/notifications/read-all?_t=${timestamp}`, {
        method: 'POST',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
          'X-Timestamp': timestamp.toString(),
          'X-User-ID': user?.id?.toString() || ''
        },
        credentials: 'include'
      });
      
      if (response.ok) {
        setTimeout(() => {
          fetchUnreadCount();
        }, 1000);
        
        toast({
          title: "Success",
          description: "All notifications marked as read",
        });
      }
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      toast({
        title: "Error",
        description: "Failed to mark notifications as read",
        variant: "destructive",
      });
    }
  }

  async function deleteNotification(id: number) {
    try {
      const response = await apiRequest("DELETE", `/api/notifications/${id}`);
      if (response.ok) {
        const updatedNotifications = notifications.filter(notification => notification.id !== id);
        setNotifications(updatedNotifications);
        
        const deletedNotification = notifications.find(notification => notification.id === id);
        if (deletedNotification && !deletedNotification.isRead) {
          setUnreadCount(prevCount => Math.max(0, prevCount - 1));
        }
        
        setTimeout(() => fetchUnreadCount(), 500);
        
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
        await fetchUnreadCount();
        
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

  function formatDate(dateString: string) {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  }

  function getNotificationColor(type: string) {
    switch (type) {
      case 'reminder': return 'text-blue-600';
      case 'alert': return 'text-red-600';
      case 'system': return 'text-gray-600';
      case 'therapist_message': return 'text-green-600';
      default: return 'text-gray-600';
    }
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center text-xs p-0"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between p-2 border-b">
          <h3 className="font-semibold">Notifications</h3>
          <div className="flex gap-2">
            {notifications.some(n => !n.isRead) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={markAllAsRead}
                className="text-xs"
              >
                Mark all read
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={createTestNotification}
              className="text-xs"
            >
              Test
            </Button>
          </div>
        </div>
        
        <ScrollArea className="max-h-80">
          {notifications.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              No notifications
            </div>
          ) : (
            notifications.map((notification) => (
              <DropdownMenuItem key={notification.id} className="p-3 block">
                <div 
                  className={`space-y-1 ${!notification.isRead ? 'bg-blue-50' : ''} rounded p-2`}
                  onClick={() => !notification.isRead && markAsRead(notification.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className={`text-sm font-medium ${getNotificationColor(notification.type)}`}>
                          {notification.title}
                        </h4>
                        {!notification.isRead && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {notification.body}
                      </p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-muted-foreground">
                          {formatDate(notification.createdAt)}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNotification(notification.id);
                          }}
                          className="text-xs p-1 h-auto"
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </DropdownMenuItem>
            ))
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}