import { useState } from 'react';
import { Bell, Coins } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SmartAvatar } from '@/components/avatar/SmartAvatar';
import { NotificationsPanel } from './NotificationsPanel';

interface HeaderProps {
  userName?: string;
  userAvatar?: string;
  totalCoins?: number;
  profileId?: string;
}

export function Header({ userName, userAvatar, totalCoins = 0, profileId }: HeaderProps) {
  const [showNotifications, setShowNotifications] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border/50 px-4 py-3">
        <div className="flex items-center justify-between max-w-md mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center overflow-hidden">
              <SmartAvatar avatarData={userAvatar || null} size={44} />
            </div>
            <div>
              <p className="text-sm text-muted-foreground font-medium">Welcome back,</p>
              <h1 className="text-lg font-bold text-foreground">{userName || 'Friend'}</h1>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon" 
              className="relative"
              onClick={() => setShowNotifications(true)}
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-secondary rounded-full border-2 border-background" />
            </Button>
            <div className="flex items-center gap-1 bg-primary/10 text-primary px-3 py-1.5 rounded-full">
              <Coins className="w-4 h-4" />
              <span className="text-sm font-bold">{totalCoins}</span>
            </div>
          </div>
        </div>
      </header>

      {profileId && (
        <NotificationsPanel 
          profileId={profileId}
          isOpen={showNotifications}
          onClose={() => setShowNotifications(false)}
        />
      )}
    </>
  );
}
