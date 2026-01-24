-- Create stocks table for the Stock Market game
CREATE TABLE public.stocks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  symbol TEXT NOT NULL UNIQUE,
  description TEXT,
  current_price NUMERIC NOT NULL DEFAULT 10,
  previous_price NUMERIC NOT NULL DEFAULT 10,
  emoji TEXT NOT NULL DEFAULT '📈',
  volatility NUMERIC NOT NULL DEFAULT 0.1, -- How much the price can change
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create kid stock holdings
CREATE TABLE public.kid_stocks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  stock_id UUID NOT NULL REFERENCES public.stocks(id) ON DELETE CASCADE,
  shares INTEGER NOT NULL DEFAULT 0,
  total_invested NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(profile_id, stock_id)
);

-- Create businesses table for Entrepreneur Quest
CREATE TABLE public.businesses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  emoji TEXT NOT NULL DEFAULT '🏪',
  base_cost INTEGER NOT NULL DEFAULT 100,
  base_income INTEGER NOT NULL DEFAULT 10, -- coins per day
  unlock_level INTEGER NOT NULL DEFAULT 1,
  category TEXT NOT NULL DEFAULT 'starter',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create kid businesses (owned businesses)
CREATE TABLE public.kid_businesses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  level INTEGER NOT NULL DEFAULT 1,
  total_earned NUMERIC NOT NULL DEFAULT 0,
  last_collected_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(profile_id, business_id)
);

-- Enable RLS
ALTER TABLE public.stocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kid_stocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kid_businesses ENABLE ROW LEVEL SECURITY;

-- Stocks are viewable by everyone (public data)
CREATE POLICY "Stocks are viewable by everyone" ON public.stocks FOR SELECT USING (true);

-- Kid stocks policies
CREATE POLICY "Kids can view their own stocks" ON public.kid_stocks FOR SELECT 
  USING (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Kids can buy stocks" ON public.kid_stocks FOR INSERT 
  WITH CHECK (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Kids can update their stocks" ON public.kid_stocks FOR UPDATE 
  USING (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- Parents can view their kids' stocks
CREATE POLICY "Parents can view household kid stocks" ON public.kid_stocks FOR SELECT
  USING (profile_id IN (
    SELECT p.id FROM profiles p
    WHERE p.household_id IN (
      SELECT household_id FROM profiles WHERE user_id = auth.uid() AND type = 'parent'
    )
  ));

-- Businesses are viewable by everyone
CREATE POLICY "Businesses are viewable by everyone" ON public.businesses FOR SELECT USING (true);

-- Kid businesses policies
CREATE POLICY "Kids can view their own businesses" ON public.kid_businesses FOR SELECT 
  USING (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Kids can buy businesses" ON public.kid_businesses FOR INSERT 
  WITH CHECK (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Kids can update their businesses" ON public.kid_businesses FOR UPDATE 
  USING (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- Parents can view their kids' businesses
CREATE POLICY "Parents can view household kid businesses" ON public.kid_businesses FOR SELECT
  USING (profile_id IN (
    SELECT p.id FROM profiles p
    WHERE p.household_id IN (
      SELECT household_id FROM profiles WHERE user_id = auth.uid() AND type = 'parent'
    )
  ));

-- Seed initial stocks
INSERT INTO public.stocks (name, symbol, description, current_price, emoji, volatility) VALUES
  ('Dinosaur Inc', 'DINO', 'The worlds leading dinosaur theme park company', 25, '🦖', 0.15),
  ('Space Adventures', 'SPACE', 'Rocket ships and moon bases', 50, '🚀', 0.25),
  ('Candy Kingdom', 'CANDY', 'Sweet treats for everyone', 15, '🍭', 0.1),
  ('Robot Factory', 'ROBO', 'Building helper robots for homes', 35, '🤖', 0.2),
  ('Pet Paradise', 'PETS', 'Happy homes for all animals', 20, '🐕', 0.12),
  ('Game World', 'GAME', 'Video games and virtual reality', 40, '🎮', 0.22),
  ('Ocean Explorers', 'OCEAN', 'Submarines and underwater cities', 30, '🐋', 0.18),
  ('Super Snacks', 'SNACK', 'Healthy and yummy food company', 12, '🥨', 0.08);

-- Seed initial businesses
INSERT INTO public.businesses (name, description, emoji, base_cost, base_income, unlock_level, category) VALUES
  ('Lemonade Stand', 'Start small with refreshing lemonade!', '🍋', 50, 5, 1, 'starter'),
  ('Cookie Cart', 'Bake and sell delicious cookies', '🍪', 100, 12, 1, 'starter'),
  ('Pet Walking Service', 'Walk dogs in your neighborhood', '🐕', 150, 18, 2, 'service'),
  ('Lawn Care', 'Mow lawns and rake leaves', '🌿', 200, 25, 2, 'service'),
  ('Toy Shop', 'Sell awesome toys to kids', '🧸', 400, 45, 3, 'retail'),
  ('Ice Cream Truck', 'Mobile frozen treats business', '🍦', 600, 65, 3, 'food'),
  ('Video Game Arcade', 'Fun games for everyone', '🕹️', 1000, 100, 4, 'entertainment'),
  ('Pizza Place', 'Everyones favorite food!', '🍕', 1500, 140, 4, 'food'),
  ('Movie Theater', 'Show the latest blockbusters', '🎬', 2500, 220, 5, 'entertainment'),
  ('Tech Startup', 'Build the next big app', '💻', 5000, 400, 6, 'tech');

-- Function to simulate stock price changes (can be called periodically)
CREATE OR REPLACE FUNCTION public.update_stock_prices()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE stocks SET
    previous_price = current_price,
    current_price = GREATEST(1, current_price * (1 + (random() - 0.5) * 2 * volatility));
END;
$$;