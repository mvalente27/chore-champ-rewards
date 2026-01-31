-- Create table to track daily game plays
CREATE TABLE public.game_plays (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  game_type TEXT NOT NULL CHECK (game_type IN ('space_shooter', 'match3', 'endless_runner', 'memory_match')),
  score INTEGER NOT NULL DEFAULT 0,
  coins_earned INTEGER NOT NULL DEFAULT 0,
  played_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.game_plays ENABLE ROW LEVEL SECURITY;

-- Kids can view their own game plays
CREATE POLICY "Users can view their own game plays"
ON public.game_plays
FOR SELECT
USING (profile_id = get_current_profile_id() OR is_parent());

-- Kids can create their own game plays
CREATE POLICY "Users can create their own game plays"
ON public.game_plays
FOR INSERT
WITH CHECK (profile_id = get_current_profile_id());

-- Create indexes for faster queries
CREATE INDEX idx_game_plays_profile_id ON public.game_plays(profile_id);
CREATE INDEX idx_game_plays_played_at ON public.game_plays(played_at);
CREATE INDEX idx_game_plays_game_type ON public.game_plays(game_type);

-- Function to get today's game type based on day of year
CREATE OR REPLACE FUNCTION public.get_daily_game_type()
RETURNS TEXT
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT CASE (EXTRACT(DOY FROM CURRENT_DATE)::INTEGER % 4)
    WHEN 0 THEN 'space_shooter'
    WHEN 1 THEN 'match3'
    WHEN 2 THEN 'endless_runner'
    WHEN 3 THEN 'memory_match'
  END;
$$;

-- Function to check remaining plays for today
CREATE OR REPLACE FUNCTION public.get_remaining_game_plays(p_profile_id UUID)
RETURNS INTEGER
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT GREATEST(0, 5 - COUNT(*)::INTEGER)
  FROM public.game_plays
  WHERE profile_id = p_profile_id
    AND played_at >= CURRENT_DATE
    AND played_at < CURRENT_DATE + INTERVAL '1 day';
$$;

-- Function to record a game play and award coins
CREATE OR REPLACE FUNCTION public.record_game_play(
  p_profile_id UUID,
  p_game_type TEXT,
  p_score INTEGER
)
RETURNS TABLE(coins_earned INTEGER, remaining_plays INTEGER, daily_bonus_earned BOOLEAN)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_remaining INTEGER;
  v_coins INTEGER;
  v_plays_today INTEGER;
  v_daily_bonus BOOLEAN := FALSE;
BEGIN
  -- Check remaining plays
  SELECT get_remaining_game_plays(p_profile_id) INTO v_remaining;
  
  IF v_remaining <= 0 THEN
    RAISE EXCEPTION 'No remaining plays for today';
  END IF;
  
  -- Calculate coins based on score (score-based rewards)
  -- Base: 5 coins + bonus for high scores
  v_coins := CASE
    WHEN p_score >= 1000 THEN 25  -- Gold tier
    WHEN p_score >= 500 THEN 15   -- Silver tier
    WHEN p_score >= 100 THEN 10   -- Bronze tier
    ELSE 5                        -- Participation
  END;
  
  -- Insert the game play
  INSERT INTO public.game_plays (profile_id, game_type, score, coins_earned)
  VALUES (p_profile_id, p_game_type, p_score, v_coins);
  
  -- Check if this completes all 5 plays for the day (daily bonus)
  SELECT COUNT(*) INTO v_plays_today
  FROM public.game_plays
  WHERE profile_id = p_profile_id
    AND played_at >= CURRENT_DATE
    AND played_at < CURRENT_DATE + INTERVAL '1 day';
  
  IF v_plays_today = 5 THEN
    v_daily_bonus := TRUE;
    v_coins := v_coins + 25; -- Daily bonus
  END IF;
  
  -- Award coins to the kid
  UPDATE public.profiles
  SET total_earnings = total_earnings + v_coins
  WHERE id = p_profile_id;
  
  coins_earned := v_coins;
  remaining_plays := 5 - v_plays_today;
  daily_bonus_earned := v_daily_bonus;
  
  RETURN NEXT;
END;
$$;