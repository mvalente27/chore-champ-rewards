import { Chore } from '@/types/chores';
import { ChoreStatus } from '@/types/database';
import { Button } from '@/components/ui/button';
import { DollarSign, Tv, Users, Cookie, Sparkles, Check, Clock, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChoreCardProps {
  chore: Chore;
  onClaim: (id: string) => void;
  onComplete: (id: string) => void;
  onApprove?: (id: string) => void;
  isKidView?: boolean;
  choreStatus?: ChoreStatus;
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

const statusConfig = {
  available: { label: 'Available', color: 'bg-muted text-muted-foreground', icon: null },
  claimed: { label: 'In Progress', color: 'bg-secondary/20 text-secondary', icon: Clock },
  pending_verification: { label: 'Pending Approval', color: 'bg-amber-500/20 text-amber-600', icon: Clock },
  completed: { label: 'Completed', color: 'bg-primary/10 text-primary', icon: CheckCircle2 },
};

export function ChoreCard({ 
  chore, 
  onClaim, 
  onComplete, 
  onApprove,
  isKidView = false,
  choreStatus = 'available'
}: ChoreCardProps) {
  const RewardIcon = rewardIcons[chore.reward.type];
  const status = statusConfig[choreStatus];
  const StatusIcon = status.icon;
  
  return (
    <div 
      className={cn(
        "bg-card rounded-2xl p-5 shadow-card border border-border/50 transition-all duration-300 hover:shadow-float hover:-translate-y-1",
        choreStatus === 'completed' && "opacity-75"
      )}
    >
      <div className="flex items-start gap-4">
        <div className="text-4xl">{chore.icon}</div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h3 className="font-bold text-lg text-foreground truncate">{chore.title}</h3>
            <span className={cn("flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full", status.color)}>
              {StatusIcon && <StatusIcon className="w-3 h-3" />}
              {status.label}
            </span>
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
                {chore.reward.type === 'cash' && `$${chore.reward.value}`}
                {chore.reward.type === 'tv' && `${chore.reward.value} ${chore.reward.unit}`}
                {(chore.reward.type === 'playdate' || chore.reward.type === 'treat') && (
                  chore.reward.unit || rewardLabels[chore.reward.type]
                )}
              </span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Action buttons based on status and role */}
      {choreStatus !== 'completed' && (
        <div className="mt-4 pt-4 border-t border-border/50">
          {isKidView ? (
            // Kid View Actions
            <>
              {choreStatus === 'available' && (
                <Button 
                  variant="hero" 
                  size="lg" 
                  className="w-full gap-2"
                  onClick={() => onClaim(chore.id)}
                >
                  <Sparkles className="w-5 h-5" />
                  I'll Do It!
                </Button>
              )}
              {choreStatus === 'claimed' && (
                <Button 
                  variant="default" 
                  size="lg" 
                  className="w-full gap-2"
                  onClick={() => onComplete(chore.id)}
                >
                  <Check className="w-5 h-5" />
                  Mark as Done
                </Button>
              )}
              {choreStatus === 'pending_verification' && (
                <div className="text-center text-sm text-muted-foreground py-2">
                  ⏳ Waiting for parent to approve...
                </div>
              )}
            </>
          ) : (
            // Parent View Actions
            <>
              {choreStatus === 'pending_verification' && onApprove && (
                <Button 
                  variant="hero" 
                  size="lg" 
                  className="w-full gap-2"
                  onClick={() => onApprove(chore.id)}
                >
                  <CheckCircle2 className="w-5 h-5" />
                  Approve & Pay Reward
                </Button>
              )}
              {choreStatus === 'available' && (
                <div className="text-center text-sm text-muted-foreground py-2">
                  Waiting for a kid to claim this chore
                </div>
              )}
              {choreStatus === 'claimed' && (
                <div className="text-center text-sm text-muted-foreground py-2">
                  In progress - waiting for completion
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
