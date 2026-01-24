import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { BottomNav } from '@/components/BottomNav';
import { AddRewardModal } from '@/components/AddRewardModal';
import { Button } from '@/components/ui/button';
import { Loader2, Plus, ShoppingCart, Coins, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface Reward {
  id: string;
  household_id: string;
  name: string;
  description: string | null;
  cost: number;
  icon: string;
  is_active: boolean;
  is_purchasable: boolean;
  purchase_url: string | null;
  purchase_price: number | null;
  created_at: string;
}

const Rewards = () => {
  const [activeTab, setActiveTab] = useState('rewards');
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [redeemingId, setRedeemingId] = useState<string | null>(null);

  const { user, profile, isParent, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  // Fetch rewards
  useEffect(() => {
    if (profile?.household_id) {
      fetchRewards();
    }
  }, [profile?.household_id]);

  const fetchRewards = async () => {
    if (!profile?.household_id) return;
    setIsLoading(true);

    try {
      const { data, error } = await supabase
        .from('rewards')
        .select('*')
        .eq('household_id', profile.household_id)
        .eq('is_active', true)
        .order('cost', { ascending: true });

      if (error) throw error;
      setRewards(data || []);
    } catch (err) {
      console.error('Error fetching rewards:', err);
      toast.error('Failed to load rewards');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddReward = async (reward: { 
    name: string; 
    description: string; 
    cost: number; 
    icon: string;
    is_purchasable?: boolean;
    purchase_url?: string;
    purchase_price?: number;
  }) => {
    if (!profile?.household_id) return;

    try {
      const { data, error } = await supabase
        .from('rewards')
        .insert({
          household_id: profile.household_id,
          name: reward.name,
          description: reward.description || null,
          cost: reward.cost,
          icon: reward.icon,
          is_purchasable: reward.is_purchasable || false,
          purchase_url: reward.purchase_url || null,
          purchase_price: reward.purchase_price || null,
          created_by: profile.id
        })
        .select()
        .single();

      if (error) throw error;
      setRewards([...rewards, data]);
      toast.success('Reward added! 🎁');
    } catch (err) {
      console.error('Error adding reward:', err);
      toast.error('Failed to add reward');
      throw err;
    }
  };

  const handleRedeem = async (reward: Reward) => {
    if (!profile || isParent) return;

    if (profile.total_earnings < reward.cost) {
      toast.error(`Not enough earnings! You need $${(reward.cost - profile.total_earnings).toFixed(2)} more.`);
      return;
    }

    setRedeemingId(reward.id);
    try {
      const { error } = await supabase.rpc('redeem_reward', {
        p_reward_id: reward.id,
        p_profile_id: profile.id
      });

      if (error) throw error;

      toast.success(
        <div className="flex items-center gap-2">
          <span className="text-2xl">{reward.icon}</span>
          <span>You redeemed <strong>{reward.name}</strong>! 🎉</span>
        </div>
      );

      // Refresh to update earnings display
      window.location.reload();
    } catch (err: any) {
      console.error('Error redeeming reward:', err);
      if (err.message?.includes('insufficient_funds')) {
        toast.error('Not enough earnings for this reward');
      } else {
        toast.error('Failed to redeem reward');
      }
    } finally {
      setRedeemingId(null);
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <Header 
        userName={profile?.name || ''} 
        userAvatar={profile?.avatar_url || (isParent ? '👨‍👩‍👧' : '👧')} 
      />
      
      <main className="max-w-md mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Coins className="h-6 w-6 text-amber-500" />
              Rewards Store
            </h1>
            <p className="text-muted-foreground text-sm">
              {isParent ? 'Manage rewards for your kids' : `Your balance: ${profile?.total_earnings || 0} Quest Coins`}
            </p>
          </div>
          {isParent && (
            <Button onClick={() => setIsAddModalOpen(true)}>
              <Plus className="w-4 h-4" />
              Add
            </Button>
          )}
        </div>

        {rewards.length === 0 ? (
          <div className="text-center py-16 bg-muted/30 rounded-xl">
            <span className="text-5xl mb-4 block">🎁</span>
            <p className="text-lg font-medium text-foreground">No rewards yet</p>
            <p className="text-muted-foreground mt-1">
              {isParent ? 'Add some rewards for your kids to earn!' : 'Ask your parent to add some rewards!'}
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {rewards.map((reward) => {
              const canAfford = !isParent && (profile?.total_earnings || 0) >= reward.cost;
              const isRedeeming = redeemingId === reward.id;

              return (
                <div
                  key={reward.id}
                  className="bg-card border rounded-xl p-4 flex items-center gap-4"
                >
                  <div className="w-14 h-14 bg-muted/50 rounded-xl flex items-center justify-center text-3xl">
                    {reward.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground truncate">{reward.name}</h3>
                    {reward.description && (
                      <p className="text-sm text-muted-foreground truncate">{reward.description}</p>
                    )}
                    <div className="flex items-center gap-1 text-lg font-bold text-amber-600 mt-1">
                      <Coins className="w-4 h-4" />
                      {reward.cost}
                    </div>
                    {reward.is_purchasable && reward.purchase_url && isParent && (
                      <a 
                        href={reward.purchase_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-xs text-primary flex items-center gap-1 mt-1 hover:underline"
                      >
                        <ExternalLink className="w-3 h-3" />
                        Buy (${reward.purchase_price?.toFixed(2) || 'View'})
                      </a>
                    )}
                  </div>
                  {!isParent && (
                    <Button
                      size="sm"
                      variant={canAfford ? 'default' : 'outline'}
                      disabled={!canAfford || isRedeeming}
                      onClick={() => handleRedeem(reward)}
                    >
                      {isRedeeming ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <ShoppingCart className="w-4 h-4" />
                          {canAfford ? 'Get' : 'Need more'}
                        </>
                      )}
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
      
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />

      <AddRewardModal
        open={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={handleAddReward}
      />
    </div>
  );
};

export default Rewards;
