import { Button } from '@/components/ui/button';
import { LogOut, User, Coins, Calendar, Home, Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface Profile {
  id: string;
  user_id?: string | null;
  household_id: string;
  name: string;
  type: 'parent' | 'kid';
  avatar_url: string | null;
  total_earnings: number;
  created_at?: string;
}

interface ProfileViewProps {
  profile: Profile;
  isParent: boolean;
  onSignOut: () => void;
}

// Generate family code from household ID (must match edge function logic)
function generateFamilyCode(householdId: string): string {
  return householdId.replace(/-/g, '').slice(0, 6).toUpperCase();
}

export function ProfileView({ profile, isParent, onSignOut }: ProfileViewProps) {
  const [copied, setCopied] = useState(false);
  const familyCode = generateFamilyCode(profile.household_id);

  const handleCopyFamilyCode = async () => {
    try {
      await navigator.clipboard.writeText(familyCode);
      setCopied(true);
      toast.success('Family code copied!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy');
    }
  };

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <div className="bg-card rounded-2xl p-6 border border-border/50 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-3xl">
            {profile.avatar_url || (isParent ? '👨‍👩‍👧' : '👧')}
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">{profile.name}</h2>
            <p className="text-sm text-muted-foreground capitalize">{profile.type}</p>
          </div>
        </div>
      </div>

      {/* Family Code - Parents Only */}
      {isParent && (
        <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-2xl p-4 border border-primary/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                <Home className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Family Code</p>
                <p className="text-xl font-mono font-bold tracking-widest text-foreground">{familyCode}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleCopyFamilyCode}
              className="h-10 w-10"
            >
              {copied ? (
                <Check className="w-5 h-5 text-primary" />
              ) : (
                <Copy className="w-5 h-5 text-muted-foreground" />
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Share this code with your kids so they can log in on their own devices
          </p>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-card rounded-xl p-4 border border-border/50">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Coins className="w-4 h-4" />
            <span className="text-sm">Quest Coins</span>
          </div>
          <p className="text-2xl font-bold text-foreground">🪙 {profile.total_earnings}</p>
        </div>
        <div className="bg-card rounded-xl p-4 border border-border/50">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Calendar className="w-4 h-4" />
            <span className="text-sm">Member Since</span>
          </div>
          <p className="text-2xl font-bold text-foreground">
            {profile.created_at 
              ? new Date(profile.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
              : 'Recently'}
          </p>
        </div>
      </div>

      {/* Account Section */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-foreground">Account</h3>
        <div className="bg-card rounded-xl border border-border/50 overflow-hidden">
          <div className="flex items-center gap-3 p-4 border-b border-border/50">
            <User className="w-5 h-5 text-muted-foreground" />
            <div className="flex-1">
              <p className="font-medium text-foreground">Profile Type</p>
              <p className="text-sm text-muted-foreground capitalize">{profile.type}</p>
            </div>
          </div>
          <button
            onClick={onSignOut}
            className="w-full flex items-center gap-3 p-4 text-destructive hover:bg-destructive/5 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
}
