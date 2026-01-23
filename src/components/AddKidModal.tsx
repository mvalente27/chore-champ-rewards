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
import { UserPlus } from 'lucide-react';

const kidAvatars = ['👧', '👦', '🧒', '👶', '🧒🏻', '🧒🏽', '🧒🏿', '👧🏻', '👧🏽', '👧🏿', '👦🏻', '👦🏽', '👦🏿'];

interface AddKidModalProps {
  open: boolean;
  onClose: () => void;
  onAdd: (name: string, avatar: string) => Promise<void>;
}

export function AddKidModal({ open, onClose, onAdd }: AddKidModalProps) {
  const [name, setName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('👧');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim() || name.trim().length < 2) return;

    setIsSubmitting(true);
    try {
      await onAdd(name.trim(), selectedAvatar);
      setName('');
      setSelectedAvatar('👧');
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setName('');
    setSelectedAvatar('👧');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-sm mx-4 rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <UserPlus className="w-5 h-5 text-primary" />
            Add a Kid
          </DialogTitle>
          <DialogDescription>
            Add a child to your household. They'll be able to claim and complete chores!
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 pt-2">
          {/* Avatar Selection */}
          <div className="space-y-2">
            <Label>Choose an Avatar</Label>
            <div className="flex flex-wrap gap-2">
              {kidAvatars.map((avatar) => (
                <button
                  key={avatar}
                  type="button"
                  onClick={() => setSelectedAvatar(avatar)}
                  className={`w-10 h-10 text-xl rounded-full transition-all ${
                    selectedAvatar === avatar
                      ? 'bg-primary/20 ring-2 ring-primary scale-110'
                      : 'bg-muted hover:bg-muted/80'
                  }`}
                >
                  {avatar}
                </button>
              ))}
            </div>
          </div>

          {/* Name Input */}
          <div className="space-y-2">
            <Label htmlFor="kid-name">Kid's Name</Label>
            <Input
              id="kid-name"
              placeholder="e.g., Emma, Jake"
              value={name}
              onChange={(e) => setName(e.target.value)}
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
              disabled={!name.trim() || name.trim().length < 2 || isSubmitting}
            >
              {isSubmitting ? 'Adding...' : 'Add Kid'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
