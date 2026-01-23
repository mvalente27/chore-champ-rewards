-- =============================================
-- ChoreQuest Database Schema
-- =============================================

-- 1. HOUSEHOLDS TABLE
CREATE TABLE public.households (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.households ENABLE ROW LEVEL SECURITY;

-- 2. PROFILES TABLE (Parent/Kid distinction)
CREATE TYPE public.profile_type AS ENUM ('parent', 'kid');

CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type public.profile_type NOT NULL DEFAULT 'kid',
  avatar_url TEXT,
  total_earnings DECIMAL(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. CHORES TABLE
CREATE TYPE public.chore_status AS ENUM ('available', 'claimed', 'pending_verification', 'completed');

CREATE TABLE public.chores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  reward_value DECIMAL(10,2) NOT NULL DEFAULT 0,
  icon TEXT DEFAULT 'star',
  status public.chore_status NOT NULL DEFAULT 'available',
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE public.chores ENABLE ROW LEVEL SECURITY;

-- 4. EARNINGS/TRANSACTIONS TABLE
CREATE TYPE public.earning_status AS ENUM ('pending', 'approved', 'rejected');

CREATE TABLE public.earnings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  chore_id UUID REFERENCES public.chores(id) ON DELETE SET NULL,
  amount DECIMAL(10,2) NOT NULL,
  status public.earning_status NOT NULL DEFAULT 'pending',
  approved_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  approved_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE public.earnings ENABLE ROW LEVEL SECURITY;

-- =============================================
-- HELPER FUNCTIONS (SECURITY DEFINER)
-- =============================================

-- Get current user's profile
CREATE OR REPLACE FUNCTION public.get_current_profile()
RETURNS public.profiles
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM public.profiles WHERE user_id = auth.uid() LIMIT 1;
$$;

-- Get current user's household ID
CREATE OR REPLACE FUNCTION public.get_current_household_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT household_id FROM public.profiles WHERE user_id = auth.uid() LIMIT 1;
$$;

-- Get current user's profile ID
CREATE OR REPLACE FUNCTION public.get_current_profile_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.profiles WHERE user_id = auth.uid() LIMIT 1;
$$;

-- Check if current user is a parent in their household
CREATE OR REPLACE FUNCTION public.is_parent()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND type = 'parent'
  );
$$;

-- Check if current user is a parent in a specific household
CREATE OR REPLACE FUNCTION public.is_parent_of_household(_household_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
      AND household_id = _household_id 
      AND type = 'parent'
  );
$$;

-- Check if current user belongs to a household
CREATE OR REPLACE FUNCTION public.is_member_of_household(_household_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
      AND household_id = _household_id
  );
$$;

-- =============================================
-- RLS POLICIES
-- =============================================

-- HOUSEHOLDS POLICIES
CREATE POLICY "Members can view their household"
  ON public.households FOR SELECT
  USING (public.is_member_of_household(id));

CREATE POLICY "Parents can create households"
  ON public.households FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Parents can update their household"
  ON public.households FOR UPDATE
  USING (public.is_parent_of_household(id));

CREATE POLICY "Parents can delete their household"
  ON public.households FOR DELETE
  USING (public.is_parent_of_household(id));

-- PROFILES POLICIES
CREATE POLICY "Members can view household profiles"
  ON public.profiles FOR SELECT
  USING (household_id = public.get_current_household_id());

CREATE POLICY "Users can create their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own profile or parents can update kids"
  ON public.profiles FOR UPDATE
  USING (
    user_id = auth.uid() 
    OR (public.is_parent() AND household_id = public.get_current_household_id())
  );

-- CHORES POLICIES
CREATE POLICY "Members can view household chores"
  ON public.chores FOR SELECT
  USING (household_id = public.get_current_household_id());

CREATE POLICY "Parents can create chores"
  ON public.chores FOR INSERT
  WITH CHECK (public.is_parent_of_household(household_id));

CREATE POLICY "Parents can update any chore, kids can update claimed chores"
  ON public.chores FOR UPDATE
  USING (
    public.is_parent_of_household(household_id)
    OR (assigned_to = public.get_current_profile_id())
  );

CREATE POLICY "Parents can delete chores"
  ON public.chores FOR DELETE
  USING (public.is_parent_of_household(household_id));

-- EARNINGS POLICIES
CREATE POLICY "Users can view their own earnings or parents can view all"
  ON public.earnings FOR SELECT
  USING (
    profile_id = public.get_current_profile_id()
    OR public.is_parent()
  );

CREATE POLICY "System creates earnings on chore completion"
  ON public.earnings FOR INSERT
  WITH CHECK (profile_id = public.get_current_profile_id());

CREATE POLICY "Parents can update earnings status"
  ON public.earnings FOR UPDATE
  USING (public.is_parent());

-- =============================================
-- TRIGGERS
-- =============================================

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Update total earnings when earning is approved
CREATE OR REPLACE FUNCTION public.update_total_earnings()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
    UPDATE public.profiles 
    SET total_earnings = total_earnings + NEW.amount
    WHERE id = NEW.profile_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_earning_approved
  AFTER UPDATE ON public.earnings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_total_earnings();