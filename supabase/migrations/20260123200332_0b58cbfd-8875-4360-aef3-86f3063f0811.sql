-- Create quiz questions table
CREATE TABLE public.quiz_questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  question TEXT NOT NULL,
  options JSONB NOT NULL, -- Array of 4 options
  correct_answer INTEGER NOT NULL, -- Index of correct option (0-3)
  difficulty TEXT NOT NULL DEFAULT 'easy', -- easy, medium, hard
  category TEXT NOT NULL DEFAULT 'coins', -- coins, saving, spending, earning
  points INTEGER NOT NULL DEFAULT 10,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create quiz attempts table to track kid progress
CREATE TABLE public.quiz_attempts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.quiz_questions(id) ON DELETE CASCADE,
  selected_answer INTEGER NOT NULL,
  is_correct BOOLEAN NOT NULL,
  points_earned INTEGER NOT NULL DEFAULT 0,
  attempted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(profile_id, question_id) -- One attempt per question per kid
);

-- Enable RLS
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;

-- Quiz questions are readable by all authenticated users
CREATE POLICY "Anyone can view quiz questions" 
ON public.quiz_questions 
FOR SELECT 
USING (true);

-- Only parents can manage quiz questions (future admin feature)
CREATE POLICY "Parents can create quiz questions" 
ON public.quiz_questions 
FOR INSERT 
WITH CHECK (is_parent());

-- Quiz attempts policies
CREATE POLICY "Users can view their own attempts" 
ON public.quiz_attempts 
FOR SELECT 
USING (profile_id = get_current_profile_id() OR is_parent());

CREATE POLICY "Users can create their own attempts" 
ON public.quiz_attempts 
FOR INSERT 
WITH CHECK (profile_id = get_current_profile_id());

-- Seed some starter quiz questions about money
INSERT INTO public.quiz_questions (question, options, correct_answer, difficulty, category, points) VALUES
('How many cents are in a dollar?', '["10", "50", "100", "1000"]', 2, 'easy', 'coins', 10),
('Which coin is worth 25 cents?', '["Penny", "Nickel", "Dime", "Quarter"]', 3, 'easy', 'coins', 10),
('What is saving money for?', '["Throwing away", "Buying things later", "Giving to strangers", "Hiding forever"]', 1, 'easy', 'saving', 10),
('If you have $5 and spend $2, how much do you have left?', '["$2", "$3", "$5", "$7"]', 1, 'easy', 'spending', 15),
('What do you call money you earn from doing chores?', '["Allowance", "Taxes", "Bills", "Rent"]', 0, 'easy', 'earning', 10),
('Which is worth MORE: 4 quarters or 9 dimes?', '["4 quarters", "9 dimes", "They are equal", "Cannot compare"]', 1, 'medium', 'coins', 20),
('Why is it good to save some of your allowance?', '["To have money for emergencies", "Money expires if not spent", "Banks dont want your money", "Saving is bad"]', 0, 'medium', 'saving', 20),
('What is a budget?', '["A type of wallet", "A plan for spending and saving money", "A piggy bank", "A credit card"]', 1, 'medium', 'spending', 20),
('If you earn $3 per chore and do 4 chores, how much do you earn?', '["$7", "$10", "$12", "$15"]', 2, 'medium', 'earning', 25),
('What happens when you invest money wisely over time?', '["It disappears", "It can grow", "It stays the same", "It shrinks"]', 1, 'hard', 'saving', 30);