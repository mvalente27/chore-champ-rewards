import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Coins, Loader2 } from 'lucide-react';
import { useAdMob } from '@/hooks/useAdMob';
import { toast } from 'sonner';

interface WatchAdButtonProps {
  onRewardEarned?: (amount: number) => void;
  rewardAmount?: number;
  className?: string;
}

export function WatchAdButton({ 
  onRewardEarned, 
  rewardAmount = 5,
  className = '' 
}: WatchAdButtonProps) {
  const { isSupported, showRewarded } = useAdMob();
  const [isLoading, setIsLoading] = useState(false);

  // Don't render if not in native app
  if (!isSupported) {
    return null;
  }

  const handleWatchAd = async () => {
    setIsLoading(true);
    try {
      const reward = await showRewarded();
      if (reward) {
        toast.success(`You earned ${rewardAmount} Quest Coins! 🎉`);
        onRewardEarned?.(rewardAmount);
      }
    } catch (error) {
      toast.error('Failed to load ad. Try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleWatchAd}
      disabled={isLoading}
      variant="outline"
      className={`bg-gradient-to-r from-primary/10 to-accent/10 border-primary/30 hover:from-primary/20 hover:to-accent/20 ${className}`}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
      ) : (
        <Play className="w-4 h-4 mr-2" />
      )}
      <span>Watch Ad</span>
      <Coins className="w-4 h-4 ml-2 text-primary" />
      <span className="text-primary font-bold ml-1">+{rewardAmount}</span>
    </Button>
  );
}
