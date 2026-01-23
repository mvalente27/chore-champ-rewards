import { Button } from '@/components/ui/button';
import { LogOut, User, DollarSign, Calendar } from 'lucide-react';

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

export function ProfileView({ profile, isParent, onSignOut }: ProfileViewProps) {
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

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-card rounded-xl p-4 border border-border/50">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <DollarSign className="w-4 h-4" />
            <span className="text-sm">Total Earnings</span>
          </div>
          <p className="text-2xl font-bold text-foreground">${profile.total_earnings}</p>
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
