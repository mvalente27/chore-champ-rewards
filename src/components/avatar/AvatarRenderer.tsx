import { AvatarConfig, SKIN_TONES, HAIR_COLORS, BACKGROUNDS } from './AvatarParts';

interface AvatarRendererProps {
  config: AvatarConfig;
  size?: number;
  className?: string;
}

// Get color value from ID
function getSkinColor(id: string): string {
  return SKIN_TONES.find(s => s.id === id)?.color || SKIN_TONES[1].color;
}

function getHairColor(id: string): string {
  return HAIR_COLORS.find(h => h.id === id)?.color || HAIR_COLORS[1].color;
}

function getBackground(id: string): string {
  return BACKGROUNDS.find(b => b.id === id)?.color || BACKGROUNDS[0].color;
}

// Hair SVG paths
function renderHair(style: string, color: string) {
  switch (style) {
    case 'short':
      return (
        <path
          d="M30 25 Q50 15 70 25 Q75 35 72 45 L70 40 Q50 30 30 40 L28 45 Q25 35 30 25Z"
          fill={color}
        />
      );
    case 'spiky':
      return (
        <g fill={color}>
          <path d="M35 30 L40 10 L45 28 L50 5 L55 28 L60 10 L65 30 Q50 25 35 30Z" />
          <path d="M30 35 Q50 25 70 35 L68 45 Q50 35 32 45Z" />
        </g>
      );
    case 'wavy':
      return (
        <path
          d="M25 40 Q28 25 35 20 Q50 12 65 20 Q72 25 75 40 Q72 35 68 38 Q60 30 50 32 Q40 30 32 38 Q28 35 25 40Z"
          fill={color}
        />
      );
    case 'long':
      return (
        <g fill={color}>
          <path d="M25 40 Q28 20 50 15 Q72 20 75 40 L75 70 Q72 75 70 70 L70 45 Q50 35 30 45 L30 70 Q28 75 25 70Z" />
        </g>
      );
    case 'curly':
      return (
        <g fill={color}>
          <circle cx="32" cy="28" r="8" />
          <circle cx="45" cy="22" r="9" />
          <circle cx="58" cy="22" r="9" />
          <circle cx="68" cy="28" r="8" />
          <circle cx="28" cy="40" r="7" />
          <circle cx="72" cy="40" r="7" />
        </g>
      );
    case 'ponytail':
      return (
        <g fill={color}>
          <path d="M30 30 Q50 18 70 30 Q72 40 70 45 Q50 35 30 45 Q28 40 30 30Z" />
          <ellipse cx="75" cy="55" rx="8" ry="18" />
        </g>
      );
    case 'pigtails':
      return (
        <g fill={color}>
          <path d="M30 30 Q50 20 70 30 Q72 38 70 42 Q50 32 30 42 Q28 38 30 30Z" />
          <ellipse cx="22" cy="50" rx="8" ry="15" />
          <ellipse cx="78" cy="50" rx="8" ry="15" />
        </g>
      );
    default:
      return null;
  }
}

// Eye SVG paths
function renderEyes(style: string) {
  switch (style) {
    case 'normal':
      return (
        <g>
          <ellipse cx="40" cy="50" rx="5" ry="6" fill="white" />
          <ellipse cx="60" cy="50" rx="5" ry="6" fill="white" />
          <circle cx="40" cy="50" r="3" fill="#333" />
          <circle cx="60" cy="50" r="3" fill="#333" />
        </g>
      );
    case 'happy':
      return (
        <g stroke="#333" strokeWidth="2.5" fill="none" strokeLinecap="round">
          <path d="M35 50 Q40 45 45 50" />
          <path d="M55 50 Q60 45 65 50" />
        </g>
      );
    case 'wink':
      return (
        <g>
          <ellipse cx="40" cy="50" rx="5" ry="6" fill="white" />
          <circle cx="40" cy="50" r="3" fill="#333" />
          <path d="M55 50 Q60 46 65 50" stroke="#333" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        </g>
      );
    case 'sleepy':
      return (
        <g stroke="#333" strokeWidth="2" fill="none" strokeLinecap="round">
          <path d="M35 52 L45 52" />
          <path d="M55 52 L65 52" />
        </g>
      );
    case 'surprised':
      return (
        <g>
          <circle cx="40" cy="50" r="7" fill="white" />
          <circle cx="60" cy="50" r="7" fill="white" />
          <circle cx="40" cy="50" r="4" fill="#333" />
          <circle cx="60" cy="50" r="4" fill="#333" />
        </g>
      );
    case 'cool':
      return (
        <g>
          <rect x="30" y="45" width="18" height="12" rx="3" fill="#333" />
          <rect x="52" y="45" width="18" height="12" rx="3" fill="#333" />
          <path d="M48 51 L52 51" stroke="#333" strokeWidth="2" />
          <path d="M30 48 L25 45" stroke="#333" strokeWidth="2" />
          <path d="M70 48 L75 45" stroke="#333" strokeWidth="2" />
        </g>
      );
    case 'hearts':
      return (
        <g fill="#E91E63">
          <path d="M40 55 L35 50 Q33 46 37 46 Q40 46 40 50 Q40 46 43 46 Q47 46 45 50 Z" />
          <path d="M60 55 L55 50 Q53 46 57 46 Q60 46 60 50 Q60 46 63 46 Q67 46 65 50 Z" />
        </g>
      );
    case 'stars':
      return (
        <g fill="#FFD700">
          <path d="M40 44 L41.5 49 L47 49 L42.5 52 L44 57 L40 54 L36 57 L37.5 52 L33 49 L38.5 49 Z" />
          <path d="M60 44 L61.5 49 L67 49 L62.5 52 L64 57 L60 54 L56 57 L57.5 52 L53 49 L58.5 49 Z" />
        </g>
      );
    default:
      return renderEyes('normal');
  }
}

// Mouth SVG paths
function renderMouth(style: string) {
  switch (style) {
    case 'smile':
      return <path d="M40 68 Q50 75 60 68" stroke="#333" strokeWidth="2.5" fill="none" strokeLinecap="round" />;
    case 'grin':
      return (
        <g>
          <path d="M38 66 Q50 78 62 66" fill="white" stroke="#333" strokeWidth="2" />
          <path d="M40 66 L60 66" stroke="#333" strokeWidth="1" />
        </g>
      );
    case 'open':
      return <ellipse cx="50" cy="70" rx="8" ry="6" fill="#333" />;
    case 'tongue':
      return (
        <g>
          <path d="M40 68 Q50 76 60 68" stroke="#333" strokeWidth="2" fill="none" strokeLinecap="round" />
          <ellipse cx="50" cy="73" rx="5" ry="4" fill="#E91E63" />
        </g>
      );
    case 'surprised':
      return <ellipse cx="50" cy="70" rx="6" ry="8" fill="#333" />;
    case 'smirk':
      return <path d="M42 68 Q55 72 60 65" stroke="#333" strokeWidth="2.5" fill="none" strokeLinecap="round" />;
    default:
      return renderMouth('smile');
  }
}

// Accessory SVG paths
function renderAccessory(style: string) {
  switch (style) {
    case 'glasses':
      return (
        <g fill="none" stroke="#333" strokeWidth="2">
          <circle cx="40" cy="50" r="10" />
          <circle cx="60" cy="50" r="10" />
          <path d="M50 50 L50 50" />
          <path d="M30 48 L25 45" />
          <path d="M70 48 L75 45" />
        </g>
      );
    case 'cap':
      return (
        <g>
          <path d="M25 38 Q50 25 75 38 L72 42 Q50 32 28 42 Z" fill="#3B82F6" />
          <rect x="20" y="38" width="30" height="6" rx="2" fill="#2563EB" />
        </g>
      );
    case 'crown':
      return (
        <g fill="#FFD700">
          <path d="M30 32 L35 22 L42 30 L50 18 L58 30 L65 22 L70 32 L68 38 L32 38 Z" />
          <circle cx="35" cy="24" r="3" fill="#E91E63" />
          <circle cx="50" cy="20" r="3" fill="#E91E63" />
          <circle cx="65" cy="24" r="3" fill="#E91E63" />
        </g>
      );
    case 'headphones':
      return (
        <g>
          <path d="M25 50 Q25 30 50 28 Q75 30 75 50" stroke="#333" strokeWidth="4" fill="none" />
          <rect x="20" y="45" width="10" height="18" rx="4" fill="#333" />
          <rect x="70" y="45" width="10" height="18" rx="4" fill="#333" />
        </g>
      );
    case 'bow':
      return (
        <g fill="#E91E63">
          <ellipse cx="35" cy="28" rx="10" ry="7" />
          <ellipse cx="65" cy="28" rx="10" ry="7" />
          <circle cx="50" cy="28" r="5" />
        </g>
      );
    case 'horns':
      return (
        <g fill="#8B0000">
          <path d="M32 35 Q28 20 35 15 Q38 22 35 35" />
          <path d="M68 35 Q72 20 65 15 Q62 22 65 35" />
        </g>
      );
    case 'halo':
      return (
        <ellipse cx="50" cy="18" rx="20" ry="6" fill="none" stroke="#FFD700" strokeWidth="4" />
      );
    default:
      return null;
  }
}

export function AvatarRenderer({ config, size = 100, className = '' }: AvatarRendererProps) {
  const skinColor = getSkinColor(config.skinTone);
  const hairColor = getHairColor(config.hairColor);
  const bgColor = getBackground(config.background);
  
  const isGradient = bgColor.includes('gradient');
  
  return (
    <div 
      className={`rounded-full overflow-hidden ${className}`}
      style={{ 
        width: size, 
        height: size,
        background: bgColor,
      }}
    >
      <svg viewBox="0 0 100 100" width={size} height={size}>
        {/* Background for non-gradient */}
        {!isGradient && <rect width="100" height="100" fill={bgColor} />}
        
        {/* Face base */}
        <ellipse cx="50" cy="55" rx="28" ry="30" fill={skinColor} />
        
        {/* Ears */}
        <ellipse cx="22" cy="55" rx="5" ry="7" fill={skinColor} />
        <ellipse cx="78" cy="55" rx="5" ry="7" fill={skinColor} />
        
        {/* Hair (behind for some styles) */}
        {config.hairStyle === 'long' && renderHair(config.hairStyle, hairColor)}
        
        {/* Eyes */}
        {renderEyes(config.eyeStyle)}
        
        {/* Nose */}
        <ellipse cx="50" cy="58" rx="3" ry="2" fill={skinColor} opacity="0.6" />
        
        {/* Mouth */}
        {renderMouth(config.mouthStyle)}
        
        {/* Blush */}
        <ellipse cx="35" cy="60" rx="6" ry="3" fill="#FFB6C1" opacity="0.4" />
        <ellipse cx="65" cy="60" rx="6" ry="3" fill="#FFB6C1" opacity="0.4" />
        
        {/* Hair (on top for most styles) */}
        {config.hairStyle !== 'long' && config.hairStyle !== 'none' && renderHair(config.hairStyle, hairColor)}
        
        {/* Accessory */}
        {renderAccessory(config.accessory)}
      </svg>
    </div>
  );
}
