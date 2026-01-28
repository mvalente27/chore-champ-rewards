import { toast } from 'sonner';
import { fireConfetti } from '@/lib/confetti';

interface BadgeUnlock {
  badgeId: string;
  badgeName: string;
  badgeIcon: string;
  xpReward: number;
}

export function showBadgeUnlockToast(badge: BadgeUnlock) {
  fireConfetti();
  
  toast.custom(
    (t) => (
      <div className="bg-gradient-to-r from-primary/10 to-accent/10 border-2 border-primary/30 rounded-xl p-4 shadow-lg animate-in slide-in-from-top-2 duration-300">
        <div className="flex items-center gap-3">
          <div className="text-4xl animate-bounce">{badge.badgeIcon}</div>
          <div className="flex-1">
            <p className="font-bold text-foreground">Badge Unlocked! 🎉</p>
            <p className="text-sm text-muted-foreground">{badge.badgeName}</p>
            <p className="text-xs text-primary font-medium">+{badge.xpReward} XP</p>
          </div>
        </div>
      </div>
    ),
    {
      duration: 4000,
      position: 'top-center',
    }
  );
}

export function showLevelUpToast(newLevel: number) {
  toast.custom(
    (t) => (
      <div className="bg-gradient-to-r from-primary to-primary/70 rounded-xl p-4 shadow-lg animate-in slide-in-from-top-2 duration-300">
        <div className="flex items-center gap-3 text-primary-foreground">
          <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
            <span className="text-xl font-bold">{newLevel}</span>
          </div>
          <div className="flex-1">
            <p className="font-bold">Level Up! ⬆️</p>
            <p className="text-sm opacity-90">You're now Level {newLevel}!</p>
          </div>
        </div>
      </div>
    ),
    {
      duration: 4000,
      position: 'top-center',
    }
  );
}
