import { useNavigate } from 'react-router-dom';
import { EarningsCard } from '@/components/EarningsCard';
import { StatsGrid } from '@/components/StatsGrid';
import { Button } from '@/components/ui/button';
import { UserPlus, Brain, ChevronRight, KeyRound, CheckCircle, Pencil, TrendingUp, Building2 } from 'lucide-react';
import { Profile } from '@/types/database';

interface HomeViewProps {
  profile: Profile;
  isParent: boolean;
  householdProfiles: Profile[];
  completedToday: number;
  pendingChores: number;
  pendingApproval: number;
  onAddKid: () => void;
  onSetupKidLogin?: (kid: Profile) => void;
  onEditKid?: (kid: Profile) => void;
}

export function HomeView({
  profile,
  isParent,
  householdProfiles,
  completedToday,
  pendingChores,
  pendingApproval,
  onAddKid,
  onSetupKidLogin,
  onEditKid,
}: HomeViewProps) {
  const navigate = useNavigate();

  const kids = householdProfiles.filter(p => p.type === 'kid');

  return (
    <div className="space-y-6">
      {/* Role Badge */}
      <div className="flex items-center justify-center">
        <div className={`px-4 py-1.5 rounded-full text-sm font-medium ${
          isParent 
            ? 'bg-primary/10 text-primary' 
            : 'bg-secondary/50 text-secondary-foreground'
        }`}>
          {isParent ? '👨‍👩‍👧 Parent Dashboard' : '⭐ Kid Dashboard'}
        </div>
      </div>

      {/* Earnings Card - Kids Only */}
      {!isParent && (
        <EarningsCard 
          totalEarnings={profile.total_earnings}
          weeklyEarnings={0}
          savingsGoal={100}
        />
      )}
      
      {/* Stats Grid */}
      <StatsGrid 
        completedToday={completedToday}
        pendingChores={pendingChores}
        currentStreak={5}
        totalStars={completedToday * 2}
      />

      {/* Learning & Games Section - Kids Only */}
      {!isParent && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">Learn & Play</h2>
          
          {/* Money Quiz */}
          <button
            onClick={() => navigate('/quiz')}
            className="w-full bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20 rounded-xl p-4 flex items-center gap-3 hover:from-primary/15 hover:to-accent/15 transition-all"
          >
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
              <Brain className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 text-left">
              <p className="font-semibold text-foreground">Money Quiz</p>
              <p className="text-sm text-muted-foreground">Learn & earn bonus points!</p>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </button>

          {/* Stock Market Game */}
          <button
            onClick={() => navigate('/stocks')}
            className="w-full bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 rounded-xl p-4 flex items-center gap-3 hover:from-emerald-500/15 hover:to-teal-500/15 transition-all"
          >
            <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
            </div>
            <div className="flex-1 text-left">
              <p className="font-semibold text-foreground">Stock Market</p>
              <p className="text-sm text-muted-foreground">Invest coins & watch them grow!</p>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </button>

          {/* Entrepreneur Quest */}
          <button
            onClick={() => navigate('/entrepreneur')}
            className="w-full bg-gradient-to-r from-purple-500/10 to-indigo-500/10 border border-purple-500/20 rounded-xl p-4 flex items-center gap-3 hover:from-purple-500/15 hover:to-indigo-500/15 transition-all"
          >
            <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-purple-600" />
            </div>
            <div className="flex-1 text-left">
              <p className="font-semibold text-foreground">Entrepreneur Quest</p>
              <p className="text-sm text-muted-foreground">Build your business empire!</p>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>
      )}

      {/* Pending Approvals Banner for Parents */}
      {isParent && pendingApproval > 0 && (
        <div className="bg-accent/20 border border-accent/30 rounded-xl p-4 flex items-center gap-3">
          <span className="text-2xl">⏳</span>
          <div>
            <p className="font-semibold text-foreground">{pendingApproval} chore{pendingApproval > 1 ? 's' : ''} waiting for approval</p>
            <p className="text-sm text-muted-foreground">Review and approve completed chores</p>
          </div>
        </div>
      )}

      {/* Kids in Household - Parent View */}
      {isParent && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-foreground">Kids</h2>
            <Button 
              variant="outline" 
              size="sm"
              onClick={onAddKid}
            >
              <UserPlus className="w-4 h-4" />
              Add Kid
            </Button>
          </div>
          {kids.length === 0 ? (
            <div className="text-center py-8 bg-muted/30 rounded-xl">
              <span className="text-3xl mb-2 block">👨‍👩‍👧</span>
              <p className="text-muted-foreground text-sm">No kids added yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {kids.map((kid) => {
                const hasLogin = !!kid.user_id;
                return (
                  <div 
                    key={kid.id}
                    className="flex items-center gap-3 p-3 bg-card rounded-xl border border-border/50"
                  >
                    <span className="text-2xl">{kid.avatar_url || '👧'}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">{kid.name}</p>
                      <p className="text-xs text-muted-foreground">{kid.total_earnings} Quest Coins</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {hasLogin ? (
                        <div className="flex items-center gap-1 text-xs text-primary bg-accent/30 px-2 py-1 rounded-full">
                          <CheckCircle className="w-3 h-3" />
                          <span>Can login</span>
                        </div>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onSetupKidLogin?.(kid)}
                          className="text-xs"
                        >
                          <KeyRound className="w-3 h-3 mr-1" />
                          Setup Login
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEditKid?.(kid)}
                        className="p-2 h-auto"
                      >
                        <Pencil className="w-4 h-4 text-muted-foreground" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
