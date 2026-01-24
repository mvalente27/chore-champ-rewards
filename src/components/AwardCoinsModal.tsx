import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Coins } from 'lucide-react';
import { toast } from 'sonner';

interface Kid {
  id: string;
  name: string;
  total_earnings: number;
}

interface AwardCoinsModalProps {
  isOpen: boolean;
  onClose: () => void;
  kids: Kid[];
  onAwardComplete: () => void;
}

export function AwardCoinsModal({ 
  isOpen, 
  onClose, 
  kids, 
  onAwardComplete 
}: AwardCoinsModalProps) {
  const [selectedKid, setSelectedKid] = useState<string>('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleAward = async () => {
    const awardAmount = parseFloat(amount);
    
    if (!selectedKid) {
      toast.error('Please select a kid');
      return;
    }
    
    if (isNaN(awardAmount) || awardAmount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.rpc('award_coins_to_kid', {
        p_kid_profile_id: selectedKid,
        p_amount: awardAmount,
        p_description: description || null,
      });

      if (error) throw error;

      const kidName = kids.find(k => k.id === selectedKid)?.name;
      toast.success(
        <div className="flex items-center gap-2">
          <Coins className="h-5 w-5 text-amber-500" />
          <span>Awarded {awardAmount} Quest Coins to {kidName}! 🎉</span>
        </div>
      );
      
      setSelectedKid('');
      setAmount('');
      setDescription('');
      onAwardComplete();
      onClose();
    } catch (error: unknown) {
      console.error('Award error:', error);
      const message = error instanceof Error ? error.message : 'Failed to award coins';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setSelectedKid('');
      setAmount('');
      setDescription('');
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5 text-amber-500" />
            Award Quest Coins
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Select Kid</Label>
            <Select value={selectedKid} onValueChange={setSelectedKid}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a kid" />
              </SelectTrigger>
              <SelectContent>
                {kids.map((kid) => (
                  <SelectItem key={kid.id} value={kid.id}>
                    {kid.name} ({kid.total_earnings} coins)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="award-amount">Amount</Label>
            <Input
              id="award-amount"
              type="number"
              min="1"
              step="1"
              placeholder="Enter coins to award"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Reason (optional)</Label>
            <Input
              id="description"
              placeholder="e.g., Bonus for good behavior"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={100}
            />
          </div>
        </div>

        <div className="flex gap-3">
          <Button variant="outline" onClick={handleClose} disabled={isLoading} className="flex-1">
            Cancel
          </Button>
          <Button onClick={handleAward} disabled={isLoading || !selectedKid || !amount} className="flex-1">
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Coins className="h-4 w-4 mr-2" />}
            Award
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
