-- Create trigger to update total_earnings when earnings status changes to 'approved'
CREATE OR REPLACE FUNCTION public.update_total_earnings()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- When an earning is updated to 'approved' status
  IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
    UPDATE public.profiles 
    SET total_earnings = total_earnings + NEW.amount,
        updated_at = now()
    WHERE id = NEW.profile_id;
  END IF;
  RETURN NEW;
END;
$function$;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_earning_approved ON public.earnings;

-- Create the trigger
CREATE TRIGGER on_earning_approved
AFTER INSERT OR UPDATE ON public.earnings
FOR EACH ROW
EXECUTE FUNCTION public.update_total_earnings();