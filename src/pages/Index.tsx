import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Header } from '@/components/Header';
import { BottomNav } from '@/components/BottomNav';
import { HomeView } from '@/components/HomeView';
import { ChoresView } from '@/components/ChoresView';
import { ProfileView } from '@/components/ProfileView';
import { AddChoreModal } from '@/components/AddChoreModal';
import { EditChoreModal } from '@/components/EditChoreModal';
import { AddKidModal } from '@/components/AddKidModal';
import { EditKidModal } from '@/components/EditKidModal';
import { SetupKidLoginModal } from '@/components/SetupKidLoginModal';
import { ResetKidPasswordModal } from '@/components/ResetKidPasswordModal';
import { Sparkles, Loader2 } from 'lucide-react';
import { Chore as LegacyChore } from '@/types/chores';
import { Chore, Profile, ChoreStatus, ChoreClaim, ChoreClaimStatus } from '@/types/database';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { useStreak } from '@/hooks/useStreak';
import { supabase } from '@/integrations/supabase/client';
import { fireConfetti } from '@/lib/confetti';

const Index = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'home';
  const [activeTab, setActiveTab] = useState(initialTab);
  const [chores, setChores] = useState<Chore[]>([]);
  const [myClaims, setMyClaims] = useState<ChoreClaim[]>([]);
  const [deniedClaims, setDeniedClaims] = useState<(ChoreClaim & { chore?: Chore })[]>([]);
  const [householdProfiles, setHouseholdProfiles] = useState<Profile[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingChore, setEditingChore] = useState<Chore | null>(null);
  const [isAddKidModalOpen, setIsAddKidModalOpen] = useState(false);
  const [isSetupLoginModalOpen, setIsSetupLoginModalOpen] = useState(false);
  const [isResetPasswordModalOpen, setIsResetPasswordModalOpen] = useState(false);
  const [isEditKidModalOpen, setIsEditKidModalOpen] = useState(false);
  const [selectedKidForLogin, setSelectedKidForLogin] = useState<Profile | null>(null);
  const [selectedKidForPasswordReset, setSelectedKidForPasswordReset] = useState<Profile | null>(null);
  const [selectedKidForEdit, setSelectedKidForEdit] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { user, profile, isParent, signOut, isLoading: authLoading } = useAuth();
  const { streak } = useStreak(profile?.id);
  const navigate = useNavigate();

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  // Sync URL tab param with activeTab state
  useEffect(() => {
    const tabFromUrl = searchParams.get('tab');
    if (tabFromUrl && tabFromUrl !== activeTab) {
      setActiveTab(tabFromUrl);
    }
  }, [searchParams]);

  // Fetch chores, claims, and profiles
  useEffect(() => {
    if (profile?.household_id) {
      fetchChores();
      fetchProfiles();
      if (!isParent) {
        fetchMyClaims();
        fetchDeniedClaims();
      }
    }
  }, [profile?.household_id, isParent]);

  const fetchChores = async () => {
    if (!profile?.household_id) return;
    setIsLoading(true);
    
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

  const fetchMyClaims = async () => {
    if (!profile?.id) return;
    
    try {
      const { data, error } = await supabase
        .from('chore_claims')
        .select('*')
        .eq('profile_id', profile.id)
        .in('status', ['claimed', 'pending_verification']);

      if (error) throw error;
      setMyClaims(data as ChoreClaim[] || []);
    } catch (err) {
      console.error('Error fetching claims:', err);
    }
  };

  const fetchDeniedClaims = async () => {
    if (!profile?.id) return;
    
    try {
      // Fetch denied claims that haven't been acknowledged
      const { data: claimsData, error: claimsError } = await supabase
        .from('chore_claims')
        .select('*')
        .eq('profile_id', profile.id)
        .eq('status', 'denied')
        .is('acknowledged_at', null);

      if (claimsError) throw claimsError;

      // Fetch chore details for each denied claim
      if (claimsData && claimsData.length > 0) {
        const choreIds = claimsData.map(c => c.chore_id);
        const { data: choresData, error: choresError } = await supabase
          .from('chores')
          .select('*')
          .in('id', choreIds);

        if (choresError) throw choresError;

        const claimsWithChores = claimsData.map(claim => ({
          ...claim,
          chore: choresData?.find(c => c.id === claim.chore_id)
        })) as (ChoreClaim & { chore?: Chore })[];

        setDeniedClaims(claimsWithChores);
      } else {
        setDeniedClaims([]);
      }
    } catch (err) {
      console.error('Error fetching denied claims:', err);
    }
  };

  const handleAcknowledgeDenial = async (claimId: string) => {
    try {
      const { error } = await supabase
        .from('chore_claims')
        .update({ acknowledged_at: new Date().toISOString() })
        .eq('id', claimId);

      if (error) throw error;

      setDeniedClaims(deniedClaims.filter(c => c.id !== claimId));
      toast.info('Got it! You can try again with another chore.');
    } catch (err) {
      console.error('Error acknowledging denial:', err);
      toast.error('Failed to acknowledge');
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

  const handleClaimChore = async (choreId: string) => {
    if (!profile) return;
    
    const chore = chores.find(c => c.id === choreId);
    if (!chore) return;

    // Check if user already has an active claim on this chore
    const existingClaim = myClaims.find(c => c.chore_id === choreId);
    if (existingClaim) {
      toast.error('You already have this chore claimed!');
      return;
    }

    try {
      // Create a new claim in the chore_claims table
      const { data, error } = await supabase
        .from('chore_claims')
        .insert({
          chore_id: choreId,
          profile_id: profile.id,
          status: 'claimed'
        })
        .select()
        .single();

      if (error) throw error;
      
      // Add to local claims
      setMyClaims([...myClaims, data as ChoreClaim]);

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

  const handleCompleteChore = async (choreId: string, claimId: string) => {
    if (!profile) return;
    
    const chore = chores.find(c => c.id === choreId);
    if (!chore) return;

    try {
      // Update claim status to pending_verification
      const { data, error } = await supabase
        .from('chore_claims')
        .update({ 
          status: 'pending_verification',
          completed_at: new Date().toISOString()
        })
        .eq('id', claimId)
        .eq('profile_id', profile.id)
        .select()
        .single();

      if (error) throw error;
      
      if (!data) {
        throw new Error('Failed to submit chore - no rows updated');
      }

      // Update local claims state
      setMyClaims(myClaims.map(c => 
        c.id === claimId ? { ...c, status: 'pending_verification' as ChoreClaimStatus, completed_at: new Date().toISOString() } : c
      ));

      // Celebrate with confetti!
      fireConfetti();

      toast.success(
        <div className="flex items-center gap-2">
          <span className="text-2xl">🎉</span>
          <span><strong>{chore.title}</strong> submitted! Waiting for parent approval.</span>
        </div>
      );
    } catch (err) {
      console.error('Error completing chore:', err);
      toast.error('Failed to submit chore');
      fetchMyClaims(); // Refresh to get correct state
    }
  };

  // Parent approval is now handled on the Approvals page using chore_claims
  // This function is kept for compatibility but redirects to Approvals
  const handleApproveChore = async (id: string) => {
    navigate('/approvals');
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

  const handleAddKid = async (name: string, avatar: string, birthDate: string | null) => {
    if (!profile?.household_id) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .insert({
          household_id: profile.household_id,
          name: name,
          type: 'kid',
          avatar_url: avatar,
          birth_date: birthDate,
        })
        .select()
        .single();

      if (error) throw error;

      setHouseholdProfiles([...householdProfiles, data]);
      toast.success(`${name} has been added to your household! 🎉`);
    } catch (err) {
      console.error('Error adding kid:', err);
      toast.error('Failed to add kid');
      throw err;
    }
  };

  const handleEditKid = async (id: string, name: string, avatar: string, birthDate: string | null) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ name, avatar_url: avatar, birth_date: birthDate })
        .eq('id', id);

      if (error) throw error;

      setHouseholdProfiles(householdProfiles.map(p => 
        p.id === id ? { ...p, name, avatar_url: avatar, birth_date: birthDate } : p
      ));
      toast.success('Kid profile updated! ✨');
    } catch (err) {
      console.error('Error updating kid:', err);
      toast.error('Failed to update kid profile');
      throw err;
    }
  };

  const handleEditChore = (legacyChore: LegacyChore) => {
    // Find the original database chore
    const dbChore = chores.find(c => c.id === legacyChore.id);
    if (dbChore) {
      setEditingChore(dbChore);
      setIsEditModalOpen(true);
    }
  };

  const handleSaveChore = async (updatedChore: LegacyChore) => {
    if (!profile?.household_id) return;

    try {
      const { error } = await supabase
        .from('chores')
        .update({
          title: updatedChore.title,
          description: updatedChore.description,
          reward_value: updatedChore.reward.type === 'cash' ? updatedChore.reward.value : 0,
          icon: updatedChore.icon,
        })
        .eq('id', updatedChore.id);

      if (error) throw error;

      setChores(chores.map(c => 
        c.id === updatedChore.id 
          ? { 
              ...c, 
              title: updatedChore.title,
              description: updatedChore.description,
              reward_value: updatedChore.reward.type === 'cash' ? updatedChore.reward.value : 0,
              icon: updatedChore.icon,
            }
          : c
      ));
      toast.success('Chore updated! ✏️');
    } catch (err) {
      console.error('Error updating chore:', err);
      toast.error('Failed to update chore');
    }
  };

  const handleDeleteChore = async (id: string) => {
    try {
      const { error } = await supabase
        .from('chores')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setChores(chores.filter(c => c.id !== id));
      toast.success('Chore deleted');
    } catch (err) {
      console.error('Error deleting chore:', err);
      toast.error('Failed to delete chore');
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
      <div className="min-h-screen bg-background flex items-center justify-center px-6">
        <div className="w-full max-w-sm rounded-xl border bg-card p-6 text-card-foreground shadow-sm">
          <h1 className="text-lg font-semibold">Finishing setup…</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Your account is signed in, but your household profile hasn't been created yet. This usually happens after an early signup hiccup.
          </p>
          <div className="mt-4 flex items-center gap-3">
            <Loader2 className="w-4 h-4 animate-spin text-primary" />
            <span className="text-sm text-muted-foreground">Retrying automatically</span>
          </div>
          <div className="mt-6 flex gap-3">
            <button
              className="px-4 py-2 text-sm font-medium rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/80"
              onClick={async () => {
                await signOut();
                navigate('/auth');
              }}
            >
              Sign out
            </button>
            <button
              className="px-4 py-2 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={() => window.location.reload()}
            >
              Reload
            </button>
          </div>
        </div>
      </div>
    );
  }

  // For stats, count claims instead of chore status
  const completedToday = myClaims.filter(c => c.status === 'completed').length;
  const pendingChores = chores.length; // All chores are always available
  const pendingApproval = myClaims.filter(c => c.status === 'pending_verification').length;

  // Show all chores (they're templates now)
  const displayChores = chores;

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return (
          <HomeView
            profile={profile}
            isParent={isParent}
            householdProfiles={householdProfiles}
            completedToday={completedToday}
            pendingChores={pendingChores}
            pendingApproval={pendingApproval}
            currentStreak={streak}
            onAddKid={() => setIsAddKidModalOpen(true)}
            onSetupKidLogin={(kid) => {
              setSelectedKidForLogin(kid);
              setIsSetupLoginModalOpen(true);
            }}
            onEditKid={(kid) => {
              setSelectedKidForEdit(kid);
              setIsEditKidModalOpen(true);
            }}
          />
        );
      case 'chores':
        return (
          <ChoresView
            chores={displayChores}
            myClaims={myClaims}
            deniedClaims={deniedClaims}
            isParent={isParent}
            onClaim={handleClaimChore}
            onComplete={handleCompleteChore}
            onAcknowledgeDenial={handleAcknowledgeDenial}
            onApprove={isParent ? handleApproveChore : undefined}
            onEdit={isParent ? handleEditChore : undefined}
            onAddChore={() => setIsAddModalOpen(true)}
          />
        );
      case 'profile':
        return (
          <ProfileView
            profile={profile}
            isParent={isParent}
            onSignOut={async () => {
              await signOut();
              navigate('/auth');
            }}
          />
        );
      default:
        return (
          <HomeView
            profile={profile}
            isParent={isParent}
            householdProfiles={householdProfiles}
            completedToday={completedToday}
            pendingChores={pendingChores}
            pendingApproval={pendingApproval}
            currentStreak={streak}
            onAddKid={() => setIsAddKidModalOpen(true)}
            onSetupKidLogin={(kid) => {
              setSelectedKidForLogin(kid);
              setIsSetupLoginModalOpen(true);
            }}
            onEditKid={(kid) => {
              setSelectedKidForEdit(kid);
              setIsEditKidModalOpen(true);
            }}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <Header 
        userName={profile.name} 
        userAvatar={profile.avatar_url || (isParent ? '👨‍👩‍👧' : '👧')} 
      />
      
      <main className="max-w-md mx-auto px-4 py-6 space-y-6">
        {renderContent()}
      </main>
      
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
      
      <AddChoreModal 
        open={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={handleAddChore}
      />

      <AddKidModal
        open={isAddKidModalOpen}
        onClose={() => setIsAddKidModalOpen(false)}
        onAdd={handleAddKid}
      />

      <EditKidModal
        open={isEditKidModalOpen}
        onClose={() => {
          setIsEditKidModalOpen(false);
          setSelectedKidForEdit(null);
        }}
        kid={selectedKidForEdit}
        onSave={handleEditKid}
        onSetupLogin={() => {
          if (selectedKidForEdit) {
            setSelectedKidForLogin(selectedKidForEdit);
            setIsSetupLoginModalOpen(true);
          }
        }}
        onResetPassword={() => {
          if (selectedKidForEdit) {
            setSelectedKidForPasswordReset(selectedKidForEdit);
            setIsResetPasswordModalOpen(true);
          }
        }}
      />

      <EditChoreModal
        open={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingChore(null);
        }}
        onSave={handleSaveChore}
        onDelete={handleDeleteChore}
        chore={editingChore ? convertToLegacyChore(editingChore) : null}
      />

      <SetupKidLoginModal
        open={isSetupLoginModalOpen}
        onClose={() => {
          setIsSetupLoginModalOpen(false);
          setSelectedKidForLogin(null);
        }}
        kid={selectedKidForLogin}
        onSuccess={() => {
          fetchProfiles();
        }}
      />

      <ResetKidPasswordModal
        open={isResetPasswordModalOpen}
        onClose={() => {
          setIsResetPasswordModalOpen(false);
          setSelectedKidForPasswordReset(null);
        }}
        kid={selectedKidForPasswordReset}
        onSuccess={() => {}}
      />
    </div>
  );
};

export default Index;
