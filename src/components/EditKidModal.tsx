import { useState, useEffect } from 'react';
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
import { Pencil, KeyRound, CheckCircle, Cake } from 'lucide-react';
import { Profile } from '@/types/database';

const kidAvatars = ['👧', '👦', '🧒', '👶', '🧒🏻', '🧒🏽', '🧒🏿', '👧🏻', '👧🏽', '👧🏿', '👦🏻', '👦🏽', '👦🏿'];

// Calculate age tier from birth date
function getAgeTier(birthDate: Date): { tier: string; label: string; emoji: string } {
  const today = new Date();
  const age = today.getFullYear() - birthDate.getFullYear();
  
  if (age <= 8) return { tier: 'explorer', label: 'Explorer (5-8)', emoji: '🌟' };
  if (age <= 12) return { tier: 'builder', label: 'Builder (9-12)', emoji: '🔨' };
  return { tier: 'achiever', label: 'Achiever (13-18)', emoji: '🚀' };
}

interface EditKidModalProps {
  open: boolean;
  onClose: () => void;
  kid: (Profile & { birth_date?: string | null }) | null;
  onSave: (id: string, name: string, avatar: string, birthDate: string | null) => Promise<void>;
  onSetupLogin: () => void;
  onResetPassword?: () => void;
}

export function EditKidModal({ open, onClose, kid, onSave, onSetupLogin, onResetPassword }: EditKidModalProps) {
  const [name, setName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('👧');
  const [birthDate, setBirthDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (kid) {
      setName(kid.name);
      setSelectedAvatar(kid.avatar_url || '👧');
      setBirthDate(kid.birth_date || '');
    }
  }, [kid]);

  const handleSubmit = async () => {
    if (!kid || !name.trim() || name.trim().length < 2) return;

    setIsSubmitting(true);
    try {
      await onSave(kid.id, name.trim(), selectedAvatar, birthDate || null);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    onClose();
  };

  const hasLogin = !!kid?.user_id;
  
  // Calculate age tier preview if birthdate is set
  const ageTierPreview = birthDate ? getAgeTier(new Date(birthDate)) : null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-sm mx-4 rounded-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Pencil className="w-5 h-5 text-primary" />
            Edit Kid
          </DialogTitle>
          <DialogDescription>
            Update {kid?.name}'s profile information.
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

          {/* Birthday Input */}
          <div className="space-y-2">
            <Label htmlFor="kid-birthday" className="flex items-center gap-2">
              <Cake className="w-4 h-4 text-muted-foreground" />
              Birthday
            </Label>
            <Input
              id="kid-birthday"
              type="date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              disabled={isSubmitting}
              max={new Date().toISOString().split('T')[0]}
              min={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split('T')[0]}
            />
            <p className="text-xs text-muted-foreground">
              Used to personalize quizzes and games for their age
            </p>
            
            {/* Age Tier Preview */}
            {ageTierPreview && (
              <div className="flex items-center gap-2 p-2 bg-accent/30 rounded-lg mt-2">
                <span className="text-lg">{ageTierPreview.emoji}</span>
                <span className="text-sm font-medium text-foreground">
                  {ageTierPreview.label}
                </span>
              </div>
            )}
          </div>

          {/* Login Status */}
          <div className="space-y-2">
            <Label>Login Credentials</Label>
            {hasLogin ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2 p-3 bg-accent/30 rounded-lg border border-accent/40">
                  <CheckCircle className="w-4 h-4 text-primary" />
                  <span className="text-sm text-foreground">Login credentials set up</span>
                </div>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    onClose();
                    onResetPassword?.();
                  }}
                >
                  <KeyRound className="w-4 h-4 mr-2" />
                  Reset Password
                </Button>
              </div>
            ) : (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  onClose();
                  onSetupLogin();
                }}
              >
                <KeyRound className="w-4 h-4 mr-2" />
                Setup Login Credentials
              </Button>
            )}
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
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
