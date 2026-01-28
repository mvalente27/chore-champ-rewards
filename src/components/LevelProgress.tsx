import { Progress } from '@/components/ui/progress';
import { Zap } from 'lucide-react';

interface LevelProgressProps {
  level: number;
  xp: number;
  xpProgress: number;
  xpForNextLevel: number;
}

export function LevelProgress({ level, xp, xpProgress, xpForNextLevel }: LevelProgressProps) {
  return (
    <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent rounded-2xl p-4 border border-primary/20">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
            <span className="text-xl font-bold text-primary">{level}</span>
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Level {level}</p>
            <p className="text-xs text-muted-foreground">{xp} XP total</p>
          </div>
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Zap className="w-3 h-3" />
          <span>{xpForNextLevel} XP for Lvl {level + 1}</span>
        </div>
      </div>
      <Progress value={xpProgress} className="h-2" />
    </div>
  );
}
