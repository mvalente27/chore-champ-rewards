import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { BottomNav } from '@/components/BottomNav';
import { ChoreCard } from '@/components/ChoreCard';
import { EarningsCard } from '@/components/EarningsCard';
import { StatsGrid } from '@/components/StatsGrid';
import { AddChoreModal } from '@/components/AddChoreModal';
import { Button } from '@/components/ui/button';
import { Plus, Sparkles, Loader2 } from 'lucide-react';
import { Chore as LegacyChore } from '@/types/chores';
import { Chore, Profile, ChoreStatus } from '@/types/database';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

const Index = () => {
  const [activeTab, setActiveTab] = useState('home');
  const [chores, setChores] = useState<Chore[]>([]);
  const [householdProfiles, setHouseholdProfiles] = useState<Profile[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const { user, profile, isParent, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  // Fetch chores and profiles
  useEffect(() => {
    if (profile?.household_id) {
      fetchChores();
      fetchProfiles();
    }
  }, [profile?.household_id]);

  const fetchChores = async () => {
    if (!profile?.household_id) return;
    
    try {
      const { data, error } = await supabase
        .from('chores')
        .select('*')
        .eq('household_id', profile.household_id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setChores(data || []);
    } catch (err) {
      console.error('Error fetching chores:', err);
      toast.error('Failed to load chores');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchProfiles = async () => {
    if (!profile?.household_id) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('household_id', profile.household_id);

      if (error) throw error;
      setHouseholdProfiles(data || []);
    } catch (err) {
      console.error('Error fetching profiles:', err);
    }
  };

  const handleClaimChore = async (id: string) => {
    if (!profile) return;
    
    const chore = chores.find(c => c.id === id);
    if (!chore) return;

    try {
      const { error } = await supabase
        .from('chores')
        .update({ 
          assigned_to: profile.id,
          status: 'claimed' as ChoreStatus
        })
        .eq('id', id);

      if (error) throw error;

      setChores(chores.map(c => 
        c.id === id ? { ...c, assigned_to: profile.id, status: 'claimed' as ChoreStatus } : c
      ));

      toast.success(
        <div className="flex items-center gap-2">
          <span className="text-2xl">{chore.icon}</span>
          <span>You claimed <strong>{chore.title}</strong>! Go get it done!</span>
        </div>
      );
    } catch (err) {
      console.error('Error claiming chore:', err);
      toast.error('Failed to claim chore');
    }
  };

  const handleCompleteChore = async (id: string) => {
    if (!profile) return;
    
    const chore = chores.find(c => c.id === id);
    if (!chore) return;

    try {
      const { error } = await supabase
        .from('chores')
        .update({ 
          status: 'pending_verification' as ChoreStatus,
          completed_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;

      setChores(chores.map(c => 
        c.id === id ? { ...c, status: 'pending_verification' as ChoreStatus, completed_at: new Date().toISOString() } : c
      ));

      toast.success(
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          <span>Nice work! Waiting for parent approval 🎉</span>
        </div>
      );
    } catch (err) {
      console.error('Error completing chore:', err);
      toast.error('Failed to complete chore');
    }
  };

  const handleApproveChore = async (id: string) => {
    if (!profile || !isParent) return;

    const chore = chores.find(c => c.id === id);
    if (!chore || !chore.assigned_to) return;

    try {
      // Update chore status
      const { error: choreError } = await supabase
        .from('chores')
        .update({ status: 'completed' as ChoreStatus })
        .eq('id', id);

      if (choreError) throw choreError;

      // Create earning record
      const { error: earningError } = await supabase
        .from('earnings')
        .insert({
          profile_id: chore.assigned_to,
          chore_id: id,
          amount: chore.reward_value,
          status: 'approved',
          approved_by: profile.id,
          approved_at: new Date().toISOString()
        });

      if (earningError) throw earningError;

      setChores(chores.map(c => 
        c.id === id ? { ...c, status: 'completed' as ChoreStatus } : c
      ));

      toast.success('Chore approved! Reward added! 💰');
    } catch (err) {
      console.error('Error approving chore:', err);
      toast.error('Failed to approve chore');
    }
  };

  const handleAddChore = async (newChore: Omit<LegacyChore, 'id' | 'isCompleted'>) => {
    if (!profile?.household_id) return;

    try {
      const { data, error } = await supabase
        .from('chores')
        .insert({
          household_id: profile.household_id,
          title: newChore.title,
          description: newChore.description,
          reward_value: newChore.reward.type === 'cash' ? newChore.reward.value : 0,
          icon: newChore.icon,
          created_by: profile.id,
          status: 'available' as ChoreStatus
        })
        .select()
        .single();

      if (error) throw error;

      setChores([data, ...chores]);
      toast.success('New chore added! 🎯');
    } catch (err) {
      console.error('Error adding chore:', err);
      toast.error('Failed to add chore');
    }
  };

  // Convert database chores to legacy format for ChoreCard
  const convertToLegacyChore = (chore: Chore): LegacyChore => ({
    id: chore.id,
    title: chore.title,
    description: chore.description || '',
    reward: { type: 'cash', value: chore.reward_value, unit: '' },
    difficulty: chore.reward_value >= 5 ? 'hard' : chore.reward_value >= 2 ? 'medium' : 'easy',
    icon: chore.icon,
    isCompleted: chore.status === 'completed',
    assignedTo: chore.assigned_to || undefined,
    completedAt: chore.completed_at ? new Date(chore.completed_at) : undefined,
  });

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const completedToday = chores.filter(c => c.status === 'completed').length;
  const pendingChores = chores.filter(c => c.status === 'available' || c.status === 'claimed').length;
  const pendingApproval = chores.filter(c => c.status === 'pending_verification').length;

  // Filter chores based on role
  const displayChores = isParent 
    ? chores 
    : chores.filter(c => c.status === 'available' || c.assigned_to === profile.id);

  return (
    <div className="min-h-screen bg-background pb-24">
      <Header 
        userName={profile.name} 
        userAvatar={profile.avatar_url || (isParent ? '👨‍👩‍👧' : '👧')} 
      />
      
      <main className="max-w-md mx-auto px-4 py-6 space-y-6">
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

        {/* Earnings Card */}
        <EarningsCard 
          totalEarnings={profile.total_earnings}
          weeklyEarnings={0}
          savingsGoal={100}
          onInvest={() => toast.info('Savings goal feature coming soon! 📈')}
        />
        
        {/* Stats Grid */}
        <StatsGrid 
          completedToday={completedToday}
          pendingChores={pendingChores}
          currentStreak={5}
          totalStars={completedToday * 2}
        />

        {/* Pending Approvals Banner for Parents */}
        {isParent && pendingApproval > 0 && (
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex items-center gap-3">
            <span className="text-2xl">⏳</span>
            <div>
              <p className="font-semibold text-foreground">{pendingApproval} chore{pendingApproval > 1 ? 's' : ''} waiting for approval</p>
              <p className="text-sm text-muted-foreground">Review and approve completed chores</p>
            </div>
          </div>
        )}
        
        {/* Chores Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-foreground">
              {isParent ? 'All Chores' : 'Your Chores'}
            </h2>
            {isParent && (
              <Button 
                variant="default" 
                size="sm"
                onClick={() => setIsAddModalOpen(true)}
              >
                <Plus className="w-4 h-4" />
                Add
              </Button>
            )}
          </div>
          
          {displayChores.length === 0 ? (
            <div className="text-center py-12 bg-muted/30 rounded-xl">
              <span className="text-4xl mb-3 block">🎯</span>
              <p className="text-muted-foreground">
                {isParent ? 'No chores yet. Add some!' : 'No chores available right now.'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {displayChores.map((chore) => (
                <ChoreCard 
                  key={chore.id}
                  chore={convertToLegacyChore(chore)}
                  onClaim={handleClaimChore}
                  onComplete={handleCompleteChore}
                  onApprove={isParent ? handleApproveChore : undefined}
                  isKidView={!isParent}
                  choreStatus={chore.status}
                />
              ))}
            </div>
          )}
        </div>
      </main>
      
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
      
      <AddChoreModal 
        open={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={handleAddChore}
      />
    </div>
  );
};

export default Index;
