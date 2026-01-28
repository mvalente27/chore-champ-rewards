-- Add age_tier column to stocks table
ALTER TABLE public.stocks ADD COLUMN age_tier text DEFAULT 'explorer';

-- Add age_tier column to businesses table  
ALTER TABLE public.businesses ADD COLUMN age_tier text DEFAULT 'explorer';

-- Add age_tier column to quiz_questions table for filtering
ALTER TABLE public.quiz_questions ADD COLUMN age_tier text DEFAULT 'explorer';

-- Update existing stocks with appropriate age tiers based on complexity
-- (We'll seed some default data after this)

-- Create index for faster filtering
CREATE INDEX idx_stocks_age_tier ON public.stocks(age_tier);
CREATE INDEX idx_businesses_age_tier ON public.businesses(age_tier);
CREATE INDEX idx_quiz_questions_age_tier ON public.quiz_questions(age_tier);