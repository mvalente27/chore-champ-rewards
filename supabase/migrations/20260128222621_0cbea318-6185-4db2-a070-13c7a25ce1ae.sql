-- Create skills table for the skill tree system
CREATE TABLE public.skills (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT NOT NULL DEFAULT '⚡',
  category TEXT NOT NULL DEFAULT 'general',
  cost INTEGER NOT NULL DEFAULT 50,
  effect_type TEXT NOT NULL, -- 'xp_multiplier', 'coin_bonus', 'streak_shield', 'badge_boost'
  effect_value NUMERIC NOT NULL DEFAULT 1.0,
  unlock_level INTEGER NOT NULL DEFAULT 1,
  prerequisite_skill_id UUID REFERENCES public.skills(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create kid_skills junction table for tracking unlocked skills
CREATE TABLE public.kid_skills (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  skill_id UUID NOT NULL REFERENCES public.skills(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT true,
  UNIQUE(profile_id, skill_id)
);

-- Enable RLS
ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kid_skills ENABLE ROW LEVEL SECURITY;

-- Skills are readable by all authenticated users
CREATE POLICY "Skills are viewable by all authenticated users"
ON public.skills FOR SELECT
TO authenticated
USING (true);

-- Kid skills readable by household members
CREATE POLICY "Kid skills viewable by household members"
ON public.kid_skills FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p1
    JOIN public.profiles p2 ON p1.household_id = p2.household_id
    WHERE p1.user_id = auth.uid()
    AND p2.id = profile_id
  )
);

-- Kids can unlock their own skills
CREATE POLICY "Kids can unlock their own skills"
ON public.kid_skills FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = profile_id
    AND user_id = auth.uid()
  )
);

-- Kids can toggle their own skills
CREATE POLICY "Kids can update their own skills"
ON public.kid_skills FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = profile_id
    AND user_id = auth.uid()
  )
);

-- Insert initial skills
INSERT INTO public.skills (name, description, icon, category, cost, effect_type, effect_value, unlock_level) VALUES
  ('XP Boost', 'Earn 10% more XP from chores', '⚡', 'xp', 50, 'xp_multiplier', 1.1, 1),
  ('XP Master', 'Earn 25% more XP from chores', '🔥', 'xp', 150, 'xp_multiplier', 1.25, 5),
  ('Coin Collector', 'Earn 5% bonus coins from chores', '🪙', 'coins', 75, 'coin_bonus', 1.05, 3),
  ('Money Maker', 'Earn 15% bonus coins from chores', '💰', 'coins', 200, 'coin_bonus', 1.15, 10),
  ('Streak Shield', 'Protects your streak for 1 missed day', '🛡️', 'streak', 100, 'streak_shield', 1, 5),
  ('Quiz Wizard', 'Earn 20% more from quiz answers', '🧙', 'quiz', 125, 'quiz_bonus', 1.2, 7),
  ('Early Bird', 'Bonus XP for morning chores', '🌅', 'special', 80, 'morning_bonus', 1.5, 4),
  ('Night Owl', 'Bonus XP for evening chores', '🌙', 'special', 80, 'evening_bonus', 1.5, 4);