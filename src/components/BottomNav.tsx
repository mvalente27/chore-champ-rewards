import { Home, ListTodo, ClipboardCheck, Trophy, User, Wallet } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';

interface BottomNavProps {
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

export function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { isParent } = useAuth();

  const navItems = [
    { id: 'home', icon: Home, label: 'Home', path: '/' },
    { id: 'chores', icon: ListTodo, label: 'Chores', path: '/' },
    ...(isParent ? [{ id: 'wallet', icon: Wallet, label: 'Wallet', path: '/wallet' }] : []),
    { id: 'rewards', icon: Trophy, label: 'Rewards', path: '/rewards' },
    { id: 'profile', icon: User, label: 'Profile', path: '/' },
  ];

  const handleClick = (item: typeof navItems[0]) => {
    if (onTabChange) {
      onTabChange(item.id);
    }
    if (item.path !== location.pathname) {
      navigate(item.path);
    }
  };

  const isActive = (item: typeof navItems[0]) => {
    if (activeTab) {
      return activeTab === item.id;
    }
    return location.pathname === item.path;
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border/50 px-2 pb-safe shadow-float z-50">
      <div className="flex items-center justify-around max-w-md mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item);
          
          return (
            <button
              key={item.id}
              onClick={() => handleClick(item)}
              className={cn(
                "flex flex-col items-center gap-1 py-3 px-4 transition-all duration-200",
                active ? "text-primary" : "text-muted-foreground"
              )}
            >
              <div className={cn(
                "p-2 rounded-xl transition-all duration-200",
                active && "bg-primary/10"
              )}>
                <Icon className={cn("w-5 h-5", active && "animate-bounce-gentle")} />
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
