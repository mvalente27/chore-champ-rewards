import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { 
  AvatarConfig, 
  DEFAULT_AVATAR,
  SKIN_TONES,
  HAIR_COLORS,
  HAIR_STYLES,
  EYE_STYLES,
  MOUTH_STYLES,
  ACCESSORIES,
  BACKGROUNDS,
  deserializeAvatar,
  serializeAvatar,
} from './AvatarParts';
import { AvatarRenderer } from './AvatarRenderer';
import { User, Sparkles, Eye, Smile, Crown, Palette } from 'lucide-react';

interface AvatarBuilderNewProps {
  isOpen: boolean;
  onClose: () => void;
  currentAvatar: string;
  onSave: (avatarData: string) => void;
}

export function AvatarBuilderNew({ 
  isOpen, 
  onClose, 
  currentAvatar, 
  onSave,
}: AvatarBuilderNewProps) {
  const [config, setConfig] = useState<AvatarConfig>(() => deserializeAvatar(currentAvatar));

  const updateConfig = (key: keyof AvatarConfig, value: string) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    onSave(serializeAvatar(config));
    onClose();
  };

  const handleReset = () => {
    setConfig(DEFAULT_AVATAR);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-center flex items-center justify-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Create Your Avatar
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 flex-1 min-h-0">
          {/* Preview */}
          <div className="flex justify-center py-2">
            <div className="relative">
              <AvatarRenderer config={config} size={120} />
              <div className="absolute -bottom-1 -right-1 bg-primary text-primary-foreground rounded-full p-1.5">
                <Palette className="w-4 h-4" />
              </div>
            </div>
          </div>

          {/* Tabs for categories */}
          <Tabs defaultValue="face" className="flex-1 min-h-0 flex flex-col">
            <TabsList className="grid grid-cols-5 mb-2">
              <TabsTrigger value="face" className="text-xs px-2">
                <User className="w-4 h-4" />
              </TabsTrigger>
              <TabsTrigger value="hair" className="text-xs px-2">
                💇
              </TabsTrigger>
              <TabsTrigger value="eyes" className="text-xs px-2">
                <Eye className="w-4 h-4" />
              </TabsTrigger>
              <TabsTrigger value="mouth" className="text-xs px-2">
                <Smile className="w-4 h-4" />
              </TabsTrigger>
              <TabsTrigger value="extras" className="text-xs px-2">
                <Crown className="w-4 h-4" />
              </TabsTrigger>
            </TabsList>

            <ScrollArea className="flex-1 pr-2">
              {/* Face/Skin */}
              <TabsContent value="face" className="mt-0 space-y-4">
                <div>
                  <h3 className="text-sm font-medium mb-2">Skin Tone</h3>
                  <div className="grid grid-cols-6 gap-2">
                    {SKIN_TONES.map((tone) => (
                      <button
                        key={tone.id}
                        onClick={() => updateConfig('skinTone', tone.id)}
                        className={cn(
                          'w-10 h-10 rounded-full transition-all border-2',
                          config.skinTone === tone.id
                            ? 'ring-2 ring-primary ring-offset-2 scale-110'
                            : 'border-transparent hover:scale-105'
                        )}
                        style={{ backgroundColor: tone.color }}
                        title={tone.name}
                      />
                    ))}
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium mb-2">Background</h3>
                  <div className="grid grid-cols-4 gap-2">
                    {BACKGROUNDS.map((bg) => (
                      <button
                        key={bg.id}
                        onClick={() => updateConfig('background', bg.id)}
                        className={cn(
                          'h-12 rounded-lg transition-all border-2',
                          config.background === bg.id
                            ? 'ring-2 ring-primary ring-offset-2 scale-105'
                            : 'border-transparent hover:scale-105'
                        )}
                        style={{ background: bg.color }}
                        title={bg.name}
                      />
                    ))}
                  </div>
                </div>
              </TabsContent>

              {/* Hair */}
              <TabsContent value="hair" className="mt-0 space-y-4">
                <div>
                  <h3 className="text-sm font-medium mb-2">Hair Style</h3>
                  <div className="grid grid-cols-4 gap-2">
                    {HAIR_STYLES.map((style) => (
                      <button
                        key={style.id}
                        onClick={() => updateConfig('hairStyle', style.id)}
                        className={cn(
                          'p-2 rounded-lg flex flex-col items-center gap-1 transition-all',
                          config.hairStyle === style.id
                            ? 'bg-primary/20 ring-2 ring-primary'
                            : 'bg-muted/50 hover:bg-muted'
                        )}
                      >
                        <span className="text-xl">{style.emoji}</span>
                        <span className="text-xs">{style.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium mb-2">Hair Color</h3>
                  <div className="grid grid-cols-4 gap-2">
                    {HAIR_COLORS.map((color) => (
                      <button
                        key={color.id}
                        onClick={() => updateConfig('hairColor', color.id)}
                        className={cn(
                          'h-10 rounded-lg transition-all border-2 flex items-center justify-center',
                          config.hairColor === color.id
                            ? 'ring-2 ring-primary ring-offset-2 scale-105'
                            : 'border-transparent hover:scale-105'
                        )}
                        style={{ backgroundColor: color.color }}
                        title={color.name}
                      >
                        <span className="text-xs font-medium mix-blend-difference text-white">
                          {color.name}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </TabsContent>

              {/* Eyes */}
              <TabsContent value="eyes" className="mt-0">
                <h3 className="text-sm font-medium mb-2">Eye Style</h3>
                <div className="grid grid-cols-4 gap-2">
                  {EYE_STYLES.map((style) => (
                    <button
                      key={style.id}
                      onClick={() => updateConfig('eyeStyle', style.id)}
                      className={cn(
                        'p-3 rounded-lg flex flex-col items-center gap-1 transition-all',
                        config.eyeStyle === style.id
                          ? 'bg-primary/20 ring-2 ring-primary'
                          : 'bg-muted/50 hover:bg-muted'
                      )}
                    >
                      <span className="text-2xl">{style.emoji}</span>
                      <span className="text-xs">{style.name}</span>
                    </button>
                  ))}
                </div>
              </TabsContent>

              {/* Mouth */}
              <TabsContent value="mouth" className="mt-0">
                <h3 className="text-sm font-medium mb-2">Mouth Style</h3>
                <div className="grid grid-cols-3 gap-2">
                  {MOUTH_STYLES.map((style) => (
                    <button
                      key={style.id}
                      onClick={() => updateConfig('mouthStyle', style.id)}
                      className={cn(
                        'p-3 rounded-lg flex flex-col items-center gap-1 transition-all',
                        config.mouthStyle === style.id
                          ? 'bg-primary/20 ring-2 ring-primary'
                          : 'bg-muted/50 hover:bg-muted'
                      )}
                    >
                      <span className="text-2xl">{style.emoji}</span>
                      <span className="text-xs">{style.name}</span>
                    </button>
                  ))}
                </div>
              </TabsContent>

              {/* Accessories */}
              <TabsContent value="extras" className="mt-0">
                <h3 className="text-sm font-medium mb-2">Accessories</h3>
                <div className="grid grid-cols-4 gap-2">
                  {ACCESSORIES.map((acc) => (
                    <button
                      key={acc.id}
                      onClick={() => updateConfig('accessory', acc.id)}
                      className={cn(
                        'p-3 rounded-lg flex flex-col items-center gap-1 transition-all',
                        config.accessory === acc.id
                          ? 'bg-primary/20 ring-2 ring-primary'
                          : 'bg-muted/50 hover:bg-muted'
                      )}
                    >
                      <span className="text-2xl">{acc.emoji}</span>
                      <span className="text-xs">{acc.name}</span>
                    </button>
                  ))}
                </div>
              </TabsContent>
            </ScrollArea>
          </Tabs>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2 border-t">
            <Button variant="ghost" onClick={handleReset} className="text-muted-foreground">
              Reset
            </Button>
            <div className="flex-1" />
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              Save Avatar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
