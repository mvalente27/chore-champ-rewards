import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Gift } from 'lucide-react';

const rewardIcons = ['🎁', '🎮', '🍦', '🎬', '📱', '🧸', '⚽', '🎨', '📚', '🎵', '🍕', '🎂'];

interface AddRewardModalProps {
  open: boolean;
  onClose: () => void;
  onAdd: (reward: { name: string; description: string; cost: number; icon: string }) => Promise<void>;
}

export function AddRewardModal({ open, onClose, onAdd }: AddRewardModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [cost, setCost] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('🎁');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim() || !cost || parseFloat(cost) <= 0) return;

    setIsSubmitting(true);
    try {
      await onAdd({
        name: name.trim(),
        description: description.trim(),
        cost: parseFloat(cost),
        icon: selectedIcon
      });
      setName('');
      setDescription('');
      setCost('');
      setSelectedIcon('🎁');
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setName('');
    setDescription('');
    setCost('');
    setSelectedIcon('🎁');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-sm mx-4 rounded-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Gift className="w-5 h-5 text-primary" />
            Add a Reward
          </DialogTitle>
          <DialogDescription>
            Create a reward that kids can redeem with their earnings
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Icon Selection */}
          <div className="space-y-2">
            <Label>Choose an Icon</Label>
            <div className="flex flex-wrap gap-2">
              {rewardIcons.map((icon) => (
                <button
                  key={icon}
                  type="button"
                  onClick={() => setSelectedIcon(icon)}
                  className={`w-10 h-10 text-xl rounded-full transition-all ${
                    selectedIcon === icon
                      ? 'bg-primary/20 ring-2 ring-primary scale-110'
                      : 'bg-muted hover:bg-muted/80'
                  }`}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>

          {/* Name Input */}
          <div className="space-y-2">
            <Label htmlFor="reward-name">Reward Name</Label>
            <Input
              id="reward-name"
              placeholder="e.g., 30 min screen time, Ice cream trip"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          {/* Description Input */}
          <div className="space-y-2">
            <Label htmlFor="reward-description">Description (optional)</Label>
            <Textarea
              id="reward-description"
              placeholder="Any details about this reward..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isSubmitting}
              rows={2}
            />
          </div>

          {/* Cost Input */}
          <div className="space-y-2">
            <Label htmlFor="reward-cost">Cost ($)</Label>
            <Input
              id="reward-cost"
              type="number"
              min="0.01"
              step="0.01"
              placeholder="5.00"
              value={cost}
              onChange={(e) => setCost(e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={handleClose} className="flex-1" disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              className="flex-1"
              disabled={!name.trim() || !cost || parseFloat(cost) <= 0 || isSubmitting}
            >
              {isSubmitting ? 'Adding...' : 'Add Reward'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
