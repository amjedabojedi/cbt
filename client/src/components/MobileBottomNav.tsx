import { Link, useLocation } from 'wouter';
import { useAuth } from '@/lib/auth';
import { useClientContext } from '@/context/ClientContext';
import { apiRequest } from '@/lib/queryClient';
import { getBottomNavigation } from '@/components/layout/primary-navigation';
import { useLocalization } from '@/lib/localize';

interface MobileBottomNavProps {
  className?: string;
}

export function MobileBottomNav({ className }: MobileBottomNavProps) {
  const [location] = useLocation();
  const { user } = useAuth();
  const { t } = useLocalization();
  const { viewingClientId, viewingClientName, setViewingClient } = useClientContext();
  const viewingClient = user?.role === 'therapist' && !!viewingClientId &&
    !!viewingClientName && !location.startsWith('/clients');
  const bottomNavItems = getBottomNavigation(user?.role, viewingClient);

  const returnToClients = async () => {
    setViewingClient(null, null);
    try {
      await apiRequest('POST', '/api/users/current-viewing-client', { clientId: null });
    } catch {
      // Match the full menu: local selection is cleared even if offline.
    }
  };

  const isActive = (href: string, exact?: boolean) => {
    if (href === '/dashboard') {
      return location === '/' || location === '/dashboard';
    }
    return exact ? location === href : location.startsWith(href);
  };

  return (
    <div className={`md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background border-t ${className ?? ''}`}>
      <nav aria-label={t("Bottom shortcuts")} className="flex items-stretch justify-around py-2 px-1">
        {bottomNavItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href, item.exact);
          
          return (
            <Link key={item.href} href={item.href}
              aria-current={active ? 'page' : undefined}
              onClick={item.isReturn ? returnToClients : undefined}
              className="min-w-0 flex-1 basis-0">
              <div className="flex h-full flex-col items-center space-y-1 py-2 px-0.5">
                <Icon 
                  className={`h-5 w-5 ${
                    active 
                      ? 'text-primary' 
                      : 'text-muted-foreground'
                  }`} 
                />
                <span 
                  className={`w-full break-words text-center leading-tight text-[10px] min-[390px]:text-xs font-medium ${
                    active 
                      ? 'text-primary' 
                      : 'text-muted-foreground'
                  }`}
                >
                  {t(item.label)}
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