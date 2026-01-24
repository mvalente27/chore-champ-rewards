-- Drop and recreate the function with proper permissions
DROP FUNCTION IF EXISTS public.update_stock_prices();

CREATE OR REPLACE FUNCTION public.update_stock_prices()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  -- Update all stock prices with random fluctuation based on volatility
  UPDATE stocks SET
    previous_price = current_price,
    current_price = GREATEST(1, current_price * (1 + (random() - 0.5) * 2 * volatility))
  WHERE id IS NOT NULL;
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  
  RETURN json_build_object('updated', updated_count);
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.update_stock_prices() TO authenticated;