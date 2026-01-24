-- Add purchasable reward fields
ALTER TABLE public.rewards
ADD COLUMN is_purchasable boolean NOT NULL DEFAULT false,
ADD COLUMN purchase_url text,
ADD COLUMN purchase_price numeric;

-- Create simple function for parents to award coins to kids
CREATE OR REPLACE FUNCTION public.award_coins_to_kid(
  p_kid_profile_id uuid,
  p_amount numeric,
  p_description text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_household_id uuid;
  v_kid_household_id uuid;
BEGIN
  -- Verify caller is a parent
  IF NOT is_parent() THEN
    RAISE EXCEPTION 'Only parents can award coins';
  END IF;

  -- Get caller's household
  SELECT household_id INTO v_household_id
  FROM profiles
  WHERE user_id = auth.uid();

  -- Verify kid is in same household
  SELECT household_id INTO v_kid_household_id
  FROM profiles
  WHERE id = p_kid_profile_id AND type = 'kid';

  IF v_kid_household_id IS NULL OR v_kid_household_id != v_household_id THEN
    RAISE EXCEPTION 'Kid not found in your household';
  END IF;

  -- Validate amount
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Amount must be positive';
  END IF;

  -- Add coins to kid's balance
  UPDATE profiles
  SET total_earnings = total_earnings + p_amount,
      updated_at = now()
  WHERE id = p_kid_profile_id;
END;
$$;