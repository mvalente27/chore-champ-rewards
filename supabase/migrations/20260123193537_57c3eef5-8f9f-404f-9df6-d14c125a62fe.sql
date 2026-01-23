-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Users can create their own profile" ON public.profiles;

-- The new policy "Parents can create kid profiles" already allows both cases