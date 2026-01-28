-- Fix search_path for calculate_level function
CREATE OR REPLACE FUNCTION public.calculate_level(p_xp integer)
RETURNS integer
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT GREATEST(1, FLOOR(1 + SQRT(p_xp / 50.0))::integer)
$$;

-- Fix search_path for xp_for_level function
CREATE OR REPLACE FUNCTION public.xp_for_level(p_level integer)
RETURNS integer
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT (p_level * p_level * 50)::integer
$$;