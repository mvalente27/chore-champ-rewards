-- Create chore_claims table to track individual kid claims
CREATE TABLE public.chore_claims (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  chore_id UUID NOT NULL REFERENCES public.chores(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'claimed' CHECK (status IN ('claimed', 'pending_verification', 'completed')),
  claimed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  approved_by UUID REFERENCES public.profiles(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.chore_claims ENABLE ROW LEVEL SECURITY;

-- Household members can view claims in their household
CREATE POLICY "Household members can view claims"
ON public.chore_claims
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    JOIN public.chores c ON c.household_id = p.household_id
    WHERE p.user_id = auth.uid() 
    AND c.id = chore_claims.chore_id
  )
);

-- Kids can create their own claims
CREATE POLICY "Kids can create their own claims"
ON public.chore_claims
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid() 
    AND p.id = profile_id
  )
);

-- Kids can update their own claims (to mark as pending_verification)
CREATE POLICY "Kids can update their own claims"
ON public.chore_claims
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid() 
    AND p.id = profile_id
  )
);

-- Parents can update any claim in their household (for approval)
CREATE POLICY "Parents can update claims in household"
ON public.chore_claims
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    JOIN public.chores c ON c.household_id = p.household_id
    WHERE p.user_id = auth.uid() 
    AND p.type = 'parent'
    AND c.id = chore_claims.chore_id
  )
);

-- Create index for faster queries
CREATE INDEX idx_chore_claims_chore_id ON public.chore_claims(chore_id);
CREATE INDEX idx_chore_claims_profile_id ON public.chore_claims(profile_id);
CREATE INDEX idx_chore_claims_status ON public.chore_claims(status);

-- Update chores table: remove status tracking (chores are now always "available" templates)
-- We'll keep the columns for now but they become less relevant
COMMENT ON COLUMN public.chores.status IS 'Deprecated: Use chore_claims table for status tracking';
COMMENT ON COLUMN public.chores.assigned_to IS 'Deprecated: Use chore_claims table for assignments';