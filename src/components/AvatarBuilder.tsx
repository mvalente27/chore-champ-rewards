import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

// Avatar parts for customization
const FACES = ['😊', '😄', '😎', '🤩', '😇', '🥳', '😜', '🤓', '😏', '🥰', '😁', '🙂'];
const SKIN_TONES = ['🏻', '🏼', '🏽', '🏾', '🏿', ''];
const ACCESSORIES = ['👑', '🎀', '🧢', '🎩', '🪖', '🎧', '👓', '🕶️', ''];
const BACKGROUNDS = ['🌈', '⭐', '🌙', '☀️', '🌸', '💎', '🔥', '💫', '✨', ''];

interface AvatarBuilderProps {
  isOpen: boolean;
  onClose: () => void;
  currentAvatar: string;
  onSave: (avatar: string) => void;
  coins?: number;
}

export function AvatarBuilder({ 
  isOpen, 
  onClose, 
  currentAvatar, 
  onSave,
  coins = 0 
}: AvatarBuilderProps) {
  const [selectedFace, setSelectedFace] = useState(
    FACES.includes(currentAvatar) ? currentAvatar : FACES[0]
  );
  const [selectedAccessory, setSelectedAccessory] = useState('');
  const [selectedBackground, setSelectedBackground] = useState('');

  const getPreviewAvatar = () => {
    // Combine parts into a display format
    if (selectedBackground && selectedAccessory) {
      return `${selectedBackground}${selectedFace}${selectedAccessory}`;
    } else if (selectedBackground) {
      return `${selectedBackground}${selectedFace}`;
    } else if (selectedAccessory) {
      return `${selectedFace}${selectedAccessory}`;
    }
    return selectedFace;
  };

  const handleSave = () => {
    // For simplicity, save just the face emoji (multi-char strings cause DB issues)
    onSave(selectedFace);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">Create Your Avatar</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Preview */}
          <div className="flex flex-col items-center gap-2">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center border-4 border-primary/30">
              <span className="text-5xl">{getPreviewAvatar()}</span>
            </div>
            <p className="text-sm text-muted-foreground">Your new look!</p>
          </div>

          <ScrollArea className="h-[280px] pr-4">
            {/* Face Selection */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-foreground">Choose Your Face</h3>
              <div className="grid grid-cols-6 gap-2">
                {FACES.map((face) => (
                  <button
                    key={face}
                    onClick={() => setSelectedFace(face)}
                    className={cn(
                      'w-10 h-10 rounded-lg flex items-center justify-center text-2xl transition-all',
                      selectedFace === face
                        ? 'bg-primary/20 ring-2 ring-primary scale-110'
                        : 'bg-muted/50 hover:bg-muted'
                    )}
                  >
                    {face}
                  </button>
                ))}
              </div>
            </div>

            {/* Accessory Selection */}
            <div className="space-y-3 mt-4">
              <h3 className="text-sm font-medium text-foreground">Add an Accessory</h3>
              <div className="grid grid-cols-6 gap-2">
                {ACCESSORIES.map((acc, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedAccessory(acc)}
                    className={cn(
                      'w-10 h-10 rounded-lg flex items-center justify-center text-2xl transition-all',
                      selectedAccessory === acc
                        ? 'bg-primary/20 ring-2 ring-primary scale-110'
                        : 'bg-muted/50 hover:bg-muted'
                    )}
                  >
                    {acc || '❌'}
                  </button>
                ))}
              </div>
            </div>

            {/* Background Selection */}
            <div className="space-y-3 mt-4">
              <h3 className="text-sm font-medium text-foreground">Pick a Flair</h3>
              <div className="grid grid-cols-6 gap-2">
                {BACKGROUNDS.map((bg, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedBackground(bg)}
                    className={cn(
                      'w-10 h-10 rounded-lg flex items-center justify-center text-2xl transition-all',
                      selectedBackground === bg
                        ? 'bg-primary/20 ring-2 ring-primary scale-110'
                        : 'bg-muted/50 hover:bg-muted'
                    )}
                  >
                    {bg || '❌'}
                  </button>
                ))}
              </div>
            </div>
          </ScrollArea>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleSave} className="flex-1">
              Save Avatar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
