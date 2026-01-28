import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { BottomNav } from '@/components/BottomNav';
import { QuizCard } from '@/components/QuizCard';
import { Button } from '@/components/ui/button';
import { Loader2, Trophy, Brain, ArrowLeft, RefreshCw, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correct_answer: number;
  difficulty: string;
  category: string;
  points: number;
}

interface QuizAttempt {
  question_id: string;
  selected_answer: number;
  is_correct: boolean;
  points_earned: number;
}

const DAILY_COMPLETION_BONUS = 100;

const Quiz = () => {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [attempts, setAttempts] = useState<Map<string, QuizAttempt>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [sessionPoints, setSessionPoints] = useState(0);
  const [dailyBonusAwarded, setDailyBonusAwarded] = useState(false);

  const { user, profile, isParent, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  // Calculate age tier from birth_date
  const getAgeTier = (birthDate: string | null): string => {
    if (!birthDate) return 'explorer';
    const birth = new Date(birthDate);
    const age = new Date().getFullYear() - birth.getFullYear();
    if (age <= 8) return 'explorer';
    if (age <= 12) return 'builder';
    return 'achiever';
  };

  const ageTier = profile?.birth_date ? getAgeTier(profile.birth_date) : 'explorer';

  useEffect(() => {
    if (profile) {
      fetchQuestionsAndAttempts();
      checkDailyBonus();
    }
  }, [profile]);

  const checkDailyBonus = async () => {
    if (!profile) return;
    
    // Check if user already got daily bonus today
    const today = new Date().toISOString().split('T')[0];
    const bonusKey = `quiz_bonus_${profile.id}_${today}`;
    const alreadyAwarded = localStorage.getItem(bonusKey);
    setDailyBonusAwarded(!!alreadyAwarded);
  };

  const fetchQuestionsAndAttempts = async () => {
    if (!profile) return;
    setIsLoading(true);

    try {
      // Fetch questions filtered by age tier
      const { data: questionsData, error: questionsError } = await supabase
        .from('quiz_questions')
        .select('*')
        .eq('age_tier', ageTier)
        .order('difficulty', { ascending: true });

      if (questionsError) throw questionsError;

      // Parse options from JSONB
      const parsedQuestions = (questionsData || []).map(q => ({
        ...q,
        options: typeof q.options === 'string' ? JSON.parse(q.options) : q.options
      }));

      setQuestions(parsedQuestions);

      // Fetch user's previous attempts
      const { data: attemptsData, error: attemptsError } = await supabase
        .from('quiz_attempts')
        .select('*')
        .eq('profile_id', profile.id);

      if (attemptsError) throw attemptsError;

      const attemptMap = new Map<string, QuizAttempt>();
      (attemptsData || []).forEach(a => {
        attemptMap.set(a.question_id, {
          question_id: a.question_id,
          selected_answer: a.selected_answer,
          is_correct: a.is_correct,
          points_earned: a.points_earned
        });
      });
      setAttempts(attemptMap);

      // Find first unanswered question
      const firstUnanswered = parsedQuestions.findIndex(q => !attemptMap.has(q.id));
      setCurrentIndex(firstUnanswered === -1 ? 0 : firstUnanswered);

    } catch (err) {
      console.error('Error fetching quiz data:', err);
      toast.error('Failed to load quiz');
    } finally {
      setIsLoading(false);
    }
  };

  const awardDailyBonus = async () => {
    if (!profile || dailyBonusAwarded) return;

    try {
      // Award the bonus coins
      const { error } = await supabase
        .from('profiles')
        .update({ total_earnings: profile.total_earnings + DAILY_COMPLETION_BONUS })
        .eq('id', profile.id);

      if (error) throw error;

      // Mark as awarded for today
      const today = new Date().toISOString().split('T')[0];
      const bonusKey = `quiz_bonus_${profile.id}_${today}`;
      localStorage.setItem(bonusKey, 'true');
      setDailyBonusAwarded(true);

      toast.success(
        <div className="flex items-center gap-2">
          <span className="text-2xl">🏆</span>
          <span>Daily Quiz Complete! +{DAILY_COMPLETION_BONUS} Quest Coins!</span>
        </div>
      );
    } catch (err) {
      console.error('Error awarding daily bonus:', err);
    }
  };

  const handleAnswer = async (questionId: string, selectedAnswer: number, isCorrect: boolean, points: number) => {
    if (!profile) return;

    try {
      // Save attempt to database
      const { error } = await supabase
        .from('quiz_attempts')
        .insert({
          profile_id: profile.id,
          question_id: questionId,
          selected_answer: selectedAnswer,
          is_correct: isCorrect,
          points_earned: points
        });

      if (error) throw error;

      // Update local state
      const newAttempts = new Map(attempts).set(questionId, {
        question_id: questionId,
        selected_answer: selectedAnswer,
        is_correct: isCorrect,
        points_earned: points
      });
      setAttempts(newAttempts);

      if (isCorrect) {
        setSessionPoints(prev => prev + points);
        
        // Add points to profile earnings
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ total_earnings: profile.total_earnings + points })
          .eq('id', profile.id);

        if (updateError) console.error('Error updating earnings:', updateError);
      }

      // Check if all questions are now answered - award daily bonus
      const unanswered = questions.filter(q => !newAttempts.has(q.id));
      if (unanswered.length === 0 && !dailyBonusAwarded) {
        await awardDailyBonus();
      }

    } catch (err) {
      console.error('Error saving quiz attempt:', err);
      toast.error('Failed to save your answer');
    }
  };

  const generateNewQuestions = async () => {
    if (!profile) return;
    setIsGenerating(true);

    try {
      const { data, error } = await supabase.functions.invoke('generate-quiz-questions');

      if (error) throw error;

      if (data?.questionsAdded > 0) {
        toast.success(
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <span>{data.questionsAdded} new {data.difficulty} questions added!</span>
          </div>
        );
        await fetchQuestionsAndAttempts();
      } else {
        toast.info('No new questions available right now. Try again later!');
      }
    } catch (err: any) {
      console.error('Error generating questions:', err);
      if (err.message?.includes('429') || err.message?.includes('rate limit')) {
        toast.error('Too many requests. Please wait a moment.');
      } else if (err.message?.includes('402')) {
        toast.error('AI service temporarily unavailable.');
      } else {
        toast.error('Failed to generate new questions');
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const totalPoints = Array.from(attempts.values()).reduce((sum, a) => sum + a.points_earned, 0);
  const answeredCount = attempts.size;
  const correctCount = Array.from(attempts.values()).filter(a => a.is_correct).length;
  const accuracyRate = answeredCount > 0 ? Math.round((correctCount / answeredCount) * 100) : 0;

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const unansweredQuestions = questions.filter(q => !attempts.has(q.id));
  const allAnswered = unansweredQuestions.length === 0;

  return (
    <div className="min-h-screen bg-background pb-24">
      <Header 
        userName={profile?.name || 'Quiz'} 
        userAvatar={profile?.avatar_url || '🧠'} 
      />
      
      <main className="max-w-md mx-auto px-4 py-6 space-y-6">
        {/* Back Button */}
        <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Button>

        {/* Quiz Header */}
        <div className="bg-gradient-to-r from-primary/10 to-accent/10 rounded-2xl p-5 border border-border/50">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
              <Brain className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-foreground">Money Quiz</h1>
              <p className="text-sm text-muted-foreground">
                {ageTier === 'explorer' ? 'Fun money questions for you!' : 
                 ageTier === 'builder' ? 'Learn & earn Quest Coins!' : 
                 'Master your financial knowledge!'}
              </p>
            </div>
            <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded-full capitalize">
              {ageTier === 'explorer' ? '🌟 Explorer' : ageTier === 'builder' ? '🔨 Builder' : '🚀 Achiever'}
            </span>
          </div>
          
          {/* Stats */}
          <div className="grid grid-cols-4 gap-2 mt-4">
            <div className="bg-card/50 rounded-xl p-2 text-center">
              <p className="text-lg font-bold text-foreground">{answeredCount}</p>
              <p className="text-xs text-muted-foreground">Done</p>
            </div>
            <div className="bg-card/50 rounded-xl p-2 text-center">
              <p className="text-lg font-bold text-primary">{correctCount}</p>
              <p className="text-xs text-muted-foreground">Correct</p>
            </div>
            <div className="bg-card/50 rounded-xl p-2 text-center">
              <p className="text-lg font-bold text-foreground">{accuracyRate}%</p>
              <p className="text-xs text-muted-foreground">Accuracy</p>
            </div>
            <div className="bg-card/50 rounded-xl p-2 text-center">
              <p className="text-lg font-bold text-accent-foreground">{totalPoints}</p>
              <p className="text-xs text-muted-foreground">🪙 Earned</p>
            </div>
          </div>

          {sessionPoints > 0 && (
            <div className="mt-3 text-center text-sm font-medium text-primary">
              🎉 +{sessionPoints} coins earned this session!
            </div>
          )}

          {/* Daily Bonus Info */}
          <div className="mt-3 p-2 bg-accent/20 rounded-lg text-center">
            <p className="text-xs text-muted-foreground">
              {dailyBonusAwarded 
                ? '✅ Daily bonus claimed!' 
                : `🎯 Complete all questions for +${DAILY_COMPLETION_BONUS} bonus coins!`}
            </p>
          </div>
        </div>

        {/* Quiz Content */}
        {allAnswered ? (
          <div className="text-center py-8 bg-card rounded-2xl border border-border/50">
            <Trophy className="w-16 h-16 text-primary mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-foreground mb-2">All Done!</h2>
            <p className="text-muted-foreground mb-2">
              You've answered all {questions.length} questions!
            </p>
            <p className="text-lg font-semibold text-primary mb-4">
              🪙 {totalPoints} coins earned
            </p>
            
            <Button
              onClick={generateNewQuestions}
              disabled={isGenerating}
              className="gap-2"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" />
                  Get New Questions
                </>
              )}
            </Button>
            <p className="text-xs text-muted-foreground mt-2">
              Questions adapt to your skill level!
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">
                Question {questions.indexOf(unansweredQuestions[0]) + 1} of {questions.length}
              </h2>
              <div className="flex items-center gap-2">
                <span className="text-xs px-2 py-1 bg-muted rounded-full capitalize">
                  {unansweredQuestions[0]?.difficulty || 'easy'}
                </span>
                <span className="text-sm text-muted-foreground">
                  {unansweredQuestions.length} left
                </span>
              </div>
            </div>

            {unansweredQuestions.slice(0, 1).map(question => (
              <QuizCard
                key={question.id}
                question={question}
                onAnswer={handleAnswer}
                isAnswered={attempts.has(question.id)}
                previousAnswer={attempts.get(question.id)?.selected_answer}
              />
            ))}

            {unansweredQuestions.length > 1 && (
              <p className="text-center text-sm text-muted-foreground">
                Answer to reveal the next question!
              </p>
            )}
          </div>
        )}

        {/* Generate More Questions Button */}
        {!allAnswered && questions.length < 20 && (
          <div className="text-center">
            <Button
              variant="outline"
              size="sm"
              onClick={generateNewQuestions}
              disabled={isGenerating}
              className="gap-2"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Add More Questions
                </>
              )}
            </Button>
          </div>
        )}
      </main>
      
      <BottomNav activeTab="home" onTabChange={() => {}} />
    </div>
  );
};

export default Quiz;
