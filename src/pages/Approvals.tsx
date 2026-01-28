import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { BottomNav } from '@/components/BottomNav';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { Chore, Profile } from '@/types/database';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { awardXPForChore } from '@/hooks/useGamificationActions';
import { showBadgeUnlockToast, showLevelUpToast } from '@/components/BadgeUnlockToast';

const Approvals = () => {
  const [activeTab, setActiveTab] = useState('approvals');
  const [pendingChores, setPendingChores] = useState<Chore[]>([]);
  const [householdProfiles, setHouseholdProfiles] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const { user, profile, isParent, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();

  // Redirect non-parents
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    } else if (!authLoading && profile && !isParent) {
      navigate('/');
    }
  }, [user, profile, isParent, authLoading, navigate]);

  // Fetch pending chores and profiles
  useEffect(() => {
    if (profile?.household_id && isParent) {
      fetchData();
    }
  }, [profile?.household_id, isParent]);

  const fetchData = async () => {
    if (!profile?.household_id) return;
    setIsLoading(true);

    try {
      const [choresRes, profilesRes] = await Promise.all([
        supabase
          .from('chores')
          .select('*')
          .eq('household_id', profile.household_id)
          .eq('status', 'pending_verification')
          .order('completed_at', { ascending: false }),
        supabase
          .from('profiles')
          .select('*')
          .eq('household_id', profile.household_id)
      ]);

      if (choresRes.error) throw choresRes.error;
      if (profilesRes.error) throw profilesRes.error;

      setPendingChores(choresRes.data || []);
      setHouseholdProfiles(profilesRes.data || []);
    } catch (err) {
      console.error('Error fetching data:', err);
      toast.error('Failed to load approvals');
    } finally {
      setIsLoading(false);
    }
  };

  const getKidName = (profileId: string | null) => {
    if (!profileId) return 'Unknown';
    const kid = householdProfiles.find(p => p.id === profileId);
    return kid?.name || 'Unknown';
  };

  const getKidAvatar = (profileId: string | null) => {
    if (!profileId) return '👧';
    const kid = householdProfiles.find(p => p.id === profileId);
    return kid?.avatar_url || '👧';
  };

  const handleApprove = async (chore: Chore) => {
    if (!profile || !chore.assigned_to) return;

    try {
      // Update chore status
      const { error: choreError } = await supabase
        .from('chores')
        .update({ status: 'completed' })
        .eq('id', chore.id);

      if (choreError) throw choreError;

      // Create earning record with pending status first
      const { data: earningData, error: earningInsertError } = await supabase
        .from('earnings')
        .insert({
          profile_id: chore.assigned_to,
          chore_id: chore.id,
          amount: chore.reward_value,
          status: 'pending'
        })
        .select('id')
        .single();

      if (earningInsertError) throw earningInsertError;

      // Update to approved to trigger the total_earnings update
      const { error: earningUpdateError } = await supabase
        .from('earnings')
        .update({
          status: 'approved',
          approved_by: profile.id,
          approved_at: new Date().toISOString()
        })
        .eq('id', earningData.id);

      if (earningUpdateError) throw earningUpdateError;

      // Award XP and check for badges
      const gamificationResult = await awardXPForChore(chore.assigned_to);
      
      // Show level up notification if leveled up
      if (gamificationResult.xpResult?.leveled_up) {
        showLevelUpToast(gamificationResult.xpResult.new_level);
      }
      
      // Show badge unlock notifications
      gamificationResult.unlockedBadges.forEach(badge => {
        setTimeout(() => showBadgeUnlockToast(badge), 500);
      });

      setPendingChores(prev => prev.filter(c => c.id !== chore.id));
      
      const xpMessage = gamificationResult.xpAwarded > 0 
        ? ` (+${gamificationResult.xpAwarded} XP)` 
        : '';
      toast.success(`Approved! +${chore.reward_value} Quest Coins${xpMessage} for ${getKidName(chore.assigned_to)} 🪙`);
    } catch (err) {
      console.error('Error approving chore:', err);
      toast.error('Failed to approve chore');
    }
  };

  const handleReject = async (chore: Chore) => {
    if (!profile) return;

    try {
      // Reset chore to claimed status so kid can try again
      const { error } = await supabase
        .from('chores')
        .update({ 
          status: 'claimed',
          completed_at: null
        })
        .eq('id', chore.id);

      if (error) throw error;

      setPendingChores(prev => prev.filter(c => c.id !== chore.id));
      toast.info(`Sent "${chore.title}" back to ${getKidName(chore.assigned_to)} to try again`);
    } catch (err) {
      console.error('Error rejecting chore:', err);
      toast.error('Failed to reject chore');
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isParent) {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <Header 
        userName={profile?.name || ''} 
        userAvatar={profile?.avatar_url || '👨‍👩‍👧'} 
      />
      
      <main className="max-w-md mx-auto px-4 py-6 space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground">Approval Queue</h1>
          <p className="text-muted-foreground mt-1">Review completed chores</p>
        </div>

        {pendingChores.length === 0 ? (
          <div className="text-center py-16 bg-muted/30 rounded-xl">
            <span className="text-5xl mb-4 block">✅</span>
            <p className="text-lg font-medium text-foreground">All caught up!</p>
            <p className="text-muted-foreground mt-1">No chores waiting for approval</p>
          </div>
        ) : (
          <div className="space-y-4">
            {pendingChores.map((chore) => (
              <div
                key={chore.id}
                className="bg-card border rounded-xl p-4 space-y-4"
              >
                <div className="flex items-start gap-3">
                  <span className="text-3xl">{chore.icon}</span>
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground">{chore.title}</h3>
                    {chore.description && (
                      <p className="text-sm text-muted-foreground mt-0.5">{chore.description}</p>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-lg">{getKidAvatar(chore.assigned_to)}</span>
                      <span className="text-sm font-medium">{getKidName(chore.assigned_to)}</span>
                      <span className="text-xs text-muted-foreground">
                        • {chore.completed_at ? new Date(chore.completed_at).toLocaleDateString() : 'Just now'}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-bold text-primary">🪙 {chore.reward_value}</span>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => handleReject(chore)}
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Try Again
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={() => handleApprove(chore)}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Approve
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
      
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
};

export default Approvals;
