import { useEffect, useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Sparkles, Star, Zap } from 'lucide-react';
import { fireBigConfetti } from '@/lib/confetti';

interface BadgeUnlock {
  badgeId: string;
  badgeName: string;
  badgeIcon: string;
  xpReward: number;
}

interface LevelUpCelebrationProps {
  isOpen: boolean;
  onClose: () => void;
  newLevel: number;
  unlockedBadges?: BadgeUnlock[];
}

export function LevelUpCelebration({ 
  isOpen, 
  onClose, 
  newLevel,
  unlockedBadges = []
}: LevelUpCelebrationProps) {
  const [showBadges, setShowBadges] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Trigger confetti when modal opens
      fireBigConfetti();
      
      // Show badges after a delay
      if (unlockedBadges.length > 0) {
        const timer = setTimeout(() => setShowBadges(true), 1000);
        return () => clearTimeout(timer);
      }
    } else {
      setShowBadges(false);
    }
  }, [isOpen, unlockedBadges.length]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md text-center border-2 border-primary/30 bg-gradient-to-b from-card to-primary/5">
        <div className="py-6 space-y-6">
          {/* Level up animation */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-32 h-32 rounded-full bg-primary/20 animate-ping" />
            </div>
            <div className="relative w-28 h-28 mx-auto rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg">
              <span className="text-4xl font-bold text-primary-foreground">{newLevel}</span>
            </div>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <div className="flex items-center justify-center gap-2">
              <Sparkles className="w-6 h-6 text-yellow-500 animate-pulse" />
              <h2 className="text-2xl font-bold text-foreground">Level Up!</h2>
              <Sparkles className="w-6 h-6 text-yellow-500 animate-pulse" />
            </div>
            <p className="text-muted-foreground">
              You've reached <span className="font-semibold text-primary">Level {newLevel}</span>!
            </p>
          </div>

          {/* Stats */}
          <div className="flex justify-center gap-6">
            <div className="flex items-center gap-2 text-sm">
              <Zap className="w-4 h-4 text-primary" />
              <span className="text-muted-foreground">Keep completing chores to level up!</span>
            </div>
          </div>

          {/* Unlocked badges */}
          {showBadges && unlockedBadges.length > 0 && (
            <div className="space-y-3 pt-4 border-t border-border">
              <div className="flex items-center justify-center gap-2">
                <Star className="w-5 h-5 text-yellow-500" />
                <span className="text-sm font-medium text-foreground">New Badges Unlocked!</span>
              </div>
              <div className="flex justify-center gap-4">
                {unlockedBadges.map((badge) => (
                  <div 
                    key={badge.badgeId}
                    className="flex flex-col items-center gap-1 p-2 rounded-lg bg-accent/30 animate-bounce"
                  >
                    <span className="text-3xl">{badge.badgeIcon}</span>
                    <span className="text-xs font-medium text-foreground">{badge.badgeName}</span>
                    <span className="text-[10px] text-primary">+{badge.xpReward} XP</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <Button onClick={onClose} className="w-full" size="lg">
            Awesome! 🎉
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
