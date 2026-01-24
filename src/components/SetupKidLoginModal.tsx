import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, User, Lock, UserCheck } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Profile {
  id: string;
  name: string;
  avatar_url: string | null;
  user_id?: string | null;
}

interface SetupKidLoginModalProps {
  open: boolean;
  onClose: () => void;
  kid: Profile | null;
  onSuccess: () => void;
}

export function SetupKidLoginModal({ open, onClose, kid, onSuccess }: SetupKidLoginModalProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!kid) return;

    // Validate username (alphanumeric, underscores, 3-20 chars)
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    if (!usernameRegex.test(username)) {
      toast.error('Username must be 3-20 characters (letters, numbers, underscores only)');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('create-kid-login', {
        body: {
          kidProfileId: kid.id,
          username: username.toLowerCase(),
          password,
        },
      });

      if (error) throw error;

      if (data.error) {
        throw new Error(data.error);
      }

      toast.success(
        <div>
          <p className="font-medium">Login created for {kid.name}!</p>
          <p className="text-sm text-muted-foreground mt-1">
            Username: <strong>{username.toLowerCase()}</strong>
          </p>
        </div>
      );
      onSuccess();
      handleClose();
    } catch (err: any) {
      console.error('Error creating kid login:', err);
      toast.error(err.message || 'Failed to create login credentials');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setUsername('');
    setPassword('');
    setConfirmPassword('');
    onClose();
  };

  // Generate suggested username from kid's name
  const suggestedUsername = kid?.name
    ?.toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .slice(0, 15) || '';

  if (!kid) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-primary" />
            Setup Login for {kid.name}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Create a username and password so {kid.name} can sign in on their own device.
          </p>

          <div className="space-y-2">
            <Label htmlFor="kid-username">Username</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="kid-username"
                type="text"
                placeholder={suggestedUsername || "username"}
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                className="pl-10"
                required
                minLength={3}
                maxLength={20}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Letters, numbers, and underscores only (3-20 characters)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="kid-password">Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="kid-password"
                type="password"
                placeholder="At least 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10"
                required
                minLength={6}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="kid-confirm-password">Confirm Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="kid-confirm-password"
                type="password"
                placeholder="Confirm password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="pl-10"
                required
              />
            </div>
          </div>

          <div className="bg-muted/50 rounded-lg p-3 text-sm">
            <p className="font-medium text-foreground mb-1">📝 Remember these credentials!</p>
            <p className="text-muted-foreground">
              Write down the username and password so {kid.name} can use them to log in.
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={handleClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} className="flex-1">
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Login'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
