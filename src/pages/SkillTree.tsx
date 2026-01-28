import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { BottomNav } from '@/components/BottomNav';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Loader2, ArrowLeft, Lock, Check, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { fireConfetti } from '@/lib/confetti';

interface Skill {
  id: string;
  name: string;
  description: string | null;
  icon: string;
  category: string;
  cost: number;
  effect_type: string;
  effect_value: number;
  unlock_level: number;
  prerequisite_skill_id: string | null;
}

interface UnlockedSkill {
  skill_id: string;
  is_active: boolean;
}

const SkillTree = () => {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [unlockedSkills, setUnlockedSkills] = useState<Map<string, UnlockedSkill>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [unlocking, setUnlocking] = useState<string | null>(null);

  const { user, profile, isParent, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    } else if (!authLoading && isParent) {
      navigate('/');
    }
  }, [user, authLoading, isParent, navigate]);

  useEffect(() => {
    if (profile && !isParent) {
      fetchSkills();
    }
  }, [profile, isParent]);

  const fetchSkills = async () => {
    if (!profile) return;
    setIsLoading(true);

    try {
      const [skillsRes, unlockedRes] = await Promise.all([
        supabase.from('skills').select('*').order('unlock_level', { ascending: true }),
        supabase.from('kid_skills').select('skill_id, is_active').eq('profile_id', profile.id),
      ]);

      if (skillsRes.error) throw skillsRes.error;
      if (unlockedRes.error) throw unlockedRes.error;

      setSkills(skillsRes.data || []);
      
      const unlocked = new Map<string, UnlockedSkill>();
      (unlockedRes.data || []).forEach(s => {
        unlocked.set(s.skill_id, { skill_id: s.skill_id, is_active: s.is_active });
      });
      setUnlockedSkills(unlocked);
    } catch (err) {
      console.error('Error fetching skills:', err);
      toast.error('Failed to load skills');
    } finally {
      setIsLoading(false);
    }
  };

  const canUnlock = (skill: Skill): boolean => {
    if (!profile) return false;
    if (unlockedSkills.has(skill.id)) return false;
    if (profile.level < skill.unlock_level) return false;
    if (profile.total_earnings < skill.cost) return false;
    if (skill.prerequisite_skill_id && !unlockedSkills.has(skill.prerequisite_skill_id)) return false;
    return true;
  };

  const handleUnlockSkill = async (skill: Skill) => {
    if (!profile || !canUnlock(skill)) return;
    setUnlocking(skill.id);

    try {
      // Deduct coins
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ total_earnings: profile.total_earnings - skill.cost })
        .eq('id', profile.id);

      if (updateError) throw updateError;

      // Unlock skill
      const { error: insertError } = await supabase
        .from('kid_skills')
        .insert({
          profile_id: profile.id,
          skill_id: skill.id,
          is_active: true,
        });

      if (insertError) throw insertError;

      // Update local state
      setUnlockedSkills(prev => {
        const newMap = new Map(prev);
        newMap.set(skill.id, { skill_id: skill.id, is_active: true });
        return newMap;
      });

      fireConfetti();
      toast.success(
        <div className="flex items-center gap-2">
          <span className="text-2xl">{skill.icon}</span>
          <span><strong>{skill.name}</strong> unlocked!</span>
        </div>
      );
    } catch (err) {
      console.error('Error unlocking skill:', err);
      toast.error('Failed to unlock skill');
    } finally {
      setUnlocking(null);
    }
  };

  const getSkillStatus = (skill: Skill): 'unlocked' | 'available' | 'locked' => {
    if (unlockedSkills.has(skill.id)) return 'unlocked';
    if (canUnlock(skill)) return 'available';
    return 'locked';
  };

  const groupedSkills = skills.reduce((acc, skill) => {
    if (!acc[skill.category]) acc[skill.category] = [];
    acc[skill.category].push(skill);
    return acc;
  }, {} as Record<string, Skill[]>);

  const categoryLabels: Record<string, { label: string; color: string }> = {
    xp: { label: 'XP Boosters', color: 'from-purple-500/20 to-purple-600/20' },
    coins: { label: 'Coin Masters', color: 'from-yellow-500/20 to-orange-500/20' },
    streak: { label: 'Streak Powers', color: 'from-blue-500/20 to-cyan-500/20' },
    quiz: { label: 'Quiz Skills', color: 'from-green-500/20 to-emerald-500/20' },
    special: { label: 'Special Abilities', color: 'from-pink-500/20 to-rose-500/20' },
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isParent) return null;

  return (
    <div className="min-h-screen bg-background pb-24">
      <Header 
        userName={profile?.name || ''} 
        userAvatar={profile?.avatar_url || '⚡'} 
      />
      
      <main className="max-w-md mx-auto px-4 py-6 space-y-6">
        <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Button>

        {/* Header Card */}
        <div className="bg-gradient-to-r from-primary/10 to-accent/10 rounded-2xl p-5 border border-border/50">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
              <Zap className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-foreground">Skill Tree</h1>
              <p className="text-sm text-muted-foreground">Spend coins to unlock powerful abilities!</p>
            </div>
          </div>
          
          <div className="flex items-center justify-between bg-card/50 rounded-xl p-3">
            <div>
              <p className="text-xs text-muted-foreground">Your Balance</p>
              <p className="text-lg font-bold text-foreground">🪙 {profile?.total_earnings || 0}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Your Level</p>
              <p className="text-lg font-bold text-primary">Lvl {profile?.level || 1}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Skills Unlocked</p>
              <p className="text-lg font-bold text-foreground">{unlockedSkills.size}/{skills.length}</p>
            </div>
          </div>
        </div>

        {/* Skills by Category */}
        {Object.entries(groupedSkills).map(([category, categorySkills]) => (
          <div key={category} className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              {categoryLabels[category]?.label || category}
            </h2>
            
            <div className="space-y-2">
              {categorySkills.map((skill) => {
                const status = getSkillStatus(skill);
                const isUnlocking = unlocking === skill.id;
                
                return (
                  <div
                    key={skill.id}
                    className={cn(
                      'rounded-xl p-4 border transition-all',
                      status === 'unlocked'
                        ? 'bg-gradient-to-r from-primary/10 to-primary/5 border-primary/30'
                        : status === 'available'
                        ? 'bg-card border-primary/20 hover:border-primary/40'
                        : 'bg-muted/30 border-border/50 opacity-60'
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className={cn(
                        'w-12 h-12 rounded-xl flex items-center justify-center text-2xl',
                        status === 'unlocked' ? 'bg-primary/20' : 'bg-muted'
                      )}>
                        {status === 'locked' ? <Lock className="w-5 h-5 text-muted-foreground" /> : skill.icon}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-foreground">{skill.name}</h3>
                          {status === 'unlocked' && (
                            <Check className="w-4 h-4 text-primary" />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-0.5">{skill.description}</p>
                        
                        <div className="flex items-center gap-3 mt-2 text-xs">
                          <span className="text-muted-foreground">
                            🪙 {skill.cost} coins
                          </span>
                          <span className="text-muted-foreground">
                            Lvl {skill.unlock_level}+
                          </span>
                        </div>
                      </div>
                      
                      {status === 'available' && (
                        <Button
                          size="sm"
                          onClick={() => handleUnlockSkill(skill)}
                          disabled={isUnlocking}
                        >
                          {isUnlocking ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            'Unlock'
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {skills.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Zap className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No skills available yet.</p>
          </div>
        )}
      </main>
      
      <BottomNav activeTab="home" onTabChange={() => {}} />
    </div>
  );
};

export default SkillTree;
