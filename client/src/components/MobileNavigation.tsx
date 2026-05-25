import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
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
  Lightbulb,
  LogOut,
  Globe,
} from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { cn } from '@/lib/utils';
import { useLocalization } from '@/lib/localize';

interface MobileNavigationProps {
  className?: string;
}

export function MobileNavigation({ className }: MobileNavigationProps) {
  const [open, setOpen] = useState(false);
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const { currentLanguage, t } = useLocalization();

  const navigationItems = [
    { href: '/dashboard', icon: Home, label: 'Dashboard' },
    { href: '/emotions', icon: Heart, label: 'Track Emotions' },
    { href: '/thoughts', icon: Brain, label: 'Thought Records' },
    { href: '/journal', icon: BookOpen, label: 'Journal' },
    { href: '/goals', icon: Target, label: 'Goals' },
    { href: '/reframe-coach', icon: Lightbulb, label: 'Reframe Coach' },
    { href: '/library', icon: Library, label: 'Resources' },
    { href: '/reports', icon: BarChart3, label: 'My Progress' },
  ];

  if (user?.role === 'therapist' || user?.role === 'admin') {
    navigationItems.push({ href: '/clients', icon: Users, label: 'Clients' });
  }

  const isActive = (href: string) => {
    if (href === '/dashboard') return location === '/' || location === '/dashboard';
    return location === href || location.startsWith(href + '/');
  };

  const initials = (user?.name || 'U')
    .split(' ')
    .map((w) => w[0])
    .filter(Boolean)
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className={cn('md:hidden', className)}>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="relative text-slate-700 hover:bg-slate-100">
            <Menu className="h-6 w-6" />
            <span className="sr-only">Open navigation menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent
          side="left"
          aria-describedby={undefined}
          className="w-72 p-0 bg-teal-800 border-r border-teal-800/80 shadow-[4px_0_24px_rgba(124,58,237,0.1)]"
        >
          <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
          <div className="flex h-full flex-col">
            {/* Logo */}
            <div className="flex items-center gap-3 px-4 py-4 border-b border-teal-800/80">
              <div className="w-9 h-9 rounded flex items-center justify-center flex-shrink-0 bg-gradient-to-tr from-purple-600 to-indigo-600 shadow-[0_0_15px_rgba(124,58,237,0.4)]">
                <Brain size={18} className="text-white" />
              </div>
              <div>
                <h1 className="text-lg font-black tracking-wide bg-gradient-to-r from-purple-300 via-indigo-200 to-purple-400 bg-clip-text text-transparent">
                  ResilienceHub
                </h1>
                <span className="text-[9px] font-bold tracking-widest text-teal-300/90 uppercase">
                  {user?.role === 'admin' ? 'Clinical Admin' : user?.role === 'therapist' ? 'Therapist Suite' : 'Client Portal'}
                </span>
              </div>
            </div>

            {/* User profile */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-teal-800/80 bg-teal-800/10">
              <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold flex-shrink-0 bg-gradient-to-tr from-purple-500/20 to-indigo-500/20 text-teal-100 border border-purple-500/35 shadow-[0_0_12px_rgba(168,85,247,0.15)]">
                {initials}
              </div>
              <div className="min-w-0">
                <p className="font-bold text-sm text-purple-100 truncate">{user?.name}</p>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-teal-300">
                  {user?.role === 'therapist' ? 'Clinical Therapist' : user?.role}
                </p>
              </div>
            </div>

            {/* Nav items */}
            <nav className="flex-1 overflow-y-auto py-3">
              <ul>
                {navigationItems.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.href);
                  return (
                    <li key={item.href} className="px-3 py-0.5">
                      <Link href={item.href} onClick={() => setOpen(false)}>
                        <div
                          className={cn(
                            'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors',
                            active
                              ? 'text-teal-200 font-bold bg-gradient-to-r from-purple-900/40 to-indigo-950/20 border-l-[3px] border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.12)]'
                              : 'text-teal-100/70 hover:text-teal-200 hover:bg-teal-700/20'
                          )}
                        >
                          <Icon size={18} className="flex-shrink-0" />
                          <span>{item.label}</span>
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>

            {/* Settings & Logout */}
            <div className="border-t border-teal-800/80 bg-teal-800/5 p-3 flex flex-col gap-3">
              {/* Language Switcher Component */}
              <div className="border-b border-teal-800/40 pb-2">
                <div className="flex flex-col space-y-1">
                  <span className="text-[10px] font-bold tracking-widest uppercase mb-1 flex items-center gap-1.5 text-teal-300/90">
                    <Globe size={12} className="animate-[spin_6s_linear_infinite]" />
                    {t("Language")}
                  </span>
                  <div className="flex p-0.5 rounded-lg border bg-teal-800/40 border-teal-700/60 shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)]">
                    <button
                      // onClick={() => setLanguage("en")}
                      className={cn(
                        "flex-1 text-xs py-1 px-2 rounded-md font-bold transition-all duration-300 text-center",
                        currentLanguage === "en"
                          ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-[0_2px_8px_rgba(124,58,237,0.4)]"
                          : "text-teal-300/80 hover:text-teal-200 hover:bg-purple-900/20"
                      )}
                    >
                      English
                    </button>
                    <button
                      onClick={() => alert("The Arabic Translated version of the app is coming soon")}
                      className={cn(
                        "flex-1 text-xs py-1 px-2 rounded-md font-bold transition-all duration-300 text-center font-noto-arabic",
                        currentLanguage === "ar"
                          ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-[0_2px_8px_rgba(124,58,237,0.4)]"
                          : "text-teal-300/80 hover:text-teal-200 hover:bg-purple-900/20"
                      )}
                    >
                      العربية
                    </button>
                  </div>
                </div>
              </div>

              <ul>
                <li className="py-0.5">
                  <Link href="/settings" onClick={() => setOpen(false)}>
                    <div
                      className={cn(
                        'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors',
                        location === '/settings'
                          ? 'text-teal-200 font-bold bg-gradient-to-r from-purple-900/40 to-indigo-950/20 border-l-[3px] border-purple-500'
                          : 'text-teal-100/70 hover:text-teal-200 hover:bg-teal-700/20'
                      )}
                    >
                      <Settings size={18} className="flex-shrink-0 text-teal-300" />
                      <span>Settings</span>
                    </div>
                  </Link>
                </li>
                <li className="py-0.5">
                  <button
                    onClick={() => { setOpen(false); logout(); }}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm text-rose-400 hover:text-rose-300 hover:bg-rose-950/15 transition-colors"
                  >
                    <LogOut size={18} className="flex-shrink-0 text-rose-400" />
                    <span>Logout</span>
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

export default MobileNavigation;
