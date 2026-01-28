import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  requirement_type: string;
  requirement_value: number;
  xp_reward: number;
}

interface UnlockedBadge extends Badge {
  unlocked_at: string;
}

interface GamificationData {
  xp: number;
  level: number;
  xpForCurrentLevel: number;
  xpForNextLevel: number;
  xpProgress: number;
  allBadges: Badge[];
  unlockedBadges: UnlockedBadge[];
  isLoading: boolean;
}

export function useGamification(profileId: string | undefined): GamificationData {
  const [xp, setXp] = useState(0);
  const [level, setLevel] = useState(1);
  const [allBadges, setAllBadges] = useState<Badge[]>([]);
  const [unlockedBadges, setUnlockedBadges] = useState<UnlockedBadge[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!profileId) {
      setIsLoading(false);
      return;
    }

    const fetchGamificationData = async () => {
      setIsLoading(true);
      try {
        // Fetch profile XP and level
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('xp, level')
          .eq('id', profileId)
          .single();

        if (profileError) throw profileError;

        setXp(profileData?.xp ?? 0);
        setLevel(profileData?.level ?? 1);

        // Fetch all badges
        const { data: badgesData, error: badgesError } = await supabase
          .from('badges')
          .select('*')
          .order('requirement_value', { ascending: true });

        if (badgesError) throw badgesError;
        setAllBadges(badgesData || []);

        // Fetch unlocked badges for this profile
        const { data: unlockedData, error: unlockedError } = await supabase
          .from('kid_badges')
          .select('unlocked_at, badge_id, badges(*)')
          .eq('profile_id', profileId);

        if (unlockedError) throw unlockedError;

        const unlocked = (unlockedData || []).map((kb) => ({
          ...(kb.badges as unknown as Badge),
          unlocked_at: kb.unlocked_at,
        }));
        setUnlockedBadges(unlocked);
      } catch (err) {
        console.error('Error fetching gamification data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchGamificationData();
  }, [profileId]);

  // Calculate XP progress
  const xpForCurrentLevel = level * level * 50;
  const xpForNextLevel = (level + 1) * (level + 1) * 50;
  const xpInCurrentLevel = xp - (level > 1 ? (level - 1) * (level - 1) * 50 : 0);
  const xpNeededForLevel = xpForNextLevel - xpForCurrentLevel;
  const xpProgress = Math.min(100, Math.max(0, (xpInCurrentLevel / xpNeededForLevel) * 100));

  return {
    xp,
    level,
    xpForCurrentLevel,
    xpForNextLevel,
    xpProgress,
    allBadges,
    unlockedBadges,
    isLoading,
  };
}
