import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { 
  Menu, 
  Home, 
  Heart, 
  BookOpen, 
  Brain, 
  Target, 
  Library, 
  BarChart3,
  Settings,
  Users,
  FileText
} from 'lucide-react';
import { useAuth } from '@/lib/auth';

interface MobileNavigationProps {
  className?: string;
}

export function MobileNavigation({ className }: MobileNavigationProps) {
  const [open, setOpen] = useState(false);
  const [location] = useLocation();
  const { user } = useAuth();

  const navigationItems = [
    { href: '/dashboard', icon: Home, label: 'Dashboard' },
    { href: '/emotions', icon: Heart, label: 'Track Emotions' },
    { href: '/thought-records', icon: Brain, label: 'Thought Records' },
    { href: '/journal', icon: BookOpen, label: 'Journal' },
    { href: '/goals', icon: Target, label: 'Goals' },
    { href: '/reports', icon: BarChart3, label: 'Reports' },
    { href: '/resources', icon: Library, label: 'Resources' },
  ];

  // Add therapist-specific items
  if (user?.role === 'therapist' || user?.role === 'admin') {
    navigationItems.push({ href: '/clients', icon: Users, label: 'Clients' });
  }

  // Add admin-specific items
  if (user?.role === 'admin') {
    navigationItems.push({ href: '/admin', icon: Settings, label: 'Admin' });
  }

  navigationItems.push({ href: '/settings', icon: Settings, label: 'Settings' });

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return location === '/' || location === '/dashboard';
    }
    return location.startsWith(href);
  };

  return (
    <div className={`md:hidden ${className}`}>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="relative">
            <Menu className="h-6 w-6" />
            <span className="sr-only">Open navigation menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-72 p-0">
          <div className="flex h-full flex-col">
            <div className="flex h-14 items-center border-b px-4">
              <div className="flex items-center space-x-2">
                <div className="h-8 w-8 rounded-lg bg-primary" />
                <span className="text-lg font-semibold">ResilienceHub</span>
              </div>
            </div>
            <nav className="flex-1 space-y-1 p-4">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                  >
                    <div
                      className={`flex items-center space-x-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                        isActive(item.href)
                          ? 'bg-primary text-primary-foreground'
                          : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      <span>{item.label}</span>
                    </div>
                  </Link>
                );
              })}
            </nav>
            <div className="border-t p-4">
              <div className="flex items-center space-x-3">
                <div className="h-8 w-8 rounded-full bg-muted" />
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium">{user?.name}</p>
                  <p className="text-xs text-muted-foreground capitalize">{user?.role}</p>
                </div>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

export default MobileNavigation;