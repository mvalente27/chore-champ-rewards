import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { BottomNav } from '@/components/BottomNav';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, XCircle, RotateCcw } from 'lucide-react';
import { Chore, Profile, ChoreClaim, ChoreClaimStatus } from '@/types/database';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { awardXPForChore } from '@/hooks/useGamificationActions';
import { showBadgeUnlockToast, showLevelUpToast } from '@/components/BadgeUnlockToast';
import { SmartAvatar } from '@/components/avatar';

// Helper to safely display icon - returns fallback if it looks like JSON
const getSafeIcon = (icon: string | null | undefined): string => {
  if (!icon) return '📋';
  const trimmed = icon.trim();
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    return '📋';
  }
  return icon;
};

interface ClaimWithDetails extends ChoreClaim {
  chore: Chore;
  profile: Profile;
}

const Approvals = () => {
  const [activeTab, setActiveTab] = useState('approvals');
  const [pendingClaims, setPendingClaims] = useState<ClaimWithDetails[]>([]);
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

  // Fetch pending claims
  useEffect(() => {
    if (profile?.household_id && isParent) {
      fetchPendingClaims();
    }
  }, [profile?.household_id, isParent]);

  const fetchPendingClaims = async () => {
    if (!profile?.household_id) return;
    setIsLoading(true);

    try {
      // Get all chores in household
      const { data: chores, error: choresError } = await supabase
        .from('chores')
        .select('*')
        .eq('household_id', profile.household_id);

      if (choresError) throw choresError;

      // Get all profiles in household
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .eq('household_id', profile.household_id);

      if (profilesError) throw profilesError;

      // Get all pending claims for these chores
      const choreIds = chores?.map(c => c.id) || [];
      if (choreIds.length === 0) {
        setPendingClaims([]);
        setIsLoading(false);
        return;
      }

      const { data: claims, error: claimsError } = await supabase
        .from('chore_claims')
        .select('*')
        .in('chore_id', choreIds)
        .eq('status', 'pending_verification')
        .order('completed_at', { ascending: false });

      if (claimsError) throw claimsError;

      // Combine claims with chore and profile details
      const claimsWithDetails: ClaimWithDetails[] = (claims || []).map(claim => {
        const chore = chores?.find(c => c.id === claim.chore_id);
        const claimProfile = profiles?.find(p => p.id === claim.profile_id);
        return {
          ...claim,
          chore: chore!,
          profile: claimProfile!,
        } as ClaimWithDetails;
      }).filter(c => c.chore && c.profile);

      setPendingClaims(claimsWithDetails);
    } catch (err) {
      console.error('Error fetching pending claims:', err);
      toast.error('Failed to load approvals');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (claim: ClaimWithDetails) => {
    if (!profile) return;

    try {
      // Update claim status to completed
      const { error: claimError } = await supabase
        .from('chore_claims')
        .update({ 
          status: 'completed' as ChoreClaimStatus,
          approved_by: profile.id,
          approved_at: new Date().toISOString()
        })
        .eq('id', claim.id);

      if (claimError) throw claimError;

      // Create earning record directly as approved - trigger will update total_earnings
      const { error: earningError } = await supabase
        .from('earnings')
        .insert({
          profile_id: claim.profile_id,
          chore_id: claim.chore_id,
          amount: claim.chore.reward_value,
          status: 'approved',
          approved_by: profile.id,
          approved_at: new Date().toISOString()
        });

      if (earningError) throw earningError;

      // Award XP and check for badges
      const gamificationResult = await awardXPForChore(claim.profile_id);
      
      // Show level up notification if leveled up
      if (gamificationResult.xpResult?.leveled_up) {
        showLevelUpToast(gamificationResult.xpResult.new_level);
      }
      
      // Show badge unlock notifications
      gamificationResult.unlockedBadges.forEach(badge => {
        setTimeout(() => showBadgeUnlockToast(badge), 500);
      });

      setPendingClaims(prev => prev.filter(c => c.id !== claim.id));
      
      const xpMessage = gamificationResult.xpAwarded > 0 
        ? ` (+${gamificationResult.xpAwarded} XP)` 
        : '';
      toast.success(`Approved! +${claim.chore.reward_value} Quest Coins${xpMessage} for ${claim.profile.name} 🪙`);
    } catch (err) {
      console.error('Error approving claim:', err);
      toast.error('Failed to approve chore');
    }
  };

  const handleTryAgain = async (claim: ClaimWithDetails) => {
    if (!profile) return;

    try {
      // Reset claim to claimed status so kid can try again
      const { error } = await supabase
        .from('chore_claims')
        .update({ 
          status: 'claimed' as ChoreClaimStatus,
          completed_at: null
        })
        .eq('id', claim.id);

      if (error) throw error;

      setPendingClaims(prev => prev.filter(c => c.id !== claim.id));
      toast.info(`Sent "${claim.chore.title}" back to ${claim.profile.name} to try again`);
    } catch (err) {
      console.error('Error resetting claim:', err);
      toast.error('Failed to reset chore');
    }
  };

  const handleDeny = async (claim: ClaimWithDetails, reason?: string) => {
    if (!profile) return;

    try {
      // Set claim to denied status - kid must acknowledge
      const { error } = await supabase
        .from('chore_claims')
        .update({ 
          status: 'denied',
          denial_reason: reason || 'Chore was not completed properly',
          approved_by: profile.id,
          approved_at: new Date().toISOString()
        })
        .eq('id', claim.id);

      if (error) throw error;

      setPendingClaims(prev => prev.filter(c => c.id !== claim.id));
      toast.warning(`Denied "${claim.chore.title}" - ${claim.profile.name} will be notified`);
    } catch (err) {
      console.error('Error denying claim:', err);
      toast.error('Failed to deny chore');
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
        totalCoins={profile?.total_earnings}
        profileId={profile?.id}
      />
      
      <main className="max-w-md mx-auto px-4 py-6 space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground">Approval Queue</h1>
          <p className="text-muted-foreground mt-1">Review completed chores</p>
        </div>

        {pendingClaims.length === 0 ? (
          <div className="text-center py-16 bg-muted/30 rounded-xl">
            <span className="text-5xl mb-4 block">✅</span>
            <p className="text-lg font-medium text-foreground">All caught up!</p>
            <p className="text-muted-foreground mt-1">No chores waiting for approval</p>
          </div>
        ) : (
          <div className="space-y-4">
            {pendingClaims.map((claim) => (
              <div
                key={claim.id}
                className="bg-card border rounded-xl p-4 space-y-4"
              >
                <div className="flex items-start gap-3">
                  <span className="text-3xl">{getSafeIcon(claim.chore.icon)}</span>
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground">{claim.chore.title}</h3>
                    {claim.chore.description && (
                      <p className="text-sm text-muted-foreground mt-0.5">{claim.chore.description}</p>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      <SmartAvatar avatarData={claim.profile.avatar_url} size={24} />
                      <span className="text-sm font-medium">{claim.profile.name}</span>
                      <span className="text-xs text-muted-foreground">
                        • {claim.completed_at ? new Date(claim.completed_at).toLocaleDateString() : 'Just now'}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-bold text-primary">🪙 {claim.chore.reward_value}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleTryAgain(claim)}
                    >
                      <RotateCcw className="w-4 h-4 mr-1" />
                      Try Again
                    </Button>
                    <Button
                      size="sm"
                      className="flex-1"
                      onClick={() => handleApprove(claim)}
                    >
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Approve
                    </Button>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="w-full"
                    onClick={() => handleDeny(claim)}
                  >
                    <XCircle className="w-4 h-4 mr-1" />
                    Deny Chore
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
