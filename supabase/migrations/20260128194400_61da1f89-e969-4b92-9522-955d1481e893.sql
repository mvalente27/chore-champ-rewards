-- Create stock price history table
CREATE TABLE public.stock_price_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  stock_id UUID NOT NULL REFERENCES public.stocks(id) ON DELETE CASCADE,
  price NUMERIC NOT NULL,
  recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for efficient queries
CREATE INDEX idx_stock_price_history_stock_id ON public.stock_price_history(stock_id);
CREATE INDEX idx_stock_price_history_recorded_at ON public.stock_price_history(recorded_at DESC);

-- Enable RLS
ALTER TABLE public.stock_price_history ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read price history
CREATE POLICY "Anyone can view stock price history"
ON public.stock_price_history FOR SELECT
TO authenticated
USING (true);

-- Update the update_stock_prices function to also record history
CREATE OR REPLACE FUNCTION public.update_stock_prices()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  updated_count INTEGER;
BEGIN
  -- Record current prices to history before updating
  INSERT INTO stock_price_history (stock_id, price)
  SELECT id, current_price FROM stocks;

  -- Update all stock prices with random fluctuation based on volatility
  UPDATE stocks SET
    previous_price = current_price,
    current_price = GREATEST(1, current_price * (1 + (random() - 0.5) * 2 * volatility))
  WHERE id IS NOT NULL;
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  
  -- Clean up old history (keep last 50 entries per stock)
  DELETE FROM stock_price_history h
  WHERE h.id NOT IN (
    SELECT id FROM (
      SELECT id, ROW_NUMBER() OVER (PARTITION BY stock_id ORDER BY recorded_at DESC) as rn
      FROM stock_price_history
    ) ranked WHERE rn <= 50
  );
  
  RETURN json_build_object('updated', updated_count);
END;
$function$;

-- Seed initial price history for existing stocks (simulate 10 historical points)
DO $$
DECLARE
  stock_rec RECORD;
  i INTEGER;
  sim_price NUMERIC;
BEGIN
  FOR stock_rec IN SELECT id, current_price, volatility FROM stocks LOOP
    sim_price := stock_rec.current_price;
    FOR i IN 1..10 LOOP
      sim_price := GREATEST(1, sim_price * (1 + (random() - 0.5) * 2 * stock_rec.volatility));
      INSERT INTO stock_price_history (stock_id, price, recorded_at)
      VALUES (stock_rec.id, sim_price, now() - (interval '1 hour' * (11 - i)));
    END LOOP;
  END LOOP;
END $$;