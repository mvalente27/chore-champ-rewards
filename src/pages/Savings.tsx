import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { BottomNav } from '@/components/BottomNav';
import { SavingsGoalCard } from '@/components/SavingsGoalCard';
import { AddSavingsGoalModal } from '@/components/AddSavingsGoalModal';
import { Button } from '@/components/ui/button';
import { Loader2, Plus, Target, Coins, PiggyBank } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface SavingsGoal {
  id: string;
  profile_id: string;
  name: string;
  icon: string;
  target_amount: number;
  current_amount: number;
  is_completed: boolean;
  created_at: string;
}

export default function Savings() {
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('savings');
  const [balance, setBalance] = useState(0);

  const { user, profile, isParent, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (profile?.id) {
      fetchGoals();
      setBalance(profile.total_earnings);
    }
  }, [profile?.id, profile?.total_earnings]);

  const fetchGoals = async () => {
    if (!profile?.id) return;
    setIsLoading(true);

    try {
      const { data, error } = await supabase
        .from('savings_goals')
        .select('*')
        .eq('profile_id', profile.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setGoals(data || []);
    } catch (err) {
      console.error('Error fetching savings goals:', err);
      toast.error('Failed to load savings goals');
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate available balance (total earnings minus what's saved)
  const totalSaved = goals.reduce((sum, goal) => sum + goal.current_amount, 0);
  const availableBalance = balance - totalSaved;

  const handleAddGoal = async (goalData: { name: string; target_amount: number; icon: string }) => {
    if (!profile?.id) return;

    try {
      const { data, error } = await supabase
        .from('savings_goals')
        .insert({
          profile_id: profile.id,
          name: goalData.name,
          target_amount: goalData.target_amount,
          icon: goalData.icon
        })
        .select()
        .single();

      if (error) throw error;
      
      setGoals(prev => [data, ...prev]);
      toast.success('Savings goal created! 🎯');
    } catch (err) {
      console.error('Error creating savings goal:', err);
      toast.error('Failed to create savings goal');
      throw err;
    }
  };

  const handleAddFunds = async (goalId: string, amount: number) => {
    if (amount > availableBalance) {
      toast.error('Not enough available coins!');
      return;
    }

    try {
      const goal = goals.find(g => g.id === goalId);
      if (!goal) return;

      const newAmount = goal.current_amount + amount;
      const isCompleted = newAmount >= goal.target_amount;

      const { error } = await supabase
        .from('savings_goals')
        .update({ 
          current_amount: newAmount,
          is_completed: isCompleted,
          completed_at: isCompleted ? new Date().toISOString() : null
        })
        .eq('id', goalId);

      if (error) throw error;

      setGoals(prev => prev.map(g => 
        g.id === goalId 
          ? { ...g, current_amount: newAmount, is_completed: isCompleted }
          : g
      ));

      if (isCompleted) {
        toast.success(`🎉 Goal "${goal.name}" completed! You did it!`);
      } else {
        toast.success(`Added ${amount} coins to ${goal.name}!`);
      }
    } catch (err) {
      console.error('Error adding funds:', err);
      toast.error('Failed to add funds');
    }
  };

  const handleWithdraw = async (goalId: string, amount: number) => {
    const goal = goals.find(g => g.id === goalId);
    if (!goal || amount > goal.current_amount) {
      toast.error('Cannot withdraw more than saved amount!');
      return;
    }

    try {
      const newAmount = goal.current_amount - amount;

      const { error } = await supabase
        .from('savings_goals')
        .update({ 
          current_amount: newAmount,
          is_completed: false,
          completed_at: null
        })
        .eq('id', goalId);

      if (error) throw error;

      setGoals(prev => prev.map(g => 
        g.id === goalId 
          ? { ...g, current_amount: newAmount, is_completed: false }
          : g
      ));

      toast.success(`Withdrew ${amount} coins from ${goal.name}`);
    } catch (err) {
      console.error('Error withdrawing:', err);
      toast.error('Failed to withdraw');
    }
  };

  const handleDeleteGoal = async (goalId: string) => {
    const goal = goals.find(g => g.id === goalId);
    if (!goal) return;

    if (goal.current_amount > 0) {
      const confirmed = confirm(`This goal has ${goal.current_amount} coins saved. Deleting it will return those coins to your available balance. Continue?`);
      if (!confirmed) return;
    }

    try {
      const { error } = await supabase
        .from('savings_goals')
        .delete()
        .eq('id', goalId);

      if (error) throw error;

      setGoals(prev => prev.filter(g => g.id !== goalId));
      toast.success('Goal deleted');
    } catch (err) {
      console.error('Error deleting goal:', err);
      toast.error('Failed to delete goal');
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Parents see a different view - list of kids' savings goals
  if (isParent) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <Header 
          userName={profile?.name || ''} 
          userAvatar={profile?.avatar_url || '👨‍👩‍👧'} 
        />
        <main className="max-w-md mx-auto px-4 py-6">
          <div className="text-center py-16 bg-muted/30 rounded-xl">
            <PiggyBank className="w-16 h-16 mx-auto text-primary mb-4" />
            <h2 className="text-xl font-bold mb-2">Savings Goals</h2>
            <p className="text-muted-foreground">
              This feature is for kids to save towards rewards.
            </p>
          </div>
        </main>
        <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
      </div>
    );
  }

  const activeGoals = goals.filter(g => !g.is_completed);
  const completedGoals = goals.filter(g => g.is_completed);

  return (
    <div className="min-h-screen bg-background pb-24">
      <Header 
        userName={profile?.name || ''} 
        userAvatar={profile?.avatar_url || '👧'} 
      />
      
      <main className="max-w-md mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <PiggyBank className="h-7 w-7 text-pink-500" />
              My Savings
            </h1>
            <p className="text-muted-foreground text-sm">Save up for awesome rewards!</p>
          </div>
          <Button onClick={() => setIsAddModalOpen(true)}>
            <Plus className="w-4 h-4" />
            New Goal
          </Button>
        </div>

        {/* Balance Card */}
        <div className="bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30 rounded-2xl p-4">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-muted-foreground">Available to Save</p>
              <div className="flex items-center gap-2 mt-1">
                <Coins className="w-5 h-5 text-amber-500" />
                <span className="text-2xl font-bold">{availableBalance}</span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Total Saved</p>
              <div className="flex items-center gap-2 mt-1 justify-end">
                <Target className="w-5 h-5 text-primary" />
                <span className="text-2xl font-bold text-primary">{totalSaved}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Active Goals */}
        {activeGoals.length === 0 && completedGoals.length === 0 ? (
          <div className="text-center py-16 bg-muted/30 rounded-xl">
            <Target className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-lg font-medium text-foreground">No savings goals yet</p>
            <p className="text-muted-foreground mt-1">
              Create a goal to start saving for something special!
            </p>
            <Button onClick={() => setIsAddModalOpen(true)} className="mt-4">
              <Plus className="w-4 h-4 mr-2" />
              Create First Goal
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {activeGoals.length > 0 && (
              <div className="space-y-3">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Active Goals
                </h2>
                {activeGoals.map((goal) => (
                  <SavingsGoalCard
                    key={goal.id}
                    goal={goal}
                    availableBalance={availableBalance}
                    onAddFunds={handleAddFunds}
                    onWithdraw={handleWithdraw}
                    onDelete={handleDeleteGoal}
                  />
                ))}
              </div>
            )}

            {completedGoals.length > 0 && (
              <div className="space-y-3">
                <h2 className="text-lg font-semibold flex items-center gap-2 text-green-600">
                  🏆 Completed Goals
                </h2>
                {completedGoals.map((goal) => (
                  <SavingsGoalCard
                    key={goal.id}
                    goal={goal}
                    availableBalance={availableBalance}
                    onAddFunds={handleAddFunds}
                    onWithdraw={handleWithdraw}
                    onDelete={handleDeleteGoal}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </main>
      
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />

      <AddSavingsGoalModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={handleAddGoal}
      />
    </div>
  );
}
