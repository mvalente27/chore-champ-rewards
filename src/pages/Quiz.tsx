import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { BottomNav } from '@/components/BottomNav';
import { QuizCard } from '@/components/QuizCard';
import { Button } from '@/components/ui/button';
import { Loader2, Trophy, Brain, ArrowLeft, RefreshCw } from 'lucide-react';
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

const Quiz = () => {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [attempts, setAttempts] = useState<Map<string, QuizAttempt>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [sessionPoints, setSessionPoints] = useState(0);

  const { user, profile, isParent, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (profile) {
      fetchQuestionsAndAttempts();
    }
  }, [profile]);

  const fetchQuestionsAndAttempts = async () => {
    if (!profile) return;
    setIsLoading(true);

    try {
      // Fetch all questions
      const { data: questionsData, error: questionsError } = await supabase
        .from('quiz_questions')
        .select('*')
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
      setAttempts(prev => new Map(prev).set(questionId, {
        question_id: questionId,
        selected_answer: selectedAnswer,
        is_correct: isCorrect,
        points_earned: points
      }));

      if (isCorrect) {
        setSessionPoints(prev => prev + points);
        
        // Add points to profile earnings
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ total_earnings: profile.total_earnings + points })
          .eq('id', profile.id);

        if (updateError) console.error('Error updating earnings:', updateError);
      }

    } catch (err) {
      console.error('Error saving quiz attempt:', err);
      toast.error('Failed to save your answer');
    }
  };

  const totalPoints = Array.from(attempts.values()).reduce((sum, a) => sum + a.points_earned, 0);
  const answeredCount = attempts.size;
  const correctCount = Array.from(attempts.values()).filter(a => a.is_correct).length;

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
            <div>
              <h1 className="text-xl font-bold text-foreground">Money Quiz</h1>
              <p className="text-sm text-muted-foreground">Learn & earn bonus points!</p>
            </div>
          </div>
          
          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 mt-4">
            <div className="bg-card/50 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-foreground">{answeredCount}/{questions.length}</p>
              <p className="text-xs text-muted-foreground">Answered</p>
            </div>
            <div className="bg-card/50 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-green-600">{correctCount}</p>
              <p className="text-xs text-muted-foreground">Correct</p>
            </div>
            <div className="bg-card/50 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-primary">{totalPoints}</p>
              <p className="text-xs text-muted-foreground">Points</p>
            </div>
          </div>

          {sessionPoints > 0 && (
            <div className="mt-3 text-center text-sm font-medium text-primary">
              🎉 +{sessionPoints} points earned this session!
            </div>
          )}
        </div>

        {/* Quiz Content */}
        {allAnswered ? (
          <div className="text-center py-12 bg-card rounded-2xl border border-border/50">
            <Trophy className="w-16 h-16 text-primary mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-foreground mb-2">All Done!</h2>
            <p className="text-muted-foreground mb-4">
              You've answered all {questions.length} questions!<br />
              Score: {correctCount}/{questions.length} correct ({totalPoints} points)
            </p>
            <p className="text-sm text-muted-foreground">Check back later for new questions!</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">
                Question {unansweredQuestions.length > 0 ? questions.indexOf(unansweredQuestions[0]) + 1 : currentIndex + 1} of {questions.length}
              </h2>
              <span className="text-sm text-muted-foreground">
                {unansweredQuestions.length} remaining
              </span>
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
      </main>
      
      <BottomNav activeTab="home" onTabChange={() => {}} />
    </div>
  );
};

export default Quiz;
