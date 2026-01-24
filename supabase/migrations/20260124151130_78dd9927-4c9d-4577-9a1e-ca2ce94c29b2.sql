-- Fix the overly permissive INSERT policy on households
-- This was needed for signup, but we should restrict it to authenticated users only
DROP POLICY IF EXISTS "Authenticated users can create households during signup" ON public.households;

CREATE POLICY "Authenticated users can create households during signup"
ON public.households FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);