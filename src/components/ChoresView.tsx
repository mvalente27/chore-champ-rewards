import { ChoreCard } from '@/components/ChoreCard';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { Chore as LegacyChore } from '@/types/chores';
import { ChoreStatus } from '@/types/database';

interface Chore {
  id: string;
  household_id: string;
  title: string;
  description: string | null;
  reward_value: number;
  icon: string | null;
  status: ChoreStatus;
  assigned_to: string | null;
  completed_at: string | null;
  created_by: string | null;
  created_at: string;
}

interface ChoresViewProps {
  chores: Chore[];
  isParent: boolean;
  onClaim: (id: string) => void;
  onComplete: (id: string) => void;
  onApprove?: (id: string) => void;
  onEdit?: (chore: LegacyChore) => void;
  onAddChore: () => void;
}

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

export function ChoresView({
  chores,
  isParent,
  onClaim,
  onComplete,
  onApprove,
  onEdit,
  onAddChore,
}: ChoresViewProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-foreground">
          {isParent ? 'All Chores' : 'Your Chores'}
        </h2>
        {isParent && (
          <Button 
            variant="default" 
            size="sm"
            onClick={onAddChore}
          >
            <Plus className="w-4 h-4" />
            Add
          </Button>
        )}
      </div>
      
      {chores.length === 0 ? (
        <div className="text-center py-12 bg-muted/30 rounded-xl">
          <span className="text-4xl mb-3 block">🎯</span>
          <p className="text-muted-foreground">
            {isParent ? 'No chores yet. Add some!' : 'No chores available right now.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {chores.map((chore) => (
            <ChoreCard 
              key={chore.id}
              chore={convertToLegacyChore(chore)}
              onClaim={onClaim}
              onComplete={onComplete}
              onApprove={isParent ? onApprove : undefined}
              onEdit={isParent ? onEdit : undefined}
              isKidView={!isParent}
              choreStatus={chore.status}
            />
          ))}
        </div>
      )}
    </div>
  );
}
