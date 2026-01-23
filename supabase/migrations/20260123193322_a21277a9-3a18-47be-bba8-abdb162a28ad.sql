-- Allow parents to create kid profiles in their household
CREATE POLICY "Parents can create kid profiles"
ON public.profiles FOR INSERT
WITH CHECK (
  -- Either user is creating their own profile (signup)
  user_id = auth.uid()
  OR
  -- Or parent is creating a kid profile (user_id is null for kids)
  (user_id IS NULL AND type = 'kid' AND is_parent_of_household(household_id))
);