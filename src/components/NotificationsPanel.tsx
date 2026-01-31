import { useState, useEffect } from 'react';
import { X, Award, CheckCircle, Gift, Coins, Gamepad2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';

interface Notification {
  id: string;
  type: 'badge' | 'chore_approved' | 'chore_denied' | 'reward' | 'coins' | 'game';
  title: string;
  message: string;
  icon: string;
  timestamp: Date;
}

interface NotificationsPanelProps {
  profileId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function NotificationsPanel({ profileId, isOpen, onClose }: NotificationsPanelProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isOpen && profileId) {
      fetchNotifications();
    }
  }, [isOpen, profileId]);

  const fetchNotifications = async () => {
    setIsLoading(true);
    const notifs: Notification[] = [];

    try {
      // Recent badge unlocks (last 7 days)
      const { data: badges } = await supabase
        .from('kid_badges')
        .select('unlocked_at, badges(name, icon)')
        .eq('profile_id', profileId)
        .gte('unlocked_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .order('unlocked_at', { ascending: false })
        .limit(5);

      badges?.forEach(b => {
        const badge = b.badges as unknown as { name: string; icon: string };
        notifs.push({
          id: `badge-${b.unlocked_at}`,
          type: 'badge',
          title: 'Badge Earned!',
          message: `You unlocked "${badge?.name}"`,
          icon: badge?.icon || '🏅',
          timestamp: new Date(b.unlocked_at),
        });
      });

      // Recent approved chores (last 7 days)
      const { data: approvedClaims } = await supabase
        .from('chore_claims')
        .select('approved_at, chores(title, reward_value)')
        .eq('profile_id', profileId)
        .eq('status', 'completed')
        .not('approved_at', 'is', null)
        .gte('approved_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .order('approved_at', { ascending: false })
        .limit(5);

      approvedClaims?.forEach(c => {
        const chore = c.chores as unknown as { title: string; reward_value: number };
        notifs.push({
          id: `chore-${c.approved_at}`,
          type: 'chore_approved',
          title: 'Chore Approved!',
          message: `"${chore?.title}" +${chore?.reward_value} coins`,
          icon: '✅',
          timestamp: new Date(c.approved_at!),
        });
      });

      // Recent game plays (last 3 days)
      const { data: games } = await supabase
        .from('game_plays')
        .select('played_at, game_type, coins_earned, score')
        .eq('profile_id', profileId)
        .gte('played_at', new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString())
        .order('played_at', { ascending: false })
        .limit(3);

      games?.forEach(g => {
        notifs.push({
          id: `game-${g.played_at}`,
          type: 'game',
          title: 'Game Played!',
          message: `Score: ${g.score} • +${g.coins_earned} coins`,
          icon: '🎮',
          timestamp: new Date(g.played_at),
        });
      });

      // Sort by timestamp (newest first)
      notifs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
      setNotifications(notifs);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const getIconComponent = (type: string) => {
    switch (type) {
      case 'badge': return <Award className="w-5 h-5 text-yellow-500" />;
      case 'chore_approved': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'chore_denied': return <X className="w-5 h-5 text-red-500" />;
      case 'reward': return <Gift className="w-5 h-5 text-purple-500" />;
      case 'coins': return <Coins className="w-5 h-5 text-primary" />;
      case 'game': return <Gamepad2 className="w-5 h-5 text-blue-500" />;
      default: return <Award className="w-5 h-5" />;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 px-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Panel */}
      <div className="relative bg-card border border-border rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in slide-in-from-top-2 duration-200">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="font-bold text-lg">Notifications</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        <ScrollArea className="h-80">
          {isLoading ? (
            <div className="flex items-center justify-center h-40">
              <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
              <Award className="w-10 h-10 mb-2 opacity-50" />
              <p className="text-sm">No recent activity</p>
              <p className="text-xs">Complete chores to see updates here!</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {notifications.map(n => (
                <div key={n.id} className="flex items-start gap-3 p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-muted flex items-center justify-center text-xl">
                    {n.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {getIconComponent(n.type)}
                      <span className="font-semibold text-sm">{n.title}</span>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">{n.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDistanceToNow(n.timestamp, { addSuffix: true })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>
    </div>
  );
}
