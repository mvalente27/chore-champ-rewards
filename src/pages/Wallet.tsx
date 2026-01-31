import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { BottomNav } from '@/components/BottomNav';
import { AwardCoinsModal } from '@/components/AwardCoinsModal';
import { Button } from '@/components/ui/button';
import { Loader2, Coins, Users, Gift } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface KidProfile {
  id: string;
  name: string;
  avatar_url: string | null;
  total_earnings: number;
}

export default function Wallet() {
  const [kids, setKids] = useState<KidProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAwardModalOpen, setIsAwardModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('wallet');

  const { user, profile, isParent, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (profile?.household_id && isParent) {
      fetchKids();
    } else if (profile && !isParent) {
      setIsLoading(false);
    }
  }, [profile?.household_id, isParent]);

  const fetchKids = async () => {
    if (!profile?.household_id) return;
    setIsLoading(true);

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name, avatar_url, total_earnings')
        .eq('household_id', profile.household_id)
        .eq('type', 'kid')
        .order('name');

      if (error) throw error;
      setKids(data || []);
    } catch (err) {
      console.error('Error fetching kids:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const totalKidCoins = kids.reduce((sum, kid) => sum + kid.total_earnings, 0);

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isParent) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <Header 
          userName={profile?.name || ''} 
          userAvatar={profile?.avatar_url || '👧'} 
          totalCoins={profile?.total_earnings}
          profileId={profile?.id}
        />
        <main className="max-w-md mx-auto px-4 py-6">
          <div className="text-center py-16">
            <Coins className="w-16 h-16 mx-auto text-amber-500 mb-4" />
            <h2 className="text-2xl font-bold mb-2">Your Quest Coins</h2>
            <p className="text-5xl font-bold text-primary mb-2">{profile?.total_earnings || 0}</p>
            <p className="text-muted-foreground">Complete chores to earn more coins!</p>
          </div>
        </main>
        <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
      </div>
    );
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
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Coins className="h-7 w-7 text-amber-500" />
            Quest Coins
          </h1>
          <p className="text-muted-foreground text-sm">Award coins to your kids for completing tasks</p>
        </div>

        {/* Stats Card */}
        <div className="bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-muted-foreground">Total Coins in Household</p>
              <p className="text-4xl font-bold text-foreground">{totalKidCoins}</p>
            </div>
            <div className="w-16 h-16 bg-amber-500/20 rounded-full flex items-center justify-center">
              <Coins className="w-8 h-8 text-amber-500" />
            </div>
          </div>
          
          <Button 
            onClick={() => setIsAwardModalOpen(true)} 
            className="w-full bg-amber-500 hover:bg-amber-600 text-primary-foreground"
            disabled={kids.length === 0}
          >
            <Gift className="w-4 h-4 mr-2" />
            Award Coins
          </Button>
        </div>

        {/* Kids List */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Users className="h-5 w-5" />
            Kids' Balances
          </h2>
          
          {kids.length === 0 ? (
            <div className="text-center py-8 bg-muted/30 rounded-xl">
              <p className="text-muted-foreground">No kids added yet</p>
              <p className="text-sm text-muted-foreground mt-1">Add kids from the Home screen</p>
            </div>
          ) : (
            <div className="space-y-2">
              {kids.map((kid) => (
                <div 
                  key={kid.id} 
                  className="flex items-center justify-between p-4 bg-card border rounded-xl"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-lg">
                      {kid.avatar_url || '👧'}
                    </div>
                    <span className="font-medium">{kid.name}</span>
                  </div>
                  <div className="flex items-center gap-1 text-lg font-bold text-amber-600">
                    <Coins className="w-5 h-5" />
                    {kid.total_earnings}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />

      <AwardCoinsModal
        isOpen={isAwardModalOpen}
        onClose={() => setIsAwardModalOpen(false)}
        kids={kids}
        onAwardComplete={fetchKids}
      />
    </div>
  );
}
