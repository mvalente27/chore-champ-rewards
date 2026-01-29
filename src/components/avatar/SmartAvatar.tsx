import { AvatarRenderer } from './AvatarRenderer';
import { deserializeAvatar, isSerializedAvatar } from './AvatarParts';

interface SmartAvatarProps {
  avatarData: string | null;
  size?: number;
  className?: string;
}

/**
 * Smart avatar component that automatically detects whether the avatar data
 * is a serialized JSON config (new system) or an emoji (legacy system)
 * and renders accordingly.
 */
export function SmartAvatar({ avatarData, size = 32, className }: SmartAvatarProps) {
  // If it's a serialized avatar config, use the new renderer
  if (avatarData && isSerializedAvatar(avatarData)) {
    const config = deserializeAvatar(avatarData);
    return <AvatarRenderer config={config} size={size} className={className} />;
  }

  // Otherwise, show emoji or default
  return (
    <span 
      className={className}
      style={{ fontSize: size * 0.7, lineHeight: 1 }}
    >
      {avatarData || '👧'}
    </span>
  );
}
