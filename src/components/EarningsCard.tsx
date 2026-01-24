import { TrendingUp, Target, Sparkles, Coins } from 'lucide-react';

interface EarningsCardProps {
  totalEarnings: number;
  weeklyEarnings: number;
  savingsGoal?: number;
}

export function EarningsCard({ 
  totalEarnings, 
  weeklyEarnings, 
  savingsGoal = 100,
}: EarningsCardProps) {
  const progress = Math.min((totalEarnings / savingsGoal) * 100, 100);
  
  return (
    <div className="gradient-hero rounded-2xl p-6 text-primary-foreground shadow-float">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Coins className="w-6 h-6" />
          <span className="font-bold text-lg">Quest Coins</span>
        </div>
        <Sparkles className="w-5 h-5 animate-bounce-gentle" />
      </div>
      
      <div className="text-5xl font-extrabold mb-1">
        {totalEarnings}
      </div>
      
      <div className="flex items-center gap-2 text-primary-foreground/80 mb-6">
        <TrendingUp className="w-4 h-4" />
        <span className="text-sm font-medium">+{weeklyEarnings} this week</span>
      </div>
      
      <div className="bg-primary-foreground/20 rounded-full p-1 mb-3">
        <div className="flex items-center gap-2">
          <div 
            className="h-3 bg-primary-foreground rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
      
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-1.5">
          <Target className="w-4 h-4" />
          <span>Goal: {savingsGoal} coins</span>
        </div>
        <span className="font-bold">{progress.toFixed(0)}%</span>
      </div>
    </div>
  );
}
