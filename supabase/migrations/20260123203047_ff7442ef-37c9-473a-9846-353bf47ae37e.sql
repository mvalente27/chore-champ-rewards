-- Parent Wallets: stores parent's loaded balance
CREATE TABLE public.parent_wallets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  balance NUMERIC NOT NULL DEFAULT 0 CHECK (balance >= 0),
  stripe_customer_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Wallet Transactions: tracks all money movements (loads, transfers)
CREATE TABLE public.wallet_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_id UUID NOT NULL REFERENCES public.parent_wallets(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('load', 'transfer_out', 'chore_payout')),
  amount NUMERIC NOT NULL,
  stripe_payment_intent_id TEXT,
  recipient_profile_id UUID REFERENCES public.profiles(id),
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Savings Goals: kids can set savings targets
CREATE TABLE public.savings_goals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  target_amount NUMERIC NOT NULL CHECK (target_amount > 0),
  current_amount NUMERIC NOT NULL DEFAULT 0 CHECK (current_amount >= 0),
  icon TEXT DEFAULT '🎯',
  is_completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Investments: simulated/themed stock picks for kids
CREATE TABLE public.investments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  stock_symbol TEXT NOT NULL,
  stock_name TEXT NOT NULL,
  theme TEXT, -- e.g., 'dinosaur', 'space', 'gaming'
  shares NUMERIC NOT NULL CHECK (shares > 0),
  purchase_price NUMERIC NOT NULL,
  current_price NUMERIC NOT NULL,
  purchased_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.parent_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.savings_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investments ENABLE ROW LEVEL SECURITY;

-- Parent Wallets RLS: Only the parent can see/manage their wallet
CREATE POLICY "Parents can view own wallet"
  ON public.parent_wallets FOR SELECT
  USING (profile_id = public.get_current_profile_id());

CREATE POLICY "Parents can update own wallet"
  ON public.parent_wallets FOR UPDATE
  USING (profile_id = public.get_current_profile_id());

-- Wallet Transactions RLS: Parents see their wallet transactions
CREATE POLICY "Parents can view own wallet transactions"
  ON public.wallet_transactions FOR SELECT
  USING (wallet_id IN (SELECT id FROM public.parent_wallets WHERE profile_id = public.get_current_profile_id()));

CREATE POLICY "Parents can insert wallet transactions"
  ON public.wallet_transactions FOR INSERT
  WITH CHECK (wallet_id IN (SELECT id FROM public.parent_wallets WHERE profile_id = public.get_current_profile_id()));

-- Savings Goals RLS: Users can manage their own goals, parents can see kids' goals
CREATE POLICY "Users can view own savings goals"
  ON public.savings_goals FOR SELECT
  USING (profile_id = public.get_current_profile_id());

CREATE POLICY "Parents can view household kids savings goals"
  ON public.savings_goals FOR SELECT
  USING (
    public.is_parent() AND
    profile_id IN (
      SELECT id FROM public.profiles 
      WHERE household_id = public.get_current_household_id()
    )
  );

CREATE POLICY "Users can create own savings goals"
  ON public.savings_goals FOR INSERT
  WITH CHECK (profile_id = public.get_current_profile_id());

CREATE POLICY "Users can update own savings goals"
  ON public.savings_goals FOR UPDATE
  USING (profile_id = public.get_current_profile_id());

CREATE POLICY "Users can delete own savings goals"
  ON public.savings_goals FOR DELETE
  USING (profile_id = public.get_current_profile_id());

-- Investments RLS: Users can manage their own investments, parents can see kids' investments
CREATE POLICY "Users can view own investments"
  ON public.investments FOR SELECT
  USING (profile_id = public.get_current_profile_id());

CREATE POLICY "Parents can view household kids investments"
  ON public.investments FOR SELECT
  USING (
    public.is_parent() AND
    profile_id IN (
      SELECT id FROM public.profiles 
      WHERE household_id = public.get_current_household_id()
    )
  );

CREATE POLICY "Users can create own investments"
  ON public.investments FOR INSERT
  WITH CHECK (profile_id = public.get_current_profile_id());

CREATE POLICY "Users can update own investments"
  ON public.investments FOR UPDATE
  USING (profile_id = public.get_current_profile_id());

-- Triggers for updated_at
CREATE TRIGGER update_parent_wallets_updated_at
  BEFORE UPDATE ON public.parent_wallets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to auto-create wallet for parents on profile creation
CREATE OR REPLACE FUNCTION public.create_parent_wallet()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.type = 'parent' THEN
    INSERT INTO public.parent_wallets (profile_id)
    VALUES (NEW.id)
    ON CONFLICT (profile_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER create_wallet_for_parent
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.create_parent_wallet();

-- Function to transfer funds from parent wallet to kid
CREATE OR REPLACE FUNCTION public.transfer_to_kid(
  p_kid_profile_id UUID,
  p_amount NUMERIC,
  p_description TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_wallet_id UUID;
  v_current_balance NUMERIC;
  v_transaction_id UUID;
  v_parent_household_id UUID;
  v_kid_household_id UUID;
BEGIN
  -- Get parent's wallet
  SELECT pw.id, pw.balance, p.household_id 
  INTO v_wallet_id, v_current_balance, v_parent_household_id
  FROM public.parent_wallets pw
  JOIN public.profiles p ON p.id = pw.profile_id
  WHERE p.user_id = auth.uid() AND p.type = 'parent';
  
  IF v_wallet_id IS NULL THEN
    RAISE EXCEPTION 'parent_wallet_not_found';
  END IF;

  -- Verify kid is in same household
  SELECT household_id INTO v_kid_household_id
  FROM public.profiles
  WHERE id = p_kid_profile_id AND type = 'kid';
  
  IF v_kid_household_id IS NULL OR v_kid_household_id != v_parent_household_id THEN
    RAISE EXCEPTION 'invalid_kid_profile';
  END IF;

  -- Check sufficient balance
  IF v_current_balance < p_amount THEN
    RAISE EXCEPTION 'insufficient_balance';
  END IF;

  -- Deduct from wallet
  UPDATE public.parent_wallets
  SET balance = balance - p_amount
  WHERE id = v_wallet_id;

  -- Add to kid's earnings
  UPDATE public.profiles
  SET total_earnings = total_earnings + p_amount
  WHERE id = p_kid_profile_id;

  -- Record transaction
  INSERT INTO public.wallet_transactions (wallet_id, type, amount, recipient_profile_id, description)
  VALUES (v_wallet_id, 'transfer_out', p_amount, p_kid_profile_id, COALESCE(p_description, 'Transfer to kid'))
  RETURNING id INTO v_transaction_id;

  RETURN v_transaction_id;
END;
$$;