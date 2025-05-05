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

interface Notification {
  id: number;
  title: string;
  body: string; // Changed from "content" to "body" to match database
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

  // Fetch notifications when component mounts or dropdown is opened
  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  // Fetch unread count on mount and every minute
  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 60000);
    return () => clearInterval(interval);
  }, []);

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
      const response = await apiRequest("GET", "/api/notifications/unread");
      if (response.ok) {
        const data = await response.json();
        setUnreadCount(data.length);
      }
    } catch (error) {
      console.error("Error fetching unread count:", error);
    }
  }

  async function markAsRead(id: number) {
    try {
      const response = await apiRequest("POST", `/api/notifications/read/${id}`);
      if (response.ok) {
        // Update the notification in the list
        setNotifications(notifications.map(notification => 
          notification.id === id ? { ...notification, isRead: true } : notification
        ));
        // Update unread count
        setUnreadCount(prevCount => Math.max(0, prevCount - 1));
      }
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  }

  async function markAllAsRead() {
    try {
      const response = await apiRequest("POST", "/api/notifications/read-all");
      if (response.ok) {
        // Set all notifications as read
        setNotifications(notifications.map(notification => ({ ...notification, isRead: true })));
        // Reset unread count
        setUnreadCount(0);
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
        // Remove notification from list
        const updatedNotifications = notifications.filter(notification => notification.id !== id);
        setNotifications(updatedNotifications);
        
        // If the deleted notification was unread, update the count
        const deletedNotification = notifications.find(notification => notification.id === id);
        if (deletedNotification && !deletedNotification.isRead) {
          setUnreadCount(prevCount => Math.max(0, prevCount - 1));
        }
        
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

  // Create a test notification for development purposes
  async function createTestNotification() {
    try {
      const response = await apiRequest("POST", "/api/notifications/test");
      if (response.ok) {
        toast({
          title: "Success",
          description: "Test notification created",
        });
        // Refresh notifications list and unread count
        fetchNotifications();
        fetchUnreadCount();
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

  // Format notification date to a more readable format
  function formatDate(dateString: string) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHrs = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) {
      return "Just now";
    } else if (diffMins < 60) {
      return `${diffMins} min ago`;
    } else if (diffHrs < 24) {
      return `${diffHrs} hr ago`;
    } else if (diffDays < 7) {
      return `${diffDays} day ago`;
    } else {
      // Format date as MM/DD/YYYY
      return date.toLocaleDateString();
    }
  }

  // Get notification color based on type
  function getNotificationColor(type: string) {
    switch (type) {
      case "reminder":
        return "text-yellow-500 bg-yellow-50";
      case "progress":
        return "text-green-500 bg-green-50";
      case "message":
        return "text-blue-500 bg-blue-50";
      default:
        return "text-gray-500 bg-gray-50";
    }
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell size={20} />
          {unreadCount > 0 && (
            <Badge 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-[10px] bg-red-500" 
              variant="destructive"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between px-4 py-2 border-b">
          <h3 className="font-semibold">Notifications</h3>
          {unreadCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={markAllAsRead}
              className="text-xs text-blue-600"
            >
              Mark all as read
            </Button>
          )}
        </div>
        <ScrollArea className="h-[300px]">
          {notifications.length === 0 ? (
            <div className="p-4 text-center text-sm text-gray-500">
              <div>No notifications yet</div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={createTestNotification}
                className="mt-2 w-full text-xs"
              >
                Create Test Notification
              </Button>
            </div>
          ) : (
            notifications.map((notification) => (
              <div 
                key={notification.id} 
                className={`px-4 py-3 border-b last:border-b-0 transition-colors ${notification.isRead ? 'bg-white' : 'bg-blue-50'}`}
              >
                <div className="flex justify-between mb-1">
                  <h4 className="font-medium text-sm">{notification.title}</h4>
                  <div className="flex gap-2">
                    {!notification.isRead && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => markAsRead(notification.id)} 
                        className="h-6 w-6 p-0 hover:bg-gray-100"
                      >
                        <span className="sr-only">Mark as read</span>
                        <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                      </Button>
                    )}
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => deleteNotification(notification.id)} 
                      className="h-6 w-6 p-0 hover:bg-gray-100"
                    >
                      <span className="sr-only">Delete</span>
                      <span className="text-xs">×</span>
                    </Button>
                  </div>
                </div>
                <p className="text-xs text-gray-700">{notification.body}</p>
                <div className="flex justify-between mt-1">
                  <span className={`text-[10px] px-1.5 py-0.5 rounded ${getNotificationColor(notification.type)}`}>
                    {notification.type}
                  </span>
                  <span className="text-[10px] text-gray-500">
                    {formatDate(notification.createdAt)}
                  </span>
                </div>
              </div>
            ))
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}