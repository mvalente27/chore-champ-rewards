import { Home, ListTodo, ClipboardCheck, Trophy, User, Wallet, History } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface BottomNavProps {
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

export function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { isParent, profile } = useAuth();
  const [pendingCount, setPendingCount] = useState(0);

  // Fetch pending approval count for parents
  useEffect(() => {
    if (isParent && profile?.household_id) {
      const fetchPendingCount = async () => {
        const { count } = await supabase
          .from('chores')
          .select('*', { count: 'exact', head: true })
          .eq('household_id', profile.household_id)
          .eq('status', 'pending_verification');
        setPendingCount(count || 0);
      };
      fetchPendingCount();

      // Subscribe to changes
      const channel = supabase
        .channel('pending-chores')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'chores',
          filter: `household_id=eq.${profile.household_id}`
        }, () => fetchPendingCount())
        .subscribe();

      return () => { supabase.removeChannel(channel); };
    }
  }, [isParent, profile?.household_id]);

  const navItems = [
    { id: 'home', icon: Home, label: 'Home', path: '/' },
    { id: 'chores', icon: ListTodo, label: 'Chores', path: '/' },
    ...(isParent ? [{ id: 'approvals', icon: ClipboardCheck, label: 'Approve', path: '/approvals', badge: pendingCount }] : []),
    { id: 'rewards', icon: Trophy, label: 'Rewards', path: '/rewards' },
    { id: 'profile', icon: User, label: 'Profile', path: '/' },
  ];

  const handleClick = (item: typeof navItems[0]) => {
    // For items that navigate to the index page with different tabs
    if (item.path === '/') {
      // If already on index, just switch tabs
      if (location.pathname === '/') {
        if (onTabChange) {
          onTabChange(item.id);
        }
      } else {
        // Navigate to index with tab param
        navigate(`/?tab=${item.id}`);
      }
    } else {
      // Navigate to other pages
      navigate(item.path);
    }
  };

  const isActive = (item: typeof navItems[0]) => {
    // For non-index pages, check pathname match
    if (item.path !== '/') {
      return location.pathname === item.path;
    }
    // For index page tabs, use activeTab state
    if (activeTab) {
      return activeTab === item.id;
    }
    return location.pathname === '/' && item.id === 'home';
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border/50 px-2 pb-safe shadow-float z-50">
      <div className="flex items-center justify-around max-w-md mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item);
          const badge = 'badge' in item ? item.badge : 0;
          
          return (
            <button
              key={item.id}
              onClick={() => handleClick(item)}
              className={cn(
                "flex flex-col items-center gap-1 py-3 px-3 transition-all duration-200",
                active ? "text-primary" : "text-muted-foreground"
              )}
            >
              <div className={cn(
                "p-2 rounded-xl transition-all duration-200 relative",
                active && "bg-primary/10"
              )}>
                <Icon className={cn("w-5 h-5", active && "animate-bounce-gentle")} />
                {badge > 0 && (
                  <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                    {badge > 9 ? '9+' : badge}
                  </span>
                )}
              </div>
              <span className={cn(
                "text-xs font-semibold",
                active && "text-primary"
              )}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
