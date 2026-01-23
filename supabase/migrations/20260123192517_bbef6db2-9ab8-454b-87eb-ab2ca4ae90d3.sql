-- Create rewards table for the store
CREATE TABLE public.rewards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  household_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  cost NUMERIC NOT NULL DEFAULT 0,
  icon TEXT DEFAULT '🎁',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID
);

-- Create redemptions table to track when kids redeem rewards
CREATE TABLE public.redemptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reward_id UUID NOT NULL REFERENCES public.rewards(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL,
  cost NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'fulfilled', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  fulfilled_at TIMESTAMP WITH TIME ZONE,
  fulfilled_by UUID
);

-- Enable RLS
ALTER TABLE public.rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.redemptions ENABLE ROW LEVEL SECURITY;

-- Rewards policies
CREATE POLICY "Members can view household rewards"
ON public.rewards FOR SELECT
USING (household_id = get_current_household_id());

CREATE POLICY "Parents can create rewards"
ON public.rewards FOR INSERT
WITH CHECK (is_parent_of_household(household_id));

CREATE POLICY "Parents can update rewards"
ON public.rewards FOR UPDATE
USING (is_parent_of_household(household_id));

CREATE POLICY "Parents can delete rewards"
ON public.rewards FOR DELETE
USING (is_parent_of_household(household_id));

-- Redemptions policies
CREATE POLICY "Members can view household redemptions"
ON public.redemptions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.rewards r 
    WHERE r.id = reward_id 
    AND r.household_id = get_current_household_id()
  )
);

CREATE POLICY "Kids can create their own redemptions"
ON public.redemptions FOR INSERT
WITH CHECK (profile_id = get_current_profile_id());

CREATE POLICY "Parents can update redemptions"
ON public.redemptions FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.rewards r 
    WHERE r.id = reward_id 
    AND is_parent_of_household(r.household_id)
  )
);

-- Function to redeem a reward (deducts from total_earnings)
CREATE OR REPLACE FUNCTION public.redeem_reward(
  p_reward_id UUID,
  p_profile_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cost NUMERIC;
  v_current_earnings NUMERIC;
  v_redemption_id UUID;
BEGIN
  -- Get reward cost
  SELECT cost INTO v_cost FROM public.rewards WHERE id = p_reward_id AND is_active = true;
  IF v_cost IS NULL THEN
    RAISE EXCEPTION 'reward_not_found';
  END IF;

  -- Get current earnings
  SELECT total_earnings INTO v_current_earnings FROM public.profiles WHERE id = p_profile_id;
  IF v_current_earnings IS NULL THEN
    RAISE EXCEPTION 'profile_not_found';
  END IF;

  -- Check sufficient funds
  IF v_current_earnings < v_cost THEN
    RAISE EXCEPTION 'insufficient_funds';
  END IF;

  -- Deduct from earnings
  UPDATE public.profiles 
  SET total_earnings = total_earnings - v_cost
  WHERE id = p_profile_id;

  -- Create redemption record
  INSERT INTO public.redemptions (reward_id, profile_id, cost)
  VALUES (p_reward_id, p_profile_id, v_cost)
  RETURNING id INTO v_redemption_id;

  RETURN v_redemption_id;
END;
$$;