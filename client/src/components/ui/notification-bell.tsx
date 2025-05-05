import { useState, useEffect, useRef } from 'react';
import { Bell, X } from 'lucide-react';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useAuth } from '@/lib/auth';
import { Popover, PopoverContent, PopoverTrigger } from './popover';
import { Button } from './button';
import { Badge } from './badge';
import { ScrollArea } from './scroll-area';
import { Card } from './card';
import { Separator } from './separator';
import { formatDistance } from 'date-fns';
import { useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';

interface Notification {
  id: number;
  userId: number;
  type: string;
  title: string;
  body: string;
  linkPath?: string;
  isRead: boolean;
  createdAt: string;
  metadata?: Record<string, any>;
}

export function NotificationBell() {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const socket = useRef<WebSocket | null>(null);
  const [, navigate] = useLocation();
  const { toast } = useToast();

  // Fetch unread count
  useEffect(() => {
    if (!user) return;

    const fetchUnreadCount = async () => {
      try {
        // Get all notifications and count unread ones client-side
        const response = await apiRequest('GET', '/api/notifications');
        const data = await response.json();
        const unread = data.filter((n: Notification) => !n.isRead).length;
        setUnreadCount(unread);
      } catch (error) {
        console.error('Failed to fetch unread count:', error);
      }
    };

    fetchUnreadCount();
    
    // Set up polling for unread count (every 60 seconds)
    const interval = setInterval(fetchUnreadCount, 60000);
    
    return () => clearInterval(interval);
  }, [user]);

  // Set up WebSocket for real-time notifications
  useEffect(() => {
    if (!user) return;

    // Get session ID from cookie
    const getCookie = (name: string) => {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return parts.pop()?.split(';').shift();
      return null;
    };

    const sessionId = getCookie('sessionId');
    if (!sessionId) return;

    // Create WebSocket connection
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws?sessionId=${sessionId}`;
    
    const ws = new WebSocket(wsUrl);
    socket.current = ws;
    
    ws.addEventListener('open', () => {
      console.log('WebSocket connection established');
    });
    
    ws.addEventListener('message', (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === 'notification') {
          // Update unread count
          setUnreadCount(prev => prev + 1);
          
          // Show toast notification
          toast({
            title: data.data.title,
            description: data.data.body,
          });
          
          // Update notifications list if popover is open
          if (open) {
            setNotifications(prev => [data.data, ...prev]);
          }
        }
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    });
    
    ws.addEventListener('close', () => {
      console.log('WebSocket connection closed');
    });
    
    ws.addEventListener('error', (error) => {
      console.error('WebSocket error:', error);
    });
    
    // Clean up WebSocket connection
    return () => {
      if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
        ws.close();
      }
    };
  }, [user, toast]);
  
  // Fetch notifications when popover is opened
  useEffect(() => {
    if (!user || !open) return;
    
    const fetchNotifications = async () => {
      setLoading(true);
      try {
        const response = await apiRequest('GET', '/api/notifications?limit=20');
        const data = await response.json();
        setNotifications(data);
      } catch (error) {
        console.error('Failed to fetch notifications:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchNotifications();
  }, [user, open]);
  
  const handleMarkAsRead = async (notification: Notification) => {
    if (notification.isRead) return;
    
    try {
      await apiRequest('PATCH', `/api/notifications/${notification.id}/read`);
      
      // Update local state
      setNotifications(prev => 
        prev.map(n => (n.id === notification.id ? { ...n, isRead: true } : n))
      );
      
      // Update unread count
      setUnreadCount(prev => Math.max(0, prev - 1));
      
      // Invalidate query cache
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };
  
  const handleMarkAllAsRead = async () => {
    if (!user || unreadCount === 0) return;
    
    try {
      await apiRequest('POST', `/api/notifications/mark-all-read`);
      
      // Update local state
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
      
      // Invalidate query cache
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };
  
  const handleNavigate = (notification: Notification) => {
    handleMarkAsRead(notification);
    
    // Use linkPath from schema instead of link
    if (notification.linkPath) {
      navigate(notification.linkPath);
      setOpen(false);
    }
  };
  
  const handleDelete = async (id: number) => {
    try {
      await apiRequest('DELETE', `/api/notifications/${id}`);
      
      // Update local state
      setNotifications(prev => prev.filter(n => n.id !== id));
      
      // If deleting an unread notification, decrement the counter
      const notification = notifications.find(n => n.id === id);
      if (notification && !notification.isRead) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
      
      // Invalidate query cache
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };
  
  if (!user) return null;
  
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" className="relative p-2">
          <Bell size={20} />
          {unreadCount > 0 && (
            <Badge variant="destructive" className="absolute top-0 right-0 h-5 min-w-[1.25rem] px-1 transform translate-x-1/3 -translate-y-1/3">
              {unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[350px] p-0">
        <div className="flex items-center justify-between px-4 py-2 border-b">
          <h3 className="font-semibold">Notifications</h3>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={handleMarkAllAsRead}>
              Mark all as read
            </Button>
          )}
        </div>
        <ScrollArea className="h-[400px]">
          {loading ? (
            <div className="flex justify-center items-center h-20">
              <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex justify-center items-center h-20 text-muted-foreground">
              No notifications
            </div>
          ) : (
            <div className="flex flex-col">
              {notifications.map((notification) => (
                <Card key={notification.id} className={`
                  p-3 rounded-none border-0 border-b last:border-b-0 
                  cursor-pointer hover:bg-muted/50 transition-colors
                  ${notification.isRead ? 'bg-background' : 'bg-muted/20'}
                `}>
                  <div className="flex justify-between">
                    <div className="flex-1" onClick={() => handleNavigate(notification)}>
                      <div className="font-semibold">{notification.title}</div>
                      <div className="text-sm text-muted-foreground">{notification.body}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {formatDistance(new Date(notification.createdAt), new Date(), {
                          addSuffix: true,
                        })}
                      </div>
                    </div>
                    <button 
                      className="text-muted-foreground hover:text-foreground h-6 w-6 flex items-center justify-center"
                      onClick={() => handleDelete(notification.id)}
                    >
                      <X size={14} />
                    </button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}