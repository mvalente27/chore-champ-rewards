-- Fix search_path for get_age_tier function
CREATE OR REPLACE FUNCTION public.get_age_tier(p_birth_date date)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path TO 'public'
AS $$
  SELECT CASE
    WHEN p_birth_date IS NULL THEN NULL
    WHEN EXTRACT(YEAR FROM age(current_date, p_birth_date)) BETWEEN 5 AND 8 THEN 'explorer'
    WHEN EXTRACT(YEAR FROM age(current_date, p_birth_date)) BETWEEN 9 AND 12 THEN 'builder'
    WHEN EXTRACT(YEAR FROM age(current_date, p_birth_date)) BETWEEN 13 AND 18 THEN 'achiever'
    WHEN EXTRACT(YEAR FROM age(current_date, p_birth_date)) < 5 THEN 'explorer'
    ELSE 'achiever'
  END;
$$;