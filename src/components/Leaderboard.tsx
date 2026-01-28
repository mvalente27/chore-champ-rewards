import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Trophy, Medal, Award } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LeaderboardEntry {
  id: string;
  name: string;
  avatar_url: string | null;
  weekly_earnings: number;
}

interface LeaderboardProps {
  householdId: string | undefined;
  currentProfileId: string | undefined;
}

export function Leaderboard({ householdId, currentProfileId }: LeaderboardProps) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!householdId) {
      setIsLoading(false);
      return;
    }

    const fetchLeaderboard = async () => {
      setIsLoading(true);
      try {
        // Get kid profiles in household
        const { data: kids, error: kidsError } = await supabase
          .from('profiles')
          .select('id, name, avatar_url')
          .eq('household_id', householdId)
          .eq('type', 'kid');

        if (kidsError) throw kidsError;

        if (!kids || kids.length === 0) {
          setEntries([]);
          setIsLoading(false);
          return;
        }

        // Get earnings from past 7 days for each kid
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

        const { data: earnings, error: earningsError } = await supabase
          .from('earnings')
          .select('profile_id, amount')
          .in('profile_id', kids.map((k) => k.id))
          .eq('status', 'approved')
          .gte('created_at', oneWeekAgo.toISOString());

        if (earningsError) throw earningsError;

        // Aggregate earnings by profile
        const earningsByProfile: Record<string, number> = {};
        (earnings || []).forEach((e) => {
          earningsByProfile[e.profile_id] = (earningsByProfile[e.profile_id] || 0) + Number(e.amount);
        });

        // Build leaderboard entries
        const leaderboard: LeaderboardEntry[] = kids.map((kid) => ({
          id: kid.id,
          name: kid.name,
          avatar_url: kid.avatar_url,
          weekly_earnings: earningsByProfile[kid.id] || 0,
        }));

        // Sort by weekly earnings descending
        leaderboard.sort((a, b) => b.weekly_earnings - a.weekly_earnings);

        setEntries(leaderboard);
      } catch (err) {
        console.error('Error fetching leaderboard:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLeaderboard();
  }, [householdId]);

  if (isLoading) {
    return (
      <div className="bg-card rounded-2xl p-4 border border-border/50">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-muted rounded w-1/3" />
          <div className="h-10 bg-muted rounded" />
          <div className="h-10 bg-muted rounded" />
        </div>
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="bg-card rounded-2xl p-4 border border-border/50 text-center">
        <Trophy className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground">No kids in household yet</p>
      </div>
    );
  }

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 0:
        return <Trophy className="w-5 h-5 text-yellow-500" />;
      case 1:
        return <Medal className="w-5 h-5 text-gray-400" />;
      case 2:
        return <Award className="w-5 h-5 text-amber-600" />;
      default:
        return <span className="w-5 h-5 flex items-center justify-center text-xs font-bold text-muted-foreground">{rank + 1}</span>;
    }
  };

  return (
    <div className="bg-card rounded-2xl border border-border/50 overflow-hidden">
      <div className="bg-gradient-to-r from-primary/10 to-transparent px-4 py-3 border-b border-border/50">
        <div className="flex items-center gap-2">
          <Trophy className="w-4 h-4 text-primary" />
          <h3 className="font-semibold text-sm text-foreground">Weekly Leaderboard</h3>
        </div>
      </div>
      <div className="divide-y divide-border/50">
        {entries.map((entry, index) => (
          <div
            key={entry.id}
            className={cn(
              'flex items-center gap-3 px-4 py-3 transition-colors',
              entry.id === currentProfileId && 'bg-primary/5',
              index === 0 && 'bg-gradient-to-r from-yellow-500/10 to-transparent'
            )}
          >
            <div className="w-6 flex justify-center">{getRankIcon(index)}</div>
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-lg">
              {entry.avatar_url || '👧'}
            </div>
            <div className="flex-1 min-w-0">
              <p className={cn(
                'text-sm font-medium truncate',
                entry.id === currentProfileId ? 'text-primary' : 'text-foreground'
              )}>
                {entry.name}
                {entry.id === currentProfileId && <span className="ml-1 text-xs">(You)</span>}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-foreground">🪙 {entry.weekly_earnings}</p>
              <p className="text-[10px] text-muted-foreground">this week</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
