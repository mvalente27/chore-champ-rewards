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
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Gift, Coins, ShoppingBag } from 'lucide-react';

const rewardIcons = ['🎁', '🎮', '🍦', '🎬', '📱', '🧸', '⚽', '🎨', '📚', '🎵', '🍕', '🎂'];

interface AddRewardModalProps {
  open: boolean;
  onClose: () => void;
  onAdd: (reward: { 
    name: string; 
    description: string; 
    cost: number; 
    icon: string;
    is_purchasable?: boolean;
    purchase_url?: string;
    purchase_price?: number;
  }) => Promise<void>;
}

export function AddRewardModal({ open, onClose, onAdd }: AddRewardModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [cost, setCost] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('🎁');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPurchasable, setIsPurchasable] = useState(false);
  const [purchaseUrl, setPurchaseUrl] = useState('');
  const [purchasePrice, setPurchasePrice] = useState('');

  const handleSubmit = async () => {
    if (!name.trim() || !cost || parseFloat(cost) <= 0) return;

    setIsSubmitting(true);
    try {
      await onAdd({
        name: name.trim(),
        description: description.trim(),
        cost: parseFloat(cost),
        icon: selectedIcon,
        is_purchasable: isPurchasable,
        purchase_url: isPurchasable ? purchaseUrl.trim() : undefined,
        purchase_price: isPurchasable && purchasePrice ? parseFloat(purchasePrice) : undefined,
      });
      resetForm();
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setName('');
    setDescription('');
    setCost('');
    setSelectedIcon('🎁');
    setIsPurchasable(false);
    setPurchaseUrl('');
    setPurchasePrice('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-sm mx-4 rounded-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Gift className="w-5 h-5 text-primary" />
            Add a Reward
          </DialogTitle>
          <DialogDescription>
            Create a reward that kids can redeem with their Quest Coins
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Icon Selection */}
          <div className="space-y-2">
            <Label>Choose an Icon</Label>
            <div className="flex flex-wrap gap-2">
              {rewardIcons.map((icon) => (
                <button
                  key={icon}
                  type="button"
                  onClick={() => setSelectedIcon(icon)}
                  className={`w-10 h-10 text-xl rounded-full transition-all ${
                    selectedIcon === icon
                      ? 'bg-primary/20 ring-2 ring-primary scale-110'
                      : 'bg-muted hover:bg-muted/80'
                  }`}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>

          {/* Name Input */}
          <div className="space-y-2">
            <Label htmlFor="reward-name">Reward Name</Label>
            <Input
              id="reward-name"
              placeholder="e.g., 30 min screen time, Ice cream trip"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          {/* Description Input */}
          <div className="space-y-2">
            <Label htmlFor="reward-description">Description (optional)</Label>
            <Textarea
              id="reward-description"
              placeholder="Any details about this reward..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isSubmitting}
              rows={2}
            />
          </div>

          {/* Cost Input */}
          <div className="space-y-2">
            <Label htmlFor="reward-cost" className="flex items-center gap-1">
              <Coins className="w-4 h-4 text-amber-500" />
              Cost (Quest Coins)
            </Label>
            <Input
              id="reward-cost"
              type="number"
              min="1"
              step="1"
              placeholder="50"
              value={cost}
              onChange={(e) => setCost(e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          {/* Purchasable Toggle */}
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-muted-foreground" />
              <div>
                <Label htmlFor="purchasable-toggle" className="font-medium">Physical Item</Label>
                <p className="text-xs text-muted-foreground">This is something you'll purchase</p>
              </div>
            </div>
            <Switch
              id="purchasable-toggle"
              checked={isPurchasable}
              onCheckedChange={setIsPurchasable}
              disabled={isSubmitting}
            />
          </div>

          {/* Purchasable Fields */}
          {isPurchasable && (
            <div className="space-y-3 p-3 border border-dashed rounded-lg">
              <div className="space-y-2">
                <Label htmlFor="purchase-url">Product Link (optional)</Label>
                <Input
                  id="purchase-url"
                  type="url"
                  placeholder="https://amazon.com/..."
                  value={purchaseUrl}
                  onChange={(e) => setPurchaseUrl(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="purchase-price">Actual Price ($)</Label>
                <Input
                  id="purchase-price"
                  type="number"
                  min="0.01"
                  step="0.01"
                  placeholder="19.99"
                  value={purchasePrice}
                  onChange={(e) => setPurchasePrice(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={handleClose} className="flex-1" disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              className="flex-1"
              disabled={!name.trim() || !cost || parseFloat(cost) <= 0 || isSubmitting}
            >
              {isSubmitting ? 'Adding...' : 'Add Reward'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
