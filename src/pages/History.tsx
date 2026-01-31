import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { BottomNav } from '@/components/BottomNav';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Calendar, TrendingUp, Gift, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { format, startOfWeek, startOfMonth, startOfYear, isAfter } from 'date-fns';
import { SmartAvatar } from '@/components/avatar';

// Helper to safely display icon - returns fallback if it looks like JSON
const getSafeIcon = (icon: string | null | undefined): string => {
  if (!icon) return '📋';
  const trimmed = icon.trim();
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    return '📋';
  }
  return icon;
};

interface HistoryItem {
  id: string;
  type: 'chore' | 'reward';
  title: string;
  icon: string;
  amount: number;
  date: Date;
  kidName?: string;
  kidAvatar?: string | null;
}

interface Profile {
  id: string;
  name: string;
  avatar_url: string | null;
}

const History = () => {
  const [activeTab, setActiveTab] = useState('history');
  const [period, setPeriod] = useState<'week' | 'month' | 'year'>('week');
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [householdProfiles, setHouseholdProfiles] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const { user, profile, isParent, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (profile?.household_id) {
      fetchHistory();
    }
  }, [profile?.household_id]);

  const fetchHistory = async () => {
    if (!profile?.household_id) return;
    setIsLoading(true);

    try {
      // Fetch profiles for name lookups
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, name, avatar_url')
        .eq('household_id', profile.household_id);

      if (profilesError) throw profilesError;
      setHouseholdProfiles(profiles || []);

      // Fetch completed chores
      const { data: chores, error: choresError } = await supabase
        .from('chores')
        .select('id, title, icon, reward_value, completed_at, assigned_to')
        .eq('household_id', profile.household_id)
        .eq('status', 'completed')
        .not('completed_at', 'is', null)
        .order('completed_at', { ascending: false });

      if (choresError) throw choresError;

      // Fetch redemptions
      const { data: redemptions, error: redemptionsError } = await supabase
        .from('redemptions')
        .select(`
          id,
          cost,
          created_at,
          profile_id,
          reward_id,
          rewards (name, icon)
        `)
        .eq('status', 'pending');

      if (redemptionsError) throw redemptionsError;

      // Combine into history items
      const choreItems: HistoryItem[] = (chores || []).map(c => {
        const kid = profiles?.find(p => p.id === c.assigned_to);
        return {
          id: c.id,
          type: 'chore' as const,
          title: c.title,
          icon: c.icon || '✅',
          amount: c.reward_value,
          date: new Date(c.completed_at!),
          kidName: kid?.name,
          kidAvatar: kid?.avatar_url || null
        };
      });

      const rewardItems: HistoryItem[] = (redemptions || []).map(r => {
        const kid = profiles?.find(p => p.id === r.profile_id);
        const reward = r.rewards as { name: string; icon: string } | null;
        return {
          id: r.id,
          type: 'reward' as const,
          title: reward?.name || 'Reward',
          icon: reward?.icon || '🎁',
          amount: r.cost,
          date: new Date(r.created_at),
          kidName: kid?.name,
          kidAvatar: kid?.avatar_url || null
        };
      });

      const allItems = [...choreItems, ...rewardItems].sort(
        (a, b) => b.date.getTime() - a.date.getTime()
      );

      setHistoryItems(allItems);
    } catch (err) {
      console.error('Error fetching history:', err);
      toast.error('Failed to load history');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredItems = useMemo(() => {
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case 'week':
        startDate = startOfWeek(now, { weekStartsOn: 1 });
        break;
      case 'month':
        startDate = startOfMonth(now);
        break;
      case 'year':
        startDate = startOfYear(now);
        break;
    }

    return historyItems.filter(item => isAfter(item.date, startDate));
  }, [historyItems, period]);

  const stats = useMemo(() => {
    const chores = filteredItems.filter(i => i.type === 'chore');
    const rewards = filteredItems.filter(i => i.type === 'reward');

    return {
      choresCompleted: chores.length,
      coinsEarned: chores.reduce((sum, c) => sum + c.amount, 0),
      rewardsRedeemed: rewards.length,
      coinsSpent: rewards.reduce((sum, r) => sum + r.amount, 0),
    };
  }, [filteredItems]);

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const periodLabel = period === 'week' ? 'This Week' : period === 'month' ? 'This Month' : 'This Year';

  return (
    <div className="min-h-screen bg-background pb-24">
      <Header 
        userName={profile?.name || ''} 
        userAvatar={profile?.avatar_url || (isParent ? '👨‍👩‍👧' : '👧')} 
        totalCoins={profile?.total_earnings}
        profileId={profile?.id}
      />
      
      <main className="max-w-md mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Calendar className="h-6 w-6 text-primary" />
              Activity History
            </h1>
            <p className="text-muted-foreground text-sm">Track progress over time</p>
          </div>
        </div>

        {/* Period Selector */}
        <Tabs value={period} onValueChange={(v) => setPeriod(v as 'week' | 'month' | 'year')}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="week">Week</TabsTrigger>
            <TabsTrigger value="month">Month</TabsTrigger>
            <TabsTrigger value="year">Year</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Stats Dashboard */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-primary/10 rounded-xl p-4 text-center">
            <CheckCircle2 className="w-6 h-6 mx-auto text-primary mb-1" />
            <p className="text-2xl font-bold text-foreground">{stats.choresCompleted}</p>
            <p className="text-xs text-muted-foreground">Chores Done</p>
          </div>
          <div className="bg-amber-500/10 rounded-xl p-4 text-center">
            <TrendingUp className="w-6 h-6 mx-auto text-amber-500 mb-1" />
            <p className="text-2xl font-bold text-foreground">{stats.coinsEarned}</p>
            <p className="text-xs text-muted-foreground">Coins Earned</p>
          </div>
          <div className="bg-purple-500/10 rounded-xl p-4 text-center">
            <Gift className="w-6 h-6 mx-auto text-purple-500 mb-1" />
            <p className="text-2xl font-bold text-foreground">{stats.rewardsRedeemed}</p>
            <p className="text-xs text-muted-foreground">Rewards Claimed</p>
          </div>
          <div className="bg-rose-500/10 rounded-xl p-4 text-center">
            <span className="text-xl block mb-1">🪙</span>
            <p className="text-2xl font-bold text-foreground">{stats.coinsSpent}</p>
            <p className="text-xs text-muted-foreground">Coins Spent</p>
          </div>
        </div>

        {/* Timeline */}
        <div className="space-y-2">
          <h2 className="font-semibold text-foreground">{periodLabel} Activity</h2>
          
          {filteredItems.length === 0 ? (
            <div className="text-center py-12 bg-muted/30 rounded-xl">
              <span className="text-4xl mb-3 block">📭</span>
              <p className="text-muted-foreground">No activity {period === 'week' ? 'this week' : period === 'month' ? 'this month' : 'this year'}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredItems.map((item) => (
                <div
                  key={`${item.type}-${item.id}`}
                  className="bg-card border rounded-lg p-3 flex items-center gap-3"
                >
                  <div className="w-10 h-10 bg-muted/50 rounded-lg flex items-center justify-center text-xl flex-shrink-0">
                    {getSafeIcon(item.icon)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground text-sm truncate">{item.title}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {isParent && item.kidName && (
                        <>
                          <span className="w-4 h-4 inline-flex items-center justify-center">
                            <SmartAvatar avatarData={item.kidAvatar || null} size={16} />
                          </span>
                          <span>{item.kidName}</span>
                          <span>•</span>
                        </>
                      )}
                      <span>{format(item.date, 'MMM d, h:mm a')}</span>
                    </div>
                  </div>
                  <div className={`text-sm font-bold ${item.type === 'chore' ? 'text-primary' : 'text-rose-500'}`}>
                    {item.type === 'chore' ? '+' : '-'}{item.amount} 🪙
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
};

export default History;
