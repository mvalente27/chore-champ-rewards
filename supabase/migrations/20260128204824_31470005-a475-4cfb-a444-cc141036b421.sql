-- Add XP and level columns to profiles
ALTER TABLE public.profiles
ADD COLUMN xp integer NOT NULL DEFAULT 0,
ADD COLUMN level integer NOT NULL DEFAULT 1;

-- Create badges table (master list of all badges)
CREATE TABLE public.badges (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    description text NOT NULL,
    icon text NOT NULL DEFAULT '🏅',
    category text NOT NULL DEFAULT 'general',
    requirement_type text NOT NULL, -- 'chores_completed', 'coins_earned', 'streak_days', 'quiz_correct', 'level_reached'
    requirement_value integer NOT NULL DEFAULT 1,
    xp_reward integer NOT NULL DEFAULT 10,
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create kid_badges junction table for unlocked badges
CREATE TABLE public.kid_badges (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    badge_id uuid NOT NULL REFERENCES public.badges(id) ON DELETE CASCADE,
    unlocked_at timestamp with time zone NOT NULL DEFAULT now(),
    UNIQUE(profile_id, badge_id)
);

-- Enable RLS on both tables
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kid_badges ENABLE ROW LEVEL SECURITY;

-- Badges are viewable by everyone
CREATE POLICY "Badges are viewable by everyone"
ON public.badges FOR SELECT
USING (true);

-- Kids can view their own unlocked badges
CREATE POLICY "Users can view own unlocked badges"
ON public.kid_badges FOR SELECT
USING (profile_id = get_current_profile_id() OR is_parent());

-- System can insert badges when unlocked (via trigger/function)
CREATE POLICY "System can insert kid badges"
ON public.kid_badges FOR INSERT
WITH CHECK (profile_id = get_current_profile_id());

-- Seed initial badges
INSERT INTO public.badges (name, description, icon, category, requirement_type, requirement_value, xp_reward) VALUES
-- Chore badges
('First Steps', 'Complete your first chore', '👟', 'chores', 'chores_completed', 1, 10),
('Helper', 'Complete 5 chores', '🤝', 'chores', 'chores_completed', 5, 25),
('Super Helper', 'Complete 25 chores', '💪', 'chores', 'chores_completed', 25, 50),
('Chore Champion', 'Complete 100 chores', '🏆', 'chores', 'chores_completed', 100, 100),

-- Streak badges
('On a Roll', 'Earn coins 3 days in a row', '🔥', 'streaks', 'streak_days', 3, 15),
('Week Warrior', 'Earn coins 7 days in a row', '⚡', 'streaks', 'streak_days', 7, 35),
('Unstoppable', 'Earn coins 30 days in a row', '🌟', 'streaks', 'streak_days', 30, 150),

-- Savings badges
('Piggy Banker', 'Earn 100 Quest Coins', '🐷', 'savings', 'coins_earned', 100, 20),
('Money Maker', 'Earn 500 Quest Coins', '💰', 'savings', 'coins_earned', 500, 50),
('Coin Collector', 'Earn 1000 Quest Coins', '🪙', 'savings', 'coins_earned', 1000, 100),

-- Quiz badges
('Quiz Whiz', 'Answer 5 quiz questions correctly', '🧠', 'quiz', 'quiz_correct', 5, 20),
('Brain Power', 'Answer 25 quiz questions correctly', '🎓', 'quiz', 'quiz_correct', 25, 50),
('Quiz Master', 'Answer 100 quiz questions correctly', '👨‍🎓', 'quiz', 'quiz_correct', 100, 100),

-- Level badges
('Level Up!', 'Reach level 5', '⬆️', 'levels', 'level_reached', 5, 25),
('Rising Star', 'Reach level 10', '🌠', 'levels', 'level_reached', 10, 50),
('Legend', 'Reach level 25', '👑', 'levels', 'level_reached', 25, 150);

-- Function to calculate level from XP (100 XP per level, with increasing thresholds)
CREATE OR REPLACE FUNCTION public.calculate_level(p_xp integer)
RETURNS integer
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT GREATEST(1, FLOOR(1 + SQRT(p_xp / 50.0))::integer)
$$;

-- Function to calculate XP needed for next level
CREATE OR REPLACE FUNCTION public.xp_for_level(p_level integer)
RETURNS integer
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT (p_level * p_level * 50)::integer
$$;

-- Function to award XP and handle level ups
CREATE OR REPLACE FUNCTION public.award_xp(p_profile_id uuid, p_amount integer)
RETURNS TABLE(new_xp integer, new_level integer, leveled_up boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_old_level integer;
  v_new_xp integer;
  v_new_level integer;
BEGIN
  -- Get current level
  SELECT level INTO v_old_level FROM profiles WHERE id = p_profile_id;
  
  -- Add XP and calculate new level
  UPDATE profiles
  SET xp = xp + p_amount,
      level = calculate_level(xp + p_amount)
  WHERE id = p_profile_id
  RETURNING xp, level INTO v_new_xp, v_new_level;
  
  RETURN QUERY SELECT v_new_xp, v_new_level, (v_new_level > v_old_level);
END;
$$;