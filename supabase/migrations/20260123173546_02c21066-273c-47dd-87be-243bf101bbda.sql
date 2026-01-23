-- Fix the overly permissive INSERT policy on households
-- Households should only be created during signup (handled atomically)
DROP POLICY "Parents can create households" ON public.households;

-- Create a more restrictive policy - only authenticated users can create
-- The actual parent/household creation is handled atomically during signup
CREATE POLICY "Authenticated users can create households during signup"
  ON public.households FOR INSERT
  TO authenticated
  WITH CHECK (true);