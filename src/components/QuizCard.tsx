import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { CheckCircle, XCircle, Sparkles } from 'lucide-react';

interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correct_answer: number;
  difficulty: string;
  category: string;
  points: number;
}

interface QuizCardProps {
  question: QuizQuestion;
  onAnswer: (questionId: string, selectedAnswer: number, isCorrect: boolean, points: number) => void;
  isAnswered: boolean;
  previousAnswer?: number;
}

export function QuizCard({ question, onAnswer, isAnswered, previousAnswer }: QuizCardProps) {
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(previousAnswer ?? null);
  const [showResult, setShowResult] = useState(isAnswered);

  const handleSelect = (index: number) => {
    if (showResult) return;
    setSelectedAnswer(index);
  };

  const handleSubmit = () => {
    if (selectedAnswer === null) return;
    
    const isCorrect = selectedAnswer === question.correct_answer;
    const pointsEarned = isCorrect ? question.points : 0;
    
    setShowResult(true);
    onAnswer(question.id, selectedAnswer, isCorrect, pointsEarned);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-500/10 text-green-600';
      case 'medium': return 'bg-yellow-500/10 text-yellow-600';
      case 'hard': return 'bg-red-500/10 text-red-600';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getCategoryEmoji = (category: string) => {
    switch (category) {
      case 'coins': return '🪙';
      case 'saving': return '🐷';
      case 'spending': return '🛒';
      case 'earning': return '💼';
      default: return '📚';
    }
  };

  return (
    <div className="bg-card rounded-2xl border border-border/50 p-5 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-xl">{getCategoryEmoji(question.category)}</span>
          <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium capitalize", getDifficultyColor(question.difficulty))}>
            {question.difficulty}
          </span>
        </div>
        <div className="flex items-center gap-1 text-primary font-semibold">
          <Sparkles className="w-4 h-4" />
          <span>{question.points} pts</span>
        </div>
      </div>

      {/* Question */}
      <h3 className="text-lg font-bold text-foreground mb-4">{question.question}</h3>

      {/* Options */}
      <div className="space-y-2 mb-4">
        {question.options.map((option, index) => {
          const isSelected = selectedAnswer === index;
          const isCorrect = index === question.correct_answer;
          const showCorrect = showResult && isCorrect;
          const showWrong = showResult && isSelected && !isCorrect;

          return (
            <button
              key={index}
              onClick={() => handleSelect(index)}
              disabled={showResult}
              className={cn(
                "w-full p-3 rounded-xl text-left transition-all duration-200 border-2",
                !showResult && !isSelected && "border-border/50 bg-muted/30 hover:border-primary/50 hover:bg-primary/5",
                !showResult && isSelected && "border-primary bg-primary/10",
                showCorrect && "border-green-500 bg-green-500/10",
                showWrong && "border-red-500 bg-red-500/10"
              )}
            >
              <div className="flex items-center justify-between">
                <span className={cn(
                  "font-medium",
                  showCorrect && "text-green-600",
                  showWrong && "text-red-600"
                )}>
                  {option}
                </span>
                {showCorrect && <CheckCircle className="w-5 h-5 text-green-500" />}
                {showWrong && <XCircle className="w-5 h-5 text-red-500" />}
              </div>
            </button>
          );
        })}
      </div>

      {/* Submit or Result */}
      {!showResult ? (
        <Button 
          onClick={handleSubmit} 
          disabled={selectedAnswer === null}
          className="w-full"
        >
          Submit Answer
        </Button>
      ) : (
        <div className={cn(
          "text-center py-3 rounded-xl font-semibold",
          selectedAnswer === question.correct_answer 
            ? "bg-green-500/10 text-green-600" 
            : "bg-red-500/10 text-red-600"
        )}>
          {selectedAnswer === question.correct_answer 
            ? `🎉 Correct! +${question.points} points!` 
            : `❌ Wrong! The answer was: ${question.options[question.correct_answer]}`}
        </div>
      )}
    </div>
  );
}
