import { Lock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  requirement_type: string;
  requirement_value: number;
}

interface UnlockedBadge extends Badge {
  unlocked_at: string;
}

interface BadgeGridProps {
  allBadges: Badge[];
  unlockedBadges: UnlockedBadge[];
  showAll?: boolean;
}

export function BadgeGrid({ allBadges, unlockedBadges, showAll = false }: BadgeGridProps) {
  const unlockedIds = new Set(unlockedBadges.map((b) => b.id));

  // If showAll is false, only show unlocked badges
  const badgesToShow = showAll ? allBadges : unlockedBadges;

  if (badgesToShow.length === 0) {
    return (
      <div className="text-center py-6 text-muted-foreground text-sm">
        {showAll ? 'No badges available yet' : 'Complete chores to earn badges! 🏅'}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-4 gap-3">
      {badgesToShow.map((badge) => {
        const isUnlocked = unlockedIds.has(badge.id);
        return (
          <div
            key={badge.id}
            className={cn(
              'relative flex flex-col items-center p-3 rounded-xl border transition-all',
              isUnlocked
                ? 'bg-gradient-to-br from-primary/10 to-primary/5 border-primary/30 shadow-sm'
                : 'bg-muted/30 border-border/50 opacity-60'
            )}
          >
            <div
              className={cn(
                'text-3xl mb-1 transition-transform',
                isUnlocked && 'animate-pulse'
              )}
            >
              {isUnlocked ? badge.icon : <Lock className="w-6 h-6 text-muted-foreground" />}
            </div>
            <span
              className={cn(
                'text-[10px] font-medium text-center leading-tight',
                isUnlocked ? 'text-foreground' : 'text-muted-foreground'
              )}
            >
              {badge.name}
            </span>
            {!isUnlocked && showAll && (
              <span className="text-[8px] text-muted-foreground mt-1">
                {badge.requirement_value}x
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
