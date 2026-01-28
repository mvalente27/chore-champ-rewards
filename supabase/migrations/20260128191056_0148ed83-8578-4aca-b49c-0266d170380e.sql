-- Add birth_date column to profiles for age-based content tiers
ALTER TABLE public.profiles 
ADD COLUMN birth_date date;

-- Add computed age tier function for easy querying
CREATE OR REPLACE FUNCTION public.get_age_tier(p_birth_date date)
RETURNS text
LANGUAGE sql
IMMUTABLE
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

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.birth_date IS 'Used to determine age tier for content: explorer (5-8), builder (9-12), achiever (13-18)';