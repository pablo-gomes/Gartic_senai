import React from 'react';

// Import all 12 gamer avatars directly for rock-solid bundling
import av0 from '../assets/avatars/avatar_0.png';
import av1 from '../assets/avatars/avatar_1.png';
import av2 from '../assets/avatars/avatar_2.png';
import av3 from '../assets/avatars/avatar_3.png';
import av4 from '../assets/avatars/avatar_4.png';
import av5 from '../assets/avatars/avatar_5.png';
import av6 from '../assets/avatars/avatar_6.png';
import av7 from '../assets/avatars/avatar_7.png';
import av8 from '../assets/avatars/avatar_8.png';
import av9 from '../assets/avatars/avatar_9.png';
import av10 from '../assets/avatars/avatar_10.png';
import av11 from '../assets/avatars/avatar_11.png';

export const AVATAR_IMAGES = [
  av0,
  av1,
  av2,
  av3,
  av4,
  av5,
  av6,
  av7,
  av8,
  av9,
  av10,
  av11,
];

export interface AvatarMeta {
  id: number;
  label: string;
  role: string;
  accent: string;
}

export const AVATAR_LIST: AvatarMeta[] = [
  { id: 0, label: 'Neko Boss', role: 'Gato Chefão', accent: '#8B5CF6' },
  { id: 1, label: 'Sombra Cyber', role: 'Phantom Gamer', accent: '#A855F7' },
  { id: 2, label: 'Pato Dope', role: 'Street Quack', accent: '#F59E0B' },
  { id: 3, label: 'Dino Gamer', role: 'T-Rex Pro', accent: '#22C55E' },
  { id: 4, label: 'Lobo Alpha', role: 'Direwolf Urbano', accent: '#EF4444' },
  { id: 5, label: 'Kitsune DJ', role: 'Raposa Beatmaker', accent: '#F97316' },
  { id: 6, label: 'Pinguim Chill', role: 'Lord Pingu', accent: '#9333EA' },
  { id: 7, label: 'Cyber Bot', role: 'Pixel Master', accent: '#06B6D4' },
  { id: 8, label: 'Tubarão Pro', role: 'Predador Urbano', accent: '#0284C7' },
  { id: 9, label: 'Corvo Rei', role: 'Dark Raven', accent: '#7C3AED' },
  { id: 10, label: 'DJ Octo', role: 'Kraken Sonoro', accent: '#0EA5E9' },
  { id: 11, label: 'Panda Zen', role: 'Mestre Bambu', accent: '#16A34A' },
];

export interface AvatarSvgProps {
  avatarId: number;
  size?: number;
  className?: string;
  bordered?: boolean;
}

/**
 * Modern High-Resolution Avatar component with circular badge styling,
 * vibrant accent glows, and smooth responsive scaling.
 */
export const AvatarSvg: React.FC<AvatarSvgProps> = ({
  avatarId,
  size = 44,
  className = '',
  bordered = false,
}) => {
  const index = Math.abs(avatarId || 0) % AVATAR_LIST.length;
  const meta = AVATAR_LIST[index] ?? AVATAR_LIST[0];
  const imageSrc = AVATAR_IMAGES[index] ?? AVATAR_IMAGES[0];

  return (
    <div
      style={{
        width: size,
        height: size,
        boxShadow: bordered ? `0 0 0 2px ${meta.accent}80, 0 4px 12px ${meta.accent}30` : undefined,
      }}
      className={`relative shrink-0 rounded-full select-none flex items-center justify-center overflow-hidden transition-all duration-200 ${className}`}
      role="img"
      aria-label={meta.label}
    >
      <img
        src={imageSrc}
        alt={meta.label}
        width={size}
        height={size}
        loading="lazy"
        draggable={false}
        className="w-full h-full object-cover rounded-full pointer-events-none drop-shadow-sm select-none"
      />
    </div>
  );
};
