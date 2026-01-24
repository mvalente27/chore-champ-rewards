-- Fix earnings INSERT policy to allow parents to create earnings for kids in their household

DROP POLICY IF EXISTS "System creates earnings on chore completion" ON public.earnings;

-- Kids can create their own earnings (for auto-credit scenarios)
CREATE POLICY "Users can create own earnings"
ON public.earnings
FOR INSERT
WITH CHECK (profile_id = get_current_profile_id());

-- Parents can create earnings for any kid in their household
CREATE POLICY "Parents can create earnings for household members"
ON public.earnings
FOR INSERT
WITH CHECK (
  is_parent() AND 
  profile_id IN (
    SELECT id FROM public.profiles 
    WHERE household_id = get_current_household_id()
  )
);