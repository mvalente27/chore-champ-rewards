-- =====================================================
-- SECURITY FIX: Add database-level input validation
-- =====================================================

-- 1. Add CHECK constraints for numeric values
ALTER TABLE public.chores 
ADD CONSTRAINT chores_reward_value_valid 
CHECK (reward_value >= 0 AND reward_value <= 10000);

ALTER TABLE public.rewards 
ADD CONSTRAINT rewards_cost_valid 
CHECK (cost >= 0 AND cost <= 100000);

ALTER TABLE public.redemptions 
ADD CONSTRAINT redemptions_cost_valid 
CHECK (cost >= 0 AND cost <= 100000);

ALTER TABLE public.earnings 
ADD CONSTRAINT earnings_amount_valid 
CHECK (amount >= 0 AND amount <= 100000);

-- 2. Add length constraints for text fields
ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_name_length 
CHECK (length(name) >= 1 AND length(name) <= 100);

ALTER TABLE public.chores 
ADD CONSTRAINT chores_title_length 
CHECK (length(title) >= 1 AND length(title) <= 200);

ALTER TABLE public.chores 
ADD CONSTRAINT chores_description_length 
CHECK (description IS NULL OR length(description) <= 1000);

ALTER TABLE public.rewards 
ADD CONSTRAINT rewards_name_length 
CHECK (length(name) >= 1 AND length(name) <= 200);

ALTER TABLE public.households 
ADD CONSTRAINT households_name_length 
CHECK (length(name) >= 1 AND length(name) <= 100);

-- 3. Add INSERT policy for parent_wallets (created via trigger, but explicit policy adds security)
CREATE POLICY "System can create parent wallets"
ON public.parent_wallets FOR INSERT
WITH CHECK (
  profile_id IN (
    SELECT id FROM public.profiles 
    WHERE user_id = auth.uid() AND type = 'parent'
  )
);

-- 4. Add validation for wallet_transactions INSERT
DROP POLICY IF EXISTS "Parents can insert wallet transactions" ON public.wallet_transactions;

CREATE POLICY "Parents can insert valid wallet transactions"
ON public.wallet_transactions FOR INSERT
WITH CHECK (
  wallet_id IN (
    SELECT id FROM parent_wallets 
    WHERE profile_id = get_current_profile_id()
  )
  AND amount > 0 
  AND amount <= 100000
  AND type IN ('deposit', 'transfer_out', 'purchase')
);

-- 5. Add URL validation trigger for avatar_url (basic check)
CREATE OR REPLACE FUNCTION public.validate_avatar_url()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Allow NULL or empty
  IF NEW.avatar_url IS NULL OR NEW.avatar_url = '' THEN
    RETURN NEW;
  END IF;
  
  -- Allow emoji avatars (single character or short strings without /)
  IF length(NEW.avatar_url) <= 10 AND position('/' in NEW.avatar_url) = 0 THEN
    RETURN NEW;
  END IF;
  
  -- For URLs, ensure they start with https://
  IF NEW.avatar_url LIKE 'https://%' THEN
    RETURN NEW;
  END IF;
  
  -- Reject invalid URLs
  RAISE EXCEPTION 'Invalid avatar_url: must be an emoji or HTTPS URL';
END;
$$;

CREATE TRIGGER validate_profile_avatar
BEFORE INSERT OR UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.validate_avatar_url();