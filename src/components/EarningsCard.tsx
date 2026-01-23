import { TrendingUp, PiggyBank, Target, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EarningsCardProps {
  totalEarnings: number;
  weeklyEarnings: number;
  savingsGoal?: number;
  onInvest?: () => void;
}

export function EarningsCard({ 
  totalEarnings, 
  weeklyEarnings, 
  savingsGoal = 100,
  onInvest 
}: EarningsCardProps) {
  const progress = Math.min((totalEarnings / savingsGoal) * 100, 100);
  
  return (
    <div className="gradient-hero rounded-2xl p-6 text-primary-foreground shadow-float">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <PiggyBank className="w-6 h-6" />
          <span className="font-bold text-lg">My Earnings</span>
        </div>
        <Sparkles className="w-5 h-5 animate-bounce-gentle" />
      </div>
      
      <div className="text-5xl font-extrabold mb-1">
        ${totalEarnings.toFixed(2)}
      </div>
      
      <div className="flex items-center gap-2 text-primary-foreground/80 mb-6">
        <TrendingUp className="w-4 h-4" />
        <span className="text-sm font-medium">+${weeklyEarnings.toFixed(2)} this week</span>
      </div>
      
      <div className="bg-primary-foreground/20 rounded-full p-1 mb-3">
        <div className="flex items-center gap-2">
          <div 
            className="h-3 bg-primary-foreground rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
      
      <div className="flex items-center justify-between text-sm mb-4">
        <div className="flex items-center gap-1.5">
          <Target className="w-4 h-4" />
          <span>Goal: ${savingsGoal}</span>
        </div>
        <span className="font-bold">{progress.toFixed(0)}%</span>
      </div>
      
      {onInvest && (
        <Button 
          variant="outline" 
          className="w-full bg-primary-foreground/10 border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/20 hover:text-primary-foreground font-bold"
          onClick={onInvest}
        >
          <TrendingUp className="w-4 h-4" />
          Start Investing
        </Button>
      )}
    </div>
  );
}
