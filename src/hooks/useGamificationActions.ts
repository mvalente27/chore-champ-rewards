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

interface SkillEffects {
  xpMultiplier: number;
  coinMultiplier: number;
  streakShield: boolean;
  bonusQuizPoints: number;
}

// Base XP rewards for different actions
const XP_REWARDS = {
  CHORE_COMPLETED: 15,
  QUIZ_CORRECT: 10,
  STREAK_BONUS: 5, // per day of streak
};

// Fetch active skill effects for a profile
async function getActiveSkillEffects(profileId: string): Promise<SkillEffects> {
  const effects: SkillEffects = {
    xpMultiplier: 1,
    coinMultiplier: 1,
    streakShield: false,
    bonusQuizPoints: 0,
  };

  try {
    const { data: kidSkills, error } = await supabase
      .from('kid_skills')
      .select(`
        skill_id,
        is_active,
        skills (
          effect_type,
          effect_value
        )
      `)
      .eq('profile_id', profileId)
      .eq('is_active', true);

    if (error || !kidSkills) return effects;

    for (const ks of kidSkills) {
      const skill = ks.skills as unknown as { effect_type: string; effect_value: number } | null;
      if (!skill) continue;

      switch (skill.effect_type) {
        case 'xp_multiplier':
          effects.xpMultiplier = Math.max(effects.xpMultiplier, skill.effect_value);
          break;
        case 'coin_bonus':
          effects.coinMultiplier = Math.max(effects.coinMultiplier, skill.effect_value);
          break;
        case 'streak_shield':
          effects.streakShield = true;
          break;
        case 'quiz_bonus':
          effects.bonusQuizPoints = Math.max(effects.bonusQuizPoints, skill.effect_value);
          break;
      }
    }
  } catch (err) {
    console.error('Error fetching skill effects:', err);
  }

  return effects;
}

export async function awardXPForChore(profileId: string): Promise<GamificationResult> {
  // Get active skill effects
  const skillEffects = await getActiveSkillEffects(profileId);
  const boostedXP = Math.round(XP_REWARDS.CHORE_COMPLETED * skillEffects.xpMultiplier);

  const result: GamificationResult = {
    xpAwarded: boostedXP,
    xpResult: null,
    unlockedBadges: [],
    error: null,
  };

  try {
    // Award XP using the database function (with multiplier applied)
    const { data: xpData, error: xpError } = await supabase
      .rpc('award_xp', {
        p_profile_id: profileId,
        p_amount: boostedXP,
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
  try {
    const { data, error } = await supabase.rpc('check_and_unlock_badges', {
      p_profile_id: profileId,
    });

    if (error) throw error;

    return (data || []).map((badge: { badge_id: string; badge_name: string; badge_icon: string; xp_reward: number }) => ({
      badgeId: badge.badge_id,
      badgeName: badge.badge_name,
      badgeIcon: badge.badge_icon,
      xpReward: badge.xp_reward,
    }));
  } catch (err) {
    console.error('Error checking badges:', err);
    return [];
  }
}

export async function awardXPForQuiz(profileId: string, isCorrect: boolean): Promise<GamificationResult> {
  // Get active skill effects
  const skillEffects = await getActiveSkillEffects(profileId);
  const baseXP = isCorrect ? XP_REWARDS.QUIZ_CORRECT + skillEffects.bonusQuizPoints : 0;
  const boostedXP = Math.round(baseXP * skillEffects.xpMultiplier);

  const result: GamificationResult = {
    xpAwarded: boostedXP,
    xpResult: null,
    unlockedBadges: [],
    error: null,
  };

  if (!isCorrect) return result;

  try {
    const { data: xpData, error: xpError } = await supabase
      .rpc('award_xp', {
        p_profile_id: profileId,
        p_amount: boostedXP,
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

// Export skill effects getter for use in other components
export { getActiveSkillEffects };
export type { SkillEffects, GamificationResult, BadgeUnlock };
