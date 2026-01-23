import { useState } from 'react';
import { Header } from '@/components/Header';
import { BottomNav } from '@/components/BottomNav';
import { ChoreCard } from '@/components/ChoreCard';
import { EarningsCard } from '@/components/EarningsCard';
import { StatsGrid } from '@/components/StatsGrid';
import { AddChoreModal } from '@/components/AddChoreModal';
import { Button } from '@/components/ui/button';
import { Plus, Sparkles } from 'lucide-react';
import { Chore } from '@/types/chores';
import { toast } from 'sonner';

const initialChores: Chore[] = [
  {
    id: '1',
    title: 'Make Your Bed',
    description: 'Pull up the covers and arrange your pillows neatly.',
    reward: { type: 'cash', value: 2, unit: '' },
    difficulty: 'easy',
    icon: '🛏️',
    isCompleted: false,
  },
  {
    id: '2',
    title: 'Walk the Dog',
    description: 'Take Buddy for a 15-minute walk around the block.',
    reward: { type: 'cash', value: 5, unit: '' },
    difficulty: 'medium',
    icon: '🐕',
    isCompleted: false,
  },
  {
    id: '3',
    title: 'Do the Dishes',
    description: 'Load and run the dishwasher after dinner.',
    reward: { type: 'tv', value: 30, unit: 'min' },
    difficulty: 'medium',
    icon: '🍽️',
    isCompleted: true,
  },
  {
    id: '4',
    title: 'Clean Your Room',
    description: 'Pick up toys, organize desk, vacuum the floor.',
    reward: { type: 'playdate', value: 1, unit: 'hr' },
    difficulty: 'hard',
    icon: '🧹',
    isCompleted: false,
  },
  {
    id: '5',
    title: 'Read for 20 Minutes',
    description: 'Read your book or educational material quietly.',
    reward: { type: 'treat', value: 1, unit: '' },
    difficulty: 'easy',
    icon: '📚',
    isCompleted: false,
  },
];

const Index = () => {
  const [activeTab, setActiveTab] = useState('home');
  const [chores, setChores] = useState<Chore[]>(initialChores);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isKidView, setIsKidView] = useState(true);

  const handleClaimChore = (id: string) => {
    const chore = chores.find(c => c.id === id);
    if (chore) {
      toast.success(
        <div className="flex items-center gap-2">
          <span className="text-2xl">{chore.icon}</span>
          <span>You claimed <strong>{chore.title}</strong>! Go get it done!</span>
        </div>
      );
    }
  };

  const handleCompleteChore = (id: string) => {
    setChores(chores.map(c => 
      c.id === id ? { ...c, isCompleted: true, completedAt: new Date() } : c
    ));
    const chore = chores.find(c => c.id === id);
    if (chore) {
      toast.success(
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          <span>Awesome! <strong>{chore.title}</strong> is complete! 🎉</span>
        </div>
      );
    }
  };

  const handleAddChore = (newChore: Omit<Chore, 'id' | 'isCompleted'>) => {
    const chore: Chore = {
      ...newChore,
      id: Date.now().toString(),
      isCompleted: false,
    };
    setChores([chore, ...chores]);
    toast.success('New chore added! 🎯');
  };

  const completedToday = chores.filter(c => c.isCompleted).length;
  const pendingChores = chores.filter(c => !c.isCompleted).length;
  const totalEarnings = chores
    .filter(c => c.isCompleted && c.reward.type === 'cash')
    .reduce((sum, c) => sum + c.reward.value, 0);

  return (
    <div className="min-h-screen bg-background pb-24">
      <Header userName="Alex" userAvatar="👧" />
      
      <main className="max-w-md mx-auto px-4 py-6 space-y-6">
        {/* View Toggle */}
        <div className="flex items-center justify-center gap-2 bg-muted p-1 rounded-xl">
          <button
            onClick={() => setIsKidView(true)}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-semibold transition-all ${
              isKidView ? 'bg-card shadow-card text-foreground' : 'text-muted-foreground'
            }`}
          >
            👧 Kid View
          </button>
          <button
            onClick={() => setIsKidView(false)}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-semibold transition-all ${
              !isKidView ? 'bg-card shadow-card text-foreground' : 'text-muted-foreground'
            }`}
          >
            👨‍👩‍👧 Parent View
          </button>
        </div>

        {/* Earnings Card */}
        <EarningsCard 
          totalEarnings={totalEarnings + 24.50}
          weeklyEarnings={12.00}
          savingsGoal={100}
          onInvest={() => toast.info('Investing feature coming soon! 📈')}
        />
        
        {/* Stats Grid */}
        <StatsGrid 
          completedToday={completedToday}
          pendingChores={pendingChores}
          currentStreak={5}
          totalStars={12}
        />
        
        {/* Chores Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-foreground">
              {isKidView ? 'Available Chores' : 'Manage Chores'}
            </h2>
            {!isKidView && (
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
          
          <div className="space-y-4">
            {chores.map((chore) => (
              <ChoreCard 
                key={chore.id}
                chore={chore}
                onClaim={handleClaimChore}
                onComplete={handleCompleteChore}
                isKidView={isKidView}
              />
            ))}
          </div>
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
