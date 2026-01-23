import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { DollarSign, Tv, Users, Cookie, Pencil, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { RewardType, Chore } from '@/types/chores';

interface EditChoreModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (chore: Chore) => void;
  onDelete: (id: string) => void;
  chore: Chore | null;
}

type RewardInputType = 'numeric' | 'text';

const rewardTypes: { 
  type: RewardType; 
  icon: typeof DollarSign; 
  label: string; 
  unit: string;
  inputType: RewardInputType;
  placeholder: string;
}[] = [
  { type: 'cash', icon: DollarSign, label: 'Cash', unit: '$', inputType: 'numeric', placeholder: '5.00' },
  { type: 'tv', icon: Tv, label: 'Screen Time', unit: 'min', inputType: 'numeric', placeholder: '30' },
  { type: 'playdate', icon: Users, label: 'Play Date', unit: '', inputType: 'text', placeholder: 'e.g., With Jake on Saturday' },
  { type: 'treat', icon: Cookie, label: 'Treat', unit: '', inputType: 'text', placeholder: 'e.g., Ice cream, Cookie' },
];

const choreEmojis = ['🧹', '🍽️', '🛏️', '🐕', '📚', '🧺', '🗑️', '🌱', '🚗', '🧽'];

const difficulties = ['easy', 'medium', 'hard'] as const;

export function EditChoreModal({ open, onClose, onSave, onDelete, chore }: EditChoreModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedReward, setSelectedReward] = useState<RewardType>('cash');
  const [rewardValue, setRewardValue] = useState('');
  const [rewardText, setRewardText] = useState('');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('easy');
  const [selectedEmoji, setSelectedEmoji] = useState('🧹');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Populate form when chore changes
  useEffect(() => {
    if (chore) {
      setTitle(chore.title);
      setDescription(chore.description || '');
      setSelectedReward(chore.reward.type);
      setSelectedEmoji(chore.icon);
      setDifficulty(chore.difficulty);
      
      const config = rewardTypes.find(r => r.type === chore.reward.type);
      if (config?.inputType === 'text') {
        setRewardText(chore.reward.unit || '');
        setRewardValue('');
      } else {
        setRewardValue(chore.reward.value.toString());
        setRewardText('');
      }
    }
  }, [chore]);

  const currentRewardConfig = rewardTypes.find(r => r.type === selectedReward)!;
  const isTextReward = currentRewardConfig.inputType === 'text';

  const handleSubmit = () => {
    if (!chore || !title) return;
    if (isTextReward && !rewardText.trim()) return;
    if (!isTextReward && !rewardValue) return;
    
    onSave({
      ...chore,
      title,
      description,
      reward: {
        type: selectedReward,
        value: isTextReward ? 0 : parseFloat(rewardValue),
        unit: isTextReward ? rewardText.trim() : currentRewardConfig.unit,
      },
      difficulty,
      icon: selectedEmoji,
    });
    
    onClose();
  };

  const handleRewardTypeChange = (type: RewardType) => {
    setSelectedReward(type);
    setRewardValue('');
    setRewardText('');
  };

  const handleDelete = () => {
    if (chore) {
      onDelete(chore.id);
      setShowDeleteConfirm(false);
      onClose();
    }
  };

  const handleClose = () => {
    setShowDeleteConfirm(false);
    onClose();
  };

  const isFormValid = title && (isTextReward ? rewardText.trim() : rewardValue);

  if (!chore) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md mx-4 rounded-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Pencil className="w-5 h-5 text-primary" />
            Edit Chore
          </DialogTitle>
        </DialogHeader>
        
        {showDeleteConfirm ? (
          <div className="py-6 text-center space-y-4">
            <div className="text-4xl">🗑️</div>
            <p className="text-lg font-medium">Delete this chore?</p>
            <p className="text-sm text-muted-foreground">This action cannot be undone.</p>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={() => setShowDeleteConfirm(false)} className="flex-1">
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDelete} className="flex-1">
                Delete
              </Button>
            </div>
          </div>
        ) : (
          <>
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
                <Label htmlFor="edit-title">Chore Name</Label>
                <Input 
                  id="edit-title"
                  placeholder="e.g., Make your bed"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="h-12 rounded-xl"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-description">Description (optional)</Label>
                <Textarea 
                  id="edit-description"
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
                        onClick={() => handleRewardTypeChange(reward.type)}
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
                {isTextReward ? (
                  <>
                    <Label htmlFor="edit-rewardText">
                      {selectedReward === 'playdate' ? 'Play Date Details' : 'What Treat?'}
                    </Label>
                    <Input 
                      id="edit-rewardText"
                      type="text"
                      placeholder={currentRewardConfig.placeholder}
                      value={rewardText}
                      onChange={(e) => setRewardText(e.target.value)}
                      className="h-12 rounded-xl"
                    />
                  </>
                ) : (
                  <>
                    <Label htmlFor="edit-value">
                      Reward Amount {currentRewardConfig.unit && `(${currentRewardConfig.unit})`}
                    </Label>
                    <Input 
                      id="edit-value"
                      type="number"
                      min="0"
                      step={selectedReward === 'cash' ? '0.01' : '1'}
                      placeholder={currentRewardConfig.placeholder}
                      value={rewardValue}
                      onChange={(e) => setRewardValue(e.target.value)}
                      className="h-12 rounded-xl"
                    />
                  </>
                )}
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
              <Button 
                variant="outline" 
                size="icon"
                onClick={() => setShowDeleteConfirm(true)}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
              <Button variant="outline" onClick={handleClose} className="flex-1">
                Cancel
              </Button>
              <Button onClick={handleSubmit} className="flex-1" disabled={!isFormValid}>
                Save Changes
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
