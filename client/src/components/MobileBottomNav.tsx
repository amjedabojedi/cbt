import { Link, useLocation } from 'wouter';
import { 
  Home, 
  Heart, 
  Brain, 
  BookOpen, 
  BarChart3
} from 'lucide-react';

interface MobileBottomNavProps {
  className?: string;
}

export function MobileBottomNav({ className }: MobileBottomNavProps) {
  const [location] = useLocation();

  const bottomNavItems = [
    { href: '/dashboard', icon: Home, label: 'Home' },
    { href: '/emotion-tracking', icon: Heart, label: 'Emotions' },
    { href: '/thought-records', icon: Brain, label: 'Thoughts' },
    { href: '/journal', icon: BookOpen, label: 'Journal' },
    { href: '/reports', icon: BarChart3, label: 'Reports' },
  ];

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return location === '/' || location === '/dashboard';
    }
    return location.startsWith(href);
  };

  return (
    <div className={`md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background border-t ${className}`}>
      <nav className="flex items-center justify-around py-2 px-4">
        {bottomNavItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          
          return (
            <Link key={item.href} href={item.href}>
              <div className="flex flex-col items-center space-y-1 min-w-0 flex-1 py-2">
                <Icon 
                  className={`h-5 w-5 ${
                    active 
                      ? 'text-primary' 
                      : 'text-muted-foreground'
                  }`} 
                />
                <span 
                  className={`text-xs font-medium ${
                    active 
                      ? 'text-primary' 
                      : 'text-muted-foreground'
                  }`}
                >
                  {item.label}
                </span>
              </div>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

export default MobileBottomNav;