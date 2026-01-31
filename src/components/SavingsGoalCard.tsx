import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Coins, Target, Plus, Minus, Trash2, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SavingsGoal {
  id: string;
  name: string;
  icon: string;
  target_amount: number;
  current_amount: number;
  is_completed: boolean;
}

interface SavingsGoalCardProps {
  goal: SavingsGoal;
  availableBalance: number;
  onAddFunds: (goalId: string, amount: number) => Promise<void>;
  onWithdraw: (goalId: string, amount: number) => Promise<void>;
  onDelete: (goalId: string) => Promise<void>;
}

export function SavingsGoalCard({ 
  goal, 
  availableBalance, 
  onAddFunds, 
  onWithdraw,
  onDelete 
}: SavingsGoalCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const progress = Math.min((goal.current_amount / goal.target_amount) * 100, 100);
  const remaining = Math.max(goal.target_amount - goal.current_amount, 0);

  const handleAddFunds = async () => {
    const value = parseFloat(amount);
    if (isNaN(value) || value <= 0) return;
    
    setIsLoading(true);
    try {
      await onAddFunds(goal.id, value);
      setAmount('');
      setIsExpanded(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleWithdraw = async () => {
    const value = parseFloat(amount);
    if (isNaN(value) || value <= 0) return;
    
    setIsLoading(true);
    try {
      await onWithdraw(goal.id, value);
      setAmount('');
      setIsExpanded(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickAdd = async (quickAmount: number) => {
    if (quickAmount > availableBalance) return;
    setIsLoading(true);
    try {
      await onAddFunds(goal.id, quickAmount);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn(
      "bg-card border rounded-xl p-4 transition-all",
      goal.is_completed && "border-green-500/50 bg-green-500/5"
    )}>
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 bg-muted/50 rounded-xl flex items-center justify-center text-2xl">
          {goal.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-foreground truncate">{goal.name}</h3>
            {goal.is_completed && (
              <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
            )}
          </div>
          <div className="flex items-center gap-2 text-sm mt-1">
            <Coins className="w-4 h-4 text-amber-500" />
            <span className="font-medium text-amber-600">
              {goal.current_amount} / {goal.target_amount}
            </span>
          </div>
          <Progress value={progress} className="mt-2 h-2" />
          {!goal.is_completed && (
            <p className="text-xs text-muted-foreground mt-1">
              {remaining} more coins to go!
            </p>
          )}
        </div>
        {!goal.is_completed && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <Plus className="w-4 h-4" />
          </Button>
        )}
      </div>

      {isExpanded && !goal.is_completed && (
        <div className="mt-4 space-y-3 pt-3 border-t">
          <div className="flex gap-2">
            {[5, 10, 25].map((quickAmount) => (
              <Button
                key={quickAmount}
                variant="outline"
                size="sm"
                disabled={quickAmount > availableBalance || isLoading}
                onClick={() => handleQuickAdd(quickAmount)}
                className="flex-1"
              >
                +{quickAmount}
              </Button>
            ))}
          </div>
          
          <div className="flex gap-2">
            <Input
              type="number"
              placeholder="Amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min="1"
              max={Math.max(availableBalance, goal.current_amount)}
              className="flex-1"
            />
            <Button
              size="sm"
              disabled={isLoading || !amount || parseFloat(amount) > availableBalance}
              onClick={handleAddFunds}
            >
              <Plus className="w-4 h-4 mr-1" />
              Add
            </Button>
            {goal.current_amount > 0 && (
              <Button
                variant="outline"
                size="sm"
                disabled={isLoading || !amount || parseFloat(amount) > goal.current_amount}
                onClick={handleWithdraw}
              >
                <Minus className="w-4 h-4 mr-1" />
                Take
              </Button>
            )}
          </div>

          <Button
            variant="ghost"
            size="sm"
            className="w-full text-destructive hover:text-destructive"
            onClick={() => onDelete(goal.id)}
          >
            <Trash2 className="w-4 h-4 mr-1" />
            Delete Goal
          </Button>
        </div>
      )}
    </div>
  );
}
