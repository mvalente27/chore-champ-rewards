-- Fix chore claiming/completing for kids by refining UPDATE RLS policies
-- Existing policy name in schema: "Parents can update any chore, kids can update claimed chores"

DROP POLICY IF EXISTS "Parents can update any chore, kids can update claimed chores" ON public.chores;

-- Parents can update any chore in their household
CREATE POLICY "Parents can update household chores"
ON public.chores
FOR UPDATE
USING (is_parent_of_household(household_id))
WITH CHECK (is_parent_of_household(household_id));

-- Kids can claim an unassigned, available chore (sets assigned_to to themselves)
CREATE POLICY "Kids can claim available chores"
ON public.chores
FOR UPDATE
USING (
  household_id = get_current_household_id()
  AND status = 'available'::chore_status
  AND assigned_to IS NULL
)
WITH CHECK (
  household_id = get_current_household_id()
  AND assigned_to = get_current_profile_id()
  AND status IN ('claimed'::chore_status, 'pending_verification'::chore_status)
);

-- Kids can continue updating chores assigned to themselves (e.g., mark done)
CREATE POLICY "Kids can update their own chores"
ON public.chores
FOR UPDATE
USING (
  household_id = get_current_household_id()
  AND assigned_to = get_current_profile_id()
)
WITH CHECK (
  household_id = get_current_household_id()
  AND assigned_to = get_current_profile_id()
);
