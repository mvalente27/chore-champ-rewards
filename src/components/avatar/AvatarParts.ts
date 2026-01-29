// Avatar customization options - layered SVG parts

export const SKIN_TONES = [
  { id: 'light', color: '#FFDBB4', name: 'Light' },
  { id: 'fair', color: '#EDB98A', name: 'Fair' },
  { id: 'medium', color: '#D08B5B', name: 'Medium' },
  { id: 'tan', color: '#AE5D29', name: 'Tan' },
  { id: 'brown', color: '#76422A', name: 'Brown' },
  { id: 'dark', color: '#4A2912', name: 'Dark' },
];

export const HAIR_COLORS = [
  { id: 'black', color: '#090806', name: 'Black' },
  { id: 'brown', color: '#4E3629', name: 'Brown' },
  { id: 'blonde', color: '#E8D5A3', name: 'Blonde' },
  { id: 'red', color: '#B55239', name: 'Red' },
  { id: 'blue', color: '#5B9BD5', name: 'Blue' },
  { id: 'pink', color: '#FF69B4', name: 'Pink' },
  { id: 'purple', color: '#9B59B6', name: 'Purple' },
  { id: 'green', color: '#2ECC71', name: 'Green' },
];

export const HAIR_STYLES = [
  { id: 'none', name: 'Bald', emoji: '👨‍🦲' },
  { id: 'short', name: 'Short', emoji: '💇' },
  { id: 'spiky', name: 'Spiky', emoji: '🦔' },
  { id: 'wavy', name: 'Wavy', emoji: '🌊' },
  { id: 'long', name: 'Long', emoji: '💁' },
  { id: 'curly', name: 'Curly', emoji: '🌀' },
  { id: 'ponytail', name: 'Ponytail', emoji: '🎀' },
  { id: 'pigtails', name: 'Pigtails', emoji: '👧' },
];

export const EYE_STYLES = [
  { id: 'normal', name: 'Normal', emoji: '👀' },
  { id: 'happy', name: 'Happy', emoji: '😊' },
  { id: 'wink', name: 'Wink', emoji: '😉' },
  { id: 'sleepy', name: 'Sleepy', emoji: '😴' },
  { id: 'surprised', name: 'Surprised', emoji: '😲' },
  { id: 'cool', name: 'Sunglasses', emoji: '😎' },
  { id: 'hearts', name: 'Hearts', emoji: '😍' },
  { id: 'stars', name: 'Stars', emoji: '🤩' },
];

export const MOUTH_STYLES = [
  { id: 'smile', name: 'Smile', emoji: '😊' },
  { id: 'grin', name: 'Grin', emoji: '😁' },
  { id: 'open', name: 'Open', emoji: '😃' },
  { id: 'tongue', name: 'Tongue', emoji: '😛' },
  { id: 'surprised', name: 'Surprised', emoji: '😮' },
  { id: 'smirk', name: 'Smirk', emoji: '😏' },
];

export const ACCESSORIES = [
  { id: 'none', name: 'None', emoji: '❌' },
  { id: 'glasses', name: 'Glasses', emoji: '👓' },
  { id: 'cap', name: 'Cap', emoji: '🧢' },
  { id: 'crown', name: 'Crown', emoji: '👑' },
  { id: 'headphones', name: 'Headphones', emoji: '🎧' },
  { id: 'bow', name: 'Bow', emoji: '🎀' },
  { id: 'horns', name: 'Horns', emoji: '😈' },
  { id: 'halo', name: 'Halo', emoji: '😇' },
];

export const BACKGROUNDS = [
  { id: 'blue', color: '#3B82F6', name: 'Blue' },
  { id: 'green', color: '#22C55E', name: 'Green' },
  { id: 'purple', color: '#A855F7', name: 'Purple' },
  { id: 'pink', color: '#EC4899', name: 'Pink' },
  { id: 'orange', color: '#F97316', name: 'Orange' },
  { id: 'yellow', color: '#EAB308', name: 'Yellow' },
  { id: 'gradient1', color: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', name: 'Sunset' },
  { id: 'gradient2', color: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', name: 'Candy' },
];

export interface AvatarConfig {
  skinTone: string;
  hairStyle: string;
  hairColor: string;
  eyeStyle: string;
  mouthStyle: string;
  accessory: string;
  background: string;
}

export const DEFAULT_AVATAR: AvatarConfig = {
  skinTone: 'fair',
  hairStyle: 'short',
  hairColor: 'brown',
  eyeStyle: 'happy',
  mouthStyle: 'smile',
  accessory: 'none',
  background: 'blue',
};

// Serialize config to a compact string for storage
export function serializeAvatar(config: AvatarConfig): string {
  return JSON.stringify(config);
}

// Deserialize stored string back to config
export function deserializeAvatar(str: string | null): AvatarConfig {
  if (!str) return DEFAULT_AVATAR;
  try {
    // Handle legacy emoji avatars
    if (str.length <= 8 && !str.startsWith('{')) {
      return DEFAULT_AVATAR;
    }
    return JSON.parse(str) as AvatarConfig;
  } catch {
    return DEFAULT_AVATAR;
  }
}
