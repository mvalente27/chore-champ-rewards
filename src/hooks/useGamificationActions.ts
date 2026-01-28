import { supabase } from '@/integrations/supabase/client';

interface XPResult {
  new_xp: number;
  new_level: number;
  leveled_up: boolean;
}

interface BadgeUnlock {
  badgeId: string;
  badgeName: string;
  badgeIcon: string;
  xpReward: number;
}

interface GamificationResult {
  xpAwarded: number;
  xpResult: XPResult | null;
  unlockedBadges: BadgeUnlock[];
  error: string | null;
}

// Base XP rewards for different actions
const XP_REWARDS = {
  CHORE_COMPLETED: 15,
  QUIZ_CORRECT: 10,
  STREAK_BONUS: 5, // per day of streak
};

export async function awardXPForChore(profileId: string): Promise<GamificationResult> {
  const result: GamificationResult = {
    xpAwarded: XP_REWARDS.CHORE_COMPLETED,
    xpResult: null,
    unlockedBadges: [],
    error: null,
  };

  try {
    // Award XP using the database function
    const { data: xpData, error: xpError } = await supabase
      .rpc('award_xp', {
        p_profile_id: profileId,
        p_amount: XP_REWARDS.CHORE_COMPLETED,
      });

    if (xpError) throw xpError;
    
    if (xpData && xpData.length > 0) {
      result.xpResult = xpData[0];
    }

    // Check for badge unlocks after XP award
    const unlockedBadges = await checkAndUnlockBadges(profileId);
    result.unlockedBadges = unlockedBadges;

    return result;
  } catch (err) {
    console.error('Error awarding XP:', err);
    result.error = err instanceof Error ? err.message : 'Unknown error';
    return result;
  }
}

export async function checkAndUnlockBadges(profileId: string): Promise<BadgeUnlock[]> {
  const unlockedBadges: BadgeUnlock[] = [];

  try {
    // Get current profile stats
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('level, total_earnings, xp')
      .eq('id', profileId)
      .single();

    if (profileError) throw profileError;

    // Count completed chores for this profile
    const { count: choresCompleted, error: choresError } = await supabase
      .from('earnings')
      .select('*', { count: 'exact', head: true })
      .eq('profile_id', profileId)
      .eq('status', 'approved');

    if (choresError) throw choresError;

    // Count correct quiz answers
    const { count: quizCorrect, error: quizError } = await supabase
      .from('quiz_attempts')
      .select('*', { count: 'exact', head: true })
      .eq('profile_id', profileId)
      .eq('is_correct', true);

    if (quizError) throw quizError;

    // Calculate current streak (simplified - would need proper streak tracking)
    const streakDays = await calculateStreak(profileId);

    // Get all badges and which ones the user already has
    const [allBadgesRes, unlockedBadgesRes] = await Promise.all([
      supabase.from('badges').select('*'),
      supabase.from('kid_badges').select('badge_id').eq('profile_id', profileId),
    ]);

    if (allBadgesRes.error) throw allBadgesRes.error;
    if (unlockedBadgesRes.error) throw unlockedBadgesRes.error;

    const alreadyUnlocked = new Set(unlockedBadgesRes.data?.map(b => b.badge_id) || []);
    const allBadges = allBadgesRes.data || [];

    // Check each badge
    for (const badge of allBadges) {
      if (alreadyUnlocked.has(badge.id)) continue;

      let shouldUnlock = false;

      switch (badge.requirement_type) {
        case 'chores_completed':
          shouldUnlock = (choresCompleted || 0) >= badge.requirement_value;
          break;
        case 'coins_earned':
          shouldUnlock = (profile?.total_earnings || 0) >= badge.requirement_value;
          break;
        case 'level_reached':
          shouldUnlock = (profile?.level || 1) >= badge.requirement_value;
          break;
        case 'quiz_correct':
          shouldUnlock = (quizCorrect || 0) >= badge.requirement_value;
          break;
        case 'streak_days':
          shouldUnlock = streakDays >= badge.requirement_value;
          break;
      }

      if (shouldUnlock) {
        // Unlock the badge
        const { error: unlockError } = await supabase
          .from('kid_badges')
          .insert({
            profile_id: profileId,
            badge_id: badge.id,
          });

        if (!unlockError) {
          unlockedBadges.push({
            badgeId: badge.id,
            badgeName: badge.name,
            badgeIcon: badge.icon,
            xpReward: badge.xp_reward,
          });

          // Award bonus XP for badge unlock
          if (badge.xp_reward > 0) {
            await supabase.rpc('award_xp', {
              p_profile_id: profileId,
              p_amount: badge.xp_reward,
            });
          }
        }
      }
    }

    return unlockedBadges;
  } catch (err) {
    console.error('Error checking badges:', err);
    return [];
  }
}

async function calculateStreak(profileId: string): Promise<number> {
  try {
    // Get earnings ordered by date
    const { data: earnings, error } = await supabase
      .from('earnings')
      .select('approved_at')
      .eq('profile_id', profileId)
      .eq('status', 'approved')
      .not('approved_at', 'is', null)
      .order('approved_at', { ascending: false });

    if (error || !earnings || earnings.length === 0) return 0;

    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Get unique dates
    const uniqueDates = new Set<string>();
    earnings.forEach(e => {
      if (e.approved_at) {
        const date = new Date(e.approved_at);
        date.setHours(0, 0, 0, 0);
        uniqueDates.add(date.toISOString());
      }
    });

    const sortedDates = Array.from(uniqueDates).sort().reverse();
    
    for (let i = 0; i < sortedDates.length; i++) {
      const expectedDate = new Date(today);
      expectedDate.setDate(expectedDate.getDate() - i);
      expectedDate.setHours(0, 0, 0, 0);
      
      const currentDate = new Date(sortedDates[i]);
      
      if (currentDate.getTime() === expectedDate.getTime()) {
        streak++;
      } else if (i === 0 && currentDate.getTime() === new Date(today.getTime() - 86400000).getTime()) {
        // Allow starting from yesterday
        streak++;
      } else {
        break;
      }
    }

    return streak;
  } catch (err) {
    console.error('Error calculating streak:', err);
    return 0;
  }
}

export async function awardXPForQuiz(profileId: string, isCorrect: boolean): Promise<GamificationResult> {
  const result: GamificationResult = {
    xpAwarded: isCorrect ? XP_REWARDS.QUIZ_CORRECT : 0,
    xpResult: null,
    unlockedBadges: [],
    error: null,
  };

  if (!isCorrect) return result;

  try {
    const { data: xpData, error: xpError } = await supabase
      .rpc('award_xp', {
        p_profile_id: profileId,
        p_amount: XP_REWARDS.QUIZ_CORRECT,
      });

    if (xpError) throw xpError;
    
    if (xpData && xpData.length > 0) {
      result.xpResult = xpData[0];
    }

    // Check for badge unlocks
    const unlockedBadges = await checkAndUnlockBadges(profileId);
    result.unlockedBadges = unlockedBadges;

    return result;
  } catch (err) {
    console.error('Error awarding quiz XP:', err);
    result.error = err instanceof Error ? err.message : 'Unknown error';
    return result;
  }
}
