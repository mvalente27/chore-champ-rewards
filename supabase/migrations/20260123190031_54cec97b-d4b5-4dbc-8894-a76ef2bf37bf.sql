-- Create a secure helper to create a household + parent profile in one transaction
-- This avoids failing on INSERT ... RETURNING under RLS during signup.

CREATE OR REPLACE FUNCTION public.create_household_with_parent_profile(
  parent_name text,
  household_name text DEFAULT NULL
)
RETURNS TABLE (household_id uuid, profile_id uuid)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_household_id uuid;
  v_profile_id uuid;
  v_household_name text;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  IF parent_name IS NULL OR length(trim(parent_name)) < 2 THEN
    RAISE EXCEPTION 'invalid_parent_name';
  END IF;

  v_household_name := COALESCE(NULLIF(trim(household_name), ''), trim(parent_name) || '''s Family');

  INSERT INTO public.households(name)
  VALUES (v_household_name)
  RETURNING id INTO v_household_id;

  INSERT INTO public.profiles(user_id, household_id, name, type)
  VALUES (auth.uid(), v_household_id, trim(parent_name), 'parent')
  RETURNING id INTO v_profile_id;

  household_id := v_household_id;
  profile_id := v_profile_id;
  RETURN NEXT;
END;
$$;

-- Allow authenticated users to call it
REVOKE ALL ON FUNCTION public.create_household_with_parent_profile(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_household_with_parent_profile(text, text) TO authenticated;
