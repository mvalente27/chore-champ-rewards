import { Chore } from '@/types/chores';
import { Button } from '@/components/ui/button';
import { DollarSign, Tv, Users, Cookie, Sparkles, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChoreCardProps {
  chore: Chore;
  onClaim: (id: string) => void;
  onComplete: (id: string) => void;
  isKidView?: boolean;
}

const rewardIcons = {
  cash: DollarSign,
  tv: Tv,
  playdate: Users,
  treat: Cookie,
};

const rewardLabels = {
  cash: 'Cash',
  tv: 'TV Time',
  playdate: 'Play Date',
  treat: 'Treat',
};

const difficultyColors = {
  easy: 'bg-primary/10 text-primary',
  medium: 'bg-secondary/10 text-secondary',
  hard: 'bg-accent/10 text-accent',
};

export function ChoreCard({ chore, onClaim, onComplete, isKidView = false }: ChoreCardProps) {
  const RewardIcon = rewardIcons[chore.reward.type];
  
  return (
    <div 
      className={cn(
        "bg-card rounded-2xl p-5 shadow-card border border-border/50 transition-all duration-300 hover:shadow-float hover:-translate-y-1",
        chore.isCompleted && "opacity-75"
      )}
    >
      <div className="flex items-start gap-4">
        <div className="text-4xl">{chore.icon}</div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-bold text-lg text-foreground truncate">{chore.title}</h3>
            {chore.isCompleted && (
              <span className="flex items-center gap-1 text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                <Check className="w-3 h-3" /> Done
              </span>
            )}
          </div>
          
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
            {chore.description}
          </p>
          
          <div className="flex items-center gap-2 flex-wrap">
            <span className={cn("text-xs font-semibold px-2.5 py-1 rounded-full", difficultyColors[chore.difficulty])}>
              {chore.difficulty.charAt(0).toUpperCase() + chore.difficulty.slice(1)}
            </span>
            
            <div className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-full font-bold text-sm",
              `reward-${chore.reward.type}`
            )}>
              <RewardIcon className="w-4 h-4" />
              <span>
                {chore.reward.type === 'cash' && '$'}
                {chore.reward.value} {chore.reward.unit}
              </span>
            </div>
          </div>
        </div>
      </div>
      
      {!chore.isCompleted && (
        <div className="mt-4 pt-4 border-t border-border/50">
          {isKidView ? (
            <Button 
              variant="hero" 
              size="lg" 
              className="w-full gap-2"
              onClick={() => onClaim(chore.id)}
            >
              <Sparkles className="w-5 h-5" />
              I'll Do It!
            </Button>
          ) : (
            <Button 
              variant="default" 
              size="default" 
              className="w-full"
              onClick={() => onComplete(chore.id)}
            >
              <Check className="w-4 h-4" />
              Mark Complete
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
