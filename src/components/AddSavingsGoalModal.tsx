import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Target } from 'lucide-react';

const GOAL_ICONS = ['🎯', '🎮', '📱', '🎁', '🚲', '🎨', '📚', '🎸', '⚽', '🎭', '🎪', '🏆'];

interface AddSavingsGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (goal: { name: string; target_amount: number; icon: string }) => Promise<void>;
}

export function AddSavingsGoalModal({ isOpen, onClose, onAdd }: AddSavingsGoalModalProps) {
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('🎯');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const amount = parseFloat(targetAmount);
    if (!name.trim() || isNaN(amount) || amount <= 0) return;

    setIsLoading(true);
    try {
      await onAdd({
        name: name.trim(),
        target_amount: amount,
        icon: selectedIcon
      });
      setName('');
      setTargetAmount('');
      setSelectedIcon('🎯');
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setName('');
      setTargetAmount('');
      setSelectedIcon('🎯');
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Create Savings Goal
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Choose an Icon</Label>
            <div className="flex flex-wrap gap-2">
              {GOAL_ICONS.map((icon) => (
                <button
                  key={icon}
                  type="button"
                  onClick={() => setSelectedIcon(icon)}
                  className={`w-10 h-10 rounded-lg text-xl flex items-center justify-center transition-all ${
                    selectedIcon === icon
                      ? 'bg-primary text-primary-foreground scale-110'
                      : 'bg-muted hover:bg-muted/80'
                  }`}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="goal-name">Goal Name</Label>
            <Input
              id="goal-name"
              placeholder="e.g., New Video Game"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={50}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="target-amount">Target Amount (Quest Coins)</Label>
            <Input
              id="target-amount"
              type="number"
              placeholder="100"
              value={targetAmount}
              onChange={(e) => setTargetAmount(e.target.value)}
              min="1"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={handleClose} disabled={isLoading} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !name.trim() || !targetAmount} className="flex-1">
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Target className="h-4 w-4 mr-2" />}
              Create Goal
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
