import { CheckCircle2, Clock, Star, Flame } from 'lucide-react';

interface StatsGridProps {
  completedToday: number;
  pendingChores: number;
  currentStreak: number;
  totalStars: number;
}

export function StatsGrid({ completedToday, pendingChores, currentStreak, totalStars }: StatsGridProps) {
  const stats = [
    { 
      icon: CheckCircle2, 
      value: completedToday, 
      label: 'Done Today',
      color: 'text-primary bg-primary/10'
    },
    { 
      icon: Clock, 
      value: pendingChores, 
      label: 'Pending',
      color: 'text-secondary bg-secondary/10'
    },
    { 
      icon: Flame, 
      value: currentStreak, 
      label: 'Day Streak',
      color: 'text-destructive bg-destructive/10'
    },
    { 
      icon: Star, 
      value: totalStars, 
      label: 'Stars',
      color: 'text-reward-treat bg-reward-treat/10'
    },
  ];
  
  return (
    <div className="grid grid-cols-4 gap-3">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <div 
            key={index}
            className="bg-card rounded-xl p-3 shadow-card border border-border/50 flex flex-col items-center text-center"
          >
            <div className={`p-2 rounded-lg ${stat.color} mb-2`}>
              <Icon className="w-4 h-4" />
            </div>
            <span className="text-xl font-extrabold text-foreground">{stat.value}</span>
            <span className="text-[10px] text-muted-foreground font-medium leading-tight">{stat.label}</span>
          </div>
        );
      })}
    </div>
  );
}
