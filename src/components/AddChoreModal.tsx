import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { DollarSign, Tv, Users, Cookie, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { RewardType, Chore } from '@/types/chores';

interface AddChoreModalProps {
  open: boolean;
  onClose: () => void;
  onAdd: (chore: Omit<Chore, 'id' | 'isCompleted'>) => void;
}

const rewardTypes: { type: RewardType; icon: typeof DollarSign; label: string; unit: string }[] = [
  { type: 'cash', icon: DollarSign, label: 'Cash', unit: '' },
  { type: 'tv', icon: Tv, label: 'TV Time', unit: 'min' },
  { type: 'playdate', icon: Users, label: 'Play Date', unit: 'hr' },
  { type: 'treat', icon: Cookie, label: 'Treat', unit: '' },
];

const choreEmojis = ['🧹', '🍽️', '🛏️', '🐕', '📚', '🧺', '🗑️', '🌱', '🚗', '🧽'];

const difficulties = ['easy', 'medium', 'hard'] as const;

export function AddChoreModal({ open, onClose, onAdd }: AddChoreModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedReward, setSelectedReward] = useState<RewardType>('cash');
  const [rewardValue, setRewardValue] = useState('');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('easy');
  const [selectedEmoji, setSelectedEmoji] = useState('🧹');

  const handleSubmit = () => {
    if (!title || !rewardValue) return;
    
    const rewardConfig = rewardTypes.find(r => r.type === selectedReward)!;
    
    onAdd({
      title,
      description,
      reward: {
        type: selectedReward,
        value: parseFloat(rewardValue),
        unit: rewardConfig.unit,
      },
      difficulty,
      icon: selectedEmoji,
    });
    
    // Reset form
    setTitle('');
    setDescription('');
    setRewardValue('');
    setSelectedReward('cash');
    setDifficulty('easy');
    setSelectedEmoji('🧹');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md mx-4 rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Sparkles className="w-5 h-5 text-primary" />
            Add New Chore
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-5 py-2">
          <div className="space-y-2">
            <Label>Pick an Icon</Label>
            <div className="flex gap-2 flex-wrap">
              {choreEmojis.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => setSelectedEmoji(emoji)}
                  className={cn(
                    "w-10 h-10 text-xl rounded-xl transition-all",
                    selectedEmoji === emoji 
                      ? "bg-primary/20 ring-2 ring-primary" 
                      : "bg-muted hover:bg-muted/80"
                  )}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="title">Chore Name</Label>
            <Input 
              id="title"
              placeholder="e.g., Make your bed"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="h-12 rounded-xl"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea 
              id="description"
              placeholder="What needs to be done?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="rounded-xl resize-none"
              rows={2}
            />
          </div>
          
          <div className="space-y-2">
            <Label>Reward Type</Label>
            <div className="grid grid-cols-4 gap-2">
              {rewardTypes.map((reward) => {
                const Icon = reward.icon;
                return (
                  <button
                    key={reward.type}
                    onClick={() => setSelectedReward(reward.type)}
                    className={cn(
                      "flex flex-col items-center gap-1 p-3 rounded-xl transition-all",
                      selectedReward === reward.type
                        ? `reward-${reward.type} ring-2 ring-current`
                        : "bg-muted hover:bg-muted/80"
                    )}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-xs font-semibold">{reward.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="value">
              Reward Amount {rewardTypes.find(r => r.type === selectedReward)?.unit && 
                `(${rewardTypes.find(r => r.type === selectedReward)?.unit})`}
            </Label>
            <Input 
              id="value"
              type="number"
              placeholder={selectedReward === 'cash' ? '5.00' : '30'}
              value={rewardValue}
              onChange={(e) => setRewardValue(e.target.value)}
              className="h-12 rounded-xl"
            />
          </div>
          
          <div className="space-y-2">
            <Label>Difficulty</Label>
            <div className="flex gap-2">
              {difficulties.map((d) => (
                <button
                  key={d}
                  onClick={() => setDifficulty(d)}
                  className={cn(
                    "flex-1 py-2.5 px-4 rounded-xl font-semibold text-sm transition-all",
                    difficulty === d
                      ? d === 'easy' 
                        ? 'bg-primary text-primary-foreground' 
                        : d === 'medium'
                          ? 'bg-secondary text-secondary-foreground'
                          : 'bg-accent text-accent-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  )}
                >
                  {d.charAt(0).toUpperCase() + d.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>
        
        <div className="flex gap-3 pt-2">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button variant="hero" onClick={handleSubmit} className="flex-1" disabled={!title || !rewardValue}>
            Add Chore
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
