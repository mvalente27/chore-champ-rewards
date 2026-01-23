import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface Kid {
  id: string;
  name: string;
  total_earnings: number;
}

interface TransferToKidModalProps {
  isOpen: boolean;
  onClose: () => void;
  kids: Kid[];
  maxAmount: number;
  onTransferComplete: () => void;
}

export function TransferToKidModal({ 
  isOpen, 
  onClose, 
  kids, 
  maxAmount,
  onTransferComplete 
}: TransferToKidModalProps) {
  const [selectedKid, setSelectedKid] = useState<string>('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleTransfer = async () => {
    const transferAmount = parseFloat(amount);
    
    if (!selectedKid) {
      toast.error('Please select a kid');
      return;
    }
    
    if (isNaN(transferAmount) || transferAmount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    
    if (transferAmount > maxAmount) {
      toast.error('Insufficient wallet balance');
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.rpc('transfer_to_kid', {
        p_kid_profile_id: selectedKid,
        p_amount: transferAmount,
        p_description: description || null,
      });

      if (error) throw error;

      const kidName = kids.find(k => k.id === selectedKid)?.name;
      toast.success(`Successfully sent $${transferAmount.toFixed(2)} to ${kidName}!`);
      
      setSelectedKid('');
      setAmount('');
      setDescription('');
      onTransferComplete();
      onClose();
    } catch (error: unknown) {
      console.error('Transfer error:', error);
      const message = error instanceof Error ? error.message : 'Failed to transfer funds';
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
          <DialogTitle>Send Money to Kid</DialogTitle>
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
                    {kid.name} (Balance: ${kid.total_earnings.toFixed(2)})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="transfer-amount">Amount ($)</Label>
            <Input
              id="transfer-amount"
              type="number"
              min="0.01"
              step="0.01"
              max={maxAmount}
              placeholder="Enter amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Available: ${maxAmount.toFixed(2)}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Note (optional)</Label>
            <Input
              id="description"
              placeholder="e.g., Birthday gift"
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
          <Button onClick={handleTransfer} disabled={isLoading || !selectedKid || !amount} className="flex-1">
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Send
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
