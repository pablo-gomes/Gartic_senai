import React from 'react';

interface AvatarSvgProps {
  avatarId: number;
  size?: number;
  className?: string;
}

export const AVATAR_LIST = [
  { id: 0, label: 'Kitsune Artista', role: 'Raposa Pintora', accent: '#F97316' },
  { id: 1, label: 'Sapo DJ', role: 'Mestre do Ritmo', accent: '#10B981' },
  { id: 2, label: 'Capitão Octo', role: 'Pirata Criativo', accent: '#F43F5E' },
  { id: 3, label: 'Coruja Arcana', role: 'Maga dos Traços', accent: '#8B5CF6' },
  { id: 4, label: 'Rei Juba', role: 'Monarca Solar', accent: '#F59E0B' },
  { id: 5, label: 'Pinguim Aviador', role: 'Piloto Polar', accent: '#0EA5E9' },
  { id: 6, label: 'Neko Ninja', role: 'Gato Relâmpago', accent: '#6366F1' },
  { id: 7, label: 'Camaleão Pop', role: 'Mestre das Cores', accent: '#84CC16' },
  { id: 8, label: 'Draco Rubi', role: 'Guardião da Arte', accent: '#E11D48' },
  { id: 9, label: 'Astro-Bot', role: 'Robô Ilustrador', accent: '#06B6D4' },
  { id: 10, label: 'Panda Bambu', role: 'Artista Zen', accent: '#14B8A6' },
  { id: 11, label: 'Tigre Trovão', role: 'Campeão Dourado', accent: '#D97706' },
];

export const AvatarSvg: React.FC<AvatarSvgProps> = ({
  avatarId,
  size = 44,
  className = '',
}) => {
  const index = Math.abs(avatarId || 0) % AVATAR_LIST.length;
  const meta = AVATAR_LIST[index];
  const uid = `av_${index}`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 rounded-2xl shadow-sm select-none ${className}`}
      role="img"
      aria-label={meta.label}
    >
      <defs>
        {/* Bright, cheerful cartoon party-game background gradients */}
        <linearGradient id={`${uid}_bg0`} x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FDE68A" />
          <stop offset="100%" stopColor="#FB923C" />
        </linearGradient>
        <linearGradient id={`${uid}_bg1`} x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#A7F3D0" />
          <stop offset="100%" stopColor="#34D399" />
        </linearGradient>
        <linearGradient id={`${uid}_bg2`} x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FECDD3" />
          <stop offset="100%" stopColor="#FB7185" />
        </linearGradient>
        <linearGradient id={`${uid}_bg3`} x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#DDD6FE" />
          <stop offset="100%" stopColor="#A78BFA" />
        </linearGradient>
        <linearGradient id={`${uid}_bg4`} x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FEF08A" />
          <stop offset="100%" stopColor="#FBBF24" />
        </linearGradient>
        <linearGradient id={`${uid}_bg5`} x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#BAE6FD" />
          <stop offset="100%" stopColor="#38BDF8" />
        </linearGradient>
      </defs>

      {/* 0: KITSUNE ARTISTA (Fox with Purple Artist Beret) */}
      {index === 0 && (
        <g>
          <rect width="64" height="64" rx="18" fill={`url(#${uid}_bg0)`} />
          <circle cx="32" cy="34" r="24" fill="#FFFFFF" fillOpacity="0.28" />
          {/* Ears */}
          <path d="M12 14 L25 26 L13 33 Z" fill="#EA580C" stroke="#7C2D12" strokeWidth="2" strokeLinejoin="round" />
          <path d="M15 18 L22 25 L15 29 Z" fill="#FEF3C7" />
          <path d="M52 14 L39 26 L51 33 Z" fill="#EA580C" stroke="#7C2D12" strokeWidth="2" strokeLinejoin="round" />
          <path d="M49 18 L42 25 L49 29 Z" fill="#FEF3C7" />
          {/* Head */}
          <path d="M14 34 C14 23 50 23 50 34 C53 43 43 52 32 52 C21 52 11 43 14 34 Z" fill="#F97316" stroke="#7C2D12" strokeWidth="2" />
          {/* White Cheeks */}
          <path d="M14.5 38 C19 36 26 42 32 51 C21 52 13.5 45 14.5 38 Z" fill="#FFFBEB" />
          <path d="M49.5 38 C45 36 38 42 32 51 C43 52 50.5 45 49.5 38 Z" fill="#FFFBEB" />
          {/* Rosy Blush */}
          <ellipse cx="20" cy="41" rx="3" ry="1.8" fill="#FB7185" fillOpacity="0.65" />
          <ellipse cx="44" cy="41" rx="3" ry="1.8" fill="#FB7185" fillOpacity="0.65" />
          {/* Expressive Cartoon Eyes */}
          <circle cx="24" cy="35.5" r="4" fill="#1E1B4B" />
          <circle cx="25.3" cy="34.2" r="1.5" fill="#FFFFFF" />
          <circle cx="40" cy="35.5" r="4" fill="#1E1B4B" />
          <circle cx="41.3" cy="34.2" r="1.5" fill="#FFFFFF" />
          {/* Nose & Cheerful Smile */}
          <polygon points="32,40.5 28.8,44 35.2,44" fill="#1E1B4B" />
          <path d="M27.5 46 Q32 50 36.5 46" stroke="#1E1B4B" strokeWidth="2.2" strokeLinecap="round" />
          {/* Artist Beret */}
          <ellipse cx="34" cy="17.5" rx="15.5" ry="6.5" transform="rotate(-10 34 17.5)" fill="#7C3AED" stroke="#1E1B4B" strokeWidth="2" />
          <path d="M33 9.5 L35 12.5" stroke="#1E1B4B" strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="25" cy="17" r="2" fill="#FACC15" />
        </g>
      )}

      {/* 1: SAPO DJ (Emerald Frog with Studio Headphones) */}
      {index === 1 && (
        <g>
          <rect width="64" height="64" rx="18" fill={`url(#${uid}_bg1)`} />
          <circle cx="32" cy="34" r="24" fill="#FFFFFF" fillOpacity="0.28" />
          {/* Headphone Arc */}
          <path d="M11 36 C11 13 53 13 53 36" stroke="#4F46E5" strokeWidth="4.5" strokeLinecap="round" />
          {/* Frog Eye Bumps */}
          <circle cx="22" cy="24" r="8.5" fill="#10B981" stroke="#064E3B" strokeWidth="2" />
          <circle cx="42" cy="24" r="8.5" fill="#10B981" stroke="#064E3B" strokeWidth="2" />
          <circle cx="22" cy="24" r="5.5" fill="#FFFFFF" />
          <circle cx="42" cy="24" r="5.5" fill="#FFFFFF" />
          <circle cx="22" cy="24" r="3" fill="#1E1B4B" />
          <circle cx="42" cy="24" r="3" fill="#1E1B4B" />
          <circle cx="23.2" cy="22.6" r="1.3" fill="#FFFFFF" />
          <circle cx="43.2" cy="22.6" r="1.3" fill="#FFFFFF" />
          {/* Face */}
          <ellipse cx="32" cy="38" rx="19" ry="14" fill="#10B981" stroke="#064E3B" strokeWidth="2" />
          <ellipse cx="32" cy="43" rx="14" ry="8" fill="#D1FAE5" />
          {/* Rosy Cheeks */}
          <circle cx="18.5" cy="38" r="3.2" fill="#FB7185" fillOpacity="0.7" />
          <circle cx="45.5" cy="38" r="3.2" fill="#FB7185" fillOpacity="0.7" />
          {/* Big Happy Smile */}
          <path d="M21 38.5 Q32 47.5 43 38.5" stroke="#064E3B" strokeWidth="2.8" strokeLinecap="round" />
          {/* Headphone Cups */}
          <rect x="6.5" y="29" width="7.5" height="15" rx="3.75" fill="#FACC15" stroke="#1E1B4B" strokeWidth="2" />
          <rect x="50" y="29" width="7.5" height="15" rx="3.75" fill="#FACC15" stroke="#1E1B4B" strokeWidth="2" />
        </g>
      )}

      {/* 2: CAPITÃO OCTO (Pirate Octopus with Bandana & Golden Monocle) */}
      {index === 2 && (
        <g>
          <rect width="64" height="64" rx="18" fill={`url(#${uid}_bg2)`} />
          <circle cx="32" cy="34" r="24" fill="#FFFFFF" fillOpacity="0.28" />
          {/* Tentacles at bottom */}
          <path d="M12 48 Q16 56 22 50 Q27 56 32 50 Q37 56 42 50 Q48 56 52 48" stroke="#E11D48" strokeWidth="5.5" strokeLinecap="round" fill="none" />
          {/* Head Dome */}
          <ellipse cx="32" cy="33" rx="18" ry="17" fill="#F43F5E" stroke="#881337" strokeWidth="2" />
          {/* Pirate Bandana */}
          <path d="M14 27 C16 15.5 48 15.5 50 27 Z" fill="#1E1B4B" stroke="#1E1B4B" strokeWidth="1.5" />
          <path d="M14 27 L50 27" stroke="#FACC15" strokeWidth="3" />
          <circle cx="32" cy="21" r="2.8" fill="#FFFFFF" />
          {/* Eyes & Golden Monocle */}
          <circle cx="24" cy="35" r="3.8" fill="#1E1B4B" />
          <circle cx="25.2" cy="33.6" r="1.4" fill="#FFFFFF" />
          <circle cx="40" cy="35" r="5.8" fill="#FEF08A" fillOpacity="0.45" stroke="#F59E0B" strokeWidth="2.4" />
          <circle cx="40" cy="35" r="3" fill="#1E1B4B" />
          <circle cx="41" cy="33.8" r="1.2" fill="#FFFFFF" />
          {/* Cute Suction Mouth */}
          <circle cx="32" cy="42.5" r="3.2" fill="#881337" stroke="#FFE4E6" strokeWidth="1.8" />
        </g>
      )}

      {/* 3: CORUJA ARCANA (Mystic Owl with Starry Wizard Hat & Glasses) */}
      {index === 3 && (
        <g>
          <rect width="64" height="64" rx="18" fill={`url(#${uid}_bg3)`} />
          <circle cx="32" cy="34" r="24" fill="#FFFFFF" fillOpacity="0.28" />
          {/* Owl Body/Head */}
          <ellipse cx="32" cy="38" rx="17" ry="16" fill="#7C3AED" stroke="#312E81" strokeWidth="2" />
          <ellipse cx="32" cy="43" rx="11.5" ry="10" fill="#EDE9FE" />
          {/* Feather Chest Marks */}
          <path d="M28 43 Q30 45 32 43 M32 43 Q34 45 36 43 M30 48 Q32 50 34 48" stroke="#6D28D9" strokeWidth="2" strokeLinecap="round" />
          {/* Big Spectacles & Eyes */}
          <circle cx="24" cy="33" r="6.8" fill="#FFFFFF" stroke="#F59E0B" strokeWidth="2.4" />
          <circle cx="40" cy="33" r="6.8" fill="#FFFFFF" stroke="#F59E0B" strokeWidth="2.4" />
          <line x1="30.8" y1="33" x2="33.2" y2="33" stroke="#F59E0B" strokeWidth="2.4" />
          <circle cx="24" cy="33" r="3.5" fill="#1E1B4B" />
          <circle cx="40" cy="33" r="3.5" fill="#1E1B4B" />
          <circle cx="25.2" cy="31.6" r="1.3" fill="#FFFFFF" />
          <circle cx="41.2" cy="31.6" r="1.3" fill="#FFFFFF" />
          {/* Beak */}
          <polygon points="32,35 28.8,40.5 35.2,40.5" fill="#F59E0B" stroke="#78350F" strokeWidth="1.2" />
          {/* Wizard Hat */}
          <path d="M12 24 L52 24 L37 6.5 L29 12 Z" fill="#4338CA" stroke="#1E1B4B" strokeWidth="2" strokeLinejoin="round" />
          <ellipse cx="32" cy="24" rx="21" ry="3.8" fill="#4F46E5" stroke="#1E1B4B" strokeWidth="1.8" />
          <circle cx="34" cy="16.5" r="2.3" fill="#FACC15" />
        </g>
      )}

      {/* 4: REI JUBA (Royal Lion with Golden Crown) */}
      {index === 4 && (
        <g>
          <rect width="64" height="64" rx="18" fill={`url(#${uid}_bg4)`} />
          <circle cx="32" cy="34" r="24" fill="#FFFFFF" fillOpacity="0.3" />
          {/* Lush Mane */}
          <circle cx="32" cy="36" r="21" fill="#D97706" stroke="#78350F" strokeWidth="2.2" />
          {/* Ears */}
          <circle cx="18" cy="23" r="4.8" fill="#FBBF24" stroke="#78350F" strokeWidth="1.8" />
          <circle cx="46" cy="23" r="4.8" fill="#FBBF24" stroke="#78350F" strokeWidth="1.8" />
          {/* Face */}
          <circle cx="32" cy="36" r="15" fill="#FDE047" stroke="#78350F" strokeWidth="1.8" />
          {/* Muzzle */}
          <ellipse cx="28.5" cy="41" rx="4.8" ry="3.6" fill="#FFFFFF" />
          <ellipse cx="35.5" cy="41" rx="4.8" ry="3.6" fill="#FFFFFF" />
          <polygon points="32,36.8 28.5,40.2 35.5,40.2" fill="#78350F" />
          {/* Eyes */}
          <circle cx="25" cy="33" r="3.2" fill="#1E1B4B" />
          <circle cx="39" cy="33" r="3.2" fill="#1E1B4B" />
          <circle cx="26" cy="31.8" r="1.2" fill="#FFFFFF" />
          <circle cx="40" cy="31.8" r="1.2" fill="#FFFFFF" />
          {/* Royal Crown */}
          <polygon points="19,21 22,10 28,16.5 32,8 36,16.5 42,10 45,21" fill="#FACC15" stroke="#78350F" strokeWidth="1.8" strokeLinejoin="round" />
          <circle cx="32" cy="15.5" r="2.2" fill="#E11D48" />
        </g>
      )}

      {/* 5: PINGUIM AVIADOR (Polar Penguin with Aviator Goggles & Scarf) */}
      {index === 5 && (
        <g>
          <rect width="64" height="64" rx="18" fill={`url(#${uid}_bg5)`} />
          <circle cx="32" cy="34" r="24" fill="#FFFFFF" fillOpacity="0.3" />
          {/* Body/Head */}
          <ellipse cx="32" cy="36" rx="17.5" ry="18.5" fill="#1E293B" stroke="#0F172A" strokeWidth="2" />
          <ellipse cx="32" cy="39.5" rx="13" ry="13.5" fill="#FFFFFF" />
          {/* Aviator Goggles on Forehead */}
          <rect x="15.5" y="18.5" width="33" height="7" rx="3" fill="#78350F" />
          <circle cx="24" cy="22" r="5.2" fill="#38BDF8" stroke="#FACC15" strokeWidth="2.2" />
          <circle cx="40" cy="22" r="5.2" fill="#38BDF8" stroke="#FACC15" strokeWidth="2.2" />
          {/* Eyes */}
          <circle cx="25" cy="34" r="3.2" fill="#0F172A" />
          <circle cx="39" cy="34" r="3.2" fill="#0F172A" />
          <circle cx="26" cy="32.8" r="1.2" fill="#FFFFFF" />
          <circle cx="40" cy="32.8" r="1.2" fill="#FFFFFF" />
          {/* Rosy cheeks */}
          <circle cx="20" cy="38.5" r="2.6" fill="#FB7185" fillOpacity="0.65" />
          <circle cx="44" cy="38.5" r="2.6" fill="#FB7185" fillOpacity="0.65" />
          {/* Beak */}
          <polygon points="32,35.5 26.5,39.5 32,43 37.5,39.5" fill="#F97316" stroke="#9A3412" strokeWidth="1.5" />
          {/* Red Winter Scarf */}
          <rect x="17.5" y="47" width="29" height="6.5" rx="3.2" fill="#F43F5E" stroke="#881337" strokeWidth="1.8" />
          <rect x="36" y="49" width="6.5" height="10" rx="2.5" fill="#E11D48" stroke="#881337" strokeWidth="1.5" />
        </g>
      )}

      {/* 6: NEKO NINJA (Cyber-Samurai Cat with Headband) */}
      {index === 6 && (
        <g>
          <rect width="64" height="64" rx="18" fill={`url(#${uid}_bg3)`} />
          <circle cx="32" cy="34" r="24" fill="#FFFFFF" fillOpacity="0.28" />
          {/* Cat Ears */}
          <polygon points="14,13 26,24 15,31" fill="#312E81" stroke="#1E1B4B" strokeWidth="2" strokeLinejoin="round" />
          <polygon points="50,13 38,24 49,31" fill="#312E81" stroke="#1E1B4B" strokeWidth="2" strokeLinejoin="round" />
          {/* Head */}
          <ellipse cx="32" cy="36" rx="17.5" ry="15.5" fill="#312E81" stroke="#1E1B4B" strokeWidth="2" />
          {/* Ninja Headband */}
          <path d="M14.5 29 Q32 32 49.5 29 L49.5 23.5 Q32 26.5 14.5 23.5 Z" fill="#F43F5E" stroke="#881337" strokeWidth="1.5" />
          <rect x="27" y="24" width="10" height="5.5" rx="1.8" fill="#F8FAFC" stroke="#1E1B4B" strokeWidth="1.2" />
          {/* Glowing Eyes */}
          <ellipse cx="24" cy="37" rx="4.2" ry="3.4" fill="#38BDF8" />
          <ellipse cx="40" cy="37" rx="4.2" ry="3.4" fill="#38BDF8" />
          <circle cx="24" cy="37" r="2" fill="#1E1B4B" />
          <circle cx="40" cy="37" r="2" fill="#1E1B4B" />
          <circle cx="25" cy="36" r="1" fill="#FFFFFF" />
          <circle cx="41" cy="36" r="1" fill="#FFFFFF" />
          {/* Whiskers & Cute Mouth */}
          <path d="M28.5 43.5 Q32 46 35.5 43.5" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" />
        </g>
      )}

      {/* 7: CAMALEÃO POP (Chameleon with Crest & Vivid Eyes) */}
      {index === 7 && (
        <g>
          <rect width="64" height="64" rx="18" fill={`url(#${uid}_bg1)`} />
          <circle cx="32" cy="34" r="24" fill="#FFFFFF" fillOpacity="0.28" />
          {/* Chameleon Crest */}
          <path d="M18 28 C18 12 44 11 46 28 Z" fill="#65A30D" stroke="#14532D" strokeWidth="2" />
          {/* Face */}
          <ellipse cx="32" cy="36" rx="18.5" ry="14.5" fill="#84CC16" stroke="#14532D" strokeWidth="2" />
          {/* Colorful Turret Eyes */}
          <circle cx="23" cy="34" r="6.2" fill="#38BDF8" stroke="#1E1B4B" strokeWidth="2" />
          <circle cx="41" cy="34" r="6.2" fill="#F472B6" stroke="#1E1B4B" strokeWidth="2" />
          <circle cx="23" cy="34" r="2.8" fill="#1E1B4B" />
          <circle cx="41" cy="34" r="2.8" fill="#1E1B4B" />
          <circle cx="24" cy="32.8" r="1.1" fill="#FFFFFF" />
          <circle cx="42" cy="32.8" r="1.1" fill="#FFFFFF" />
          {/* Curled Tongue Smile */}
          <path d="M22 44 Q32 48 42 44" stroke="#14532D" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M36 45 C42 48 44 53 40 53 C38 53 38 50 40 50" stroke="#F43F5E" strokeWidth="2.8" strokeLinecap="round" fill="none" />
        </g>
      )}

      {/* 8: DRACO RUBI (Dragon with Curved Golden Horns) */}
      {index === 8 && (
        <g>
          <rect width="64" height="64" rx="18" fill={`url(#${uid}_bg2)`} />
          <circle cx="32" cy="34" r="24" fill="#FFFFFF" fillOpacity="0.28" />
          {/* Curved Golden Horns */}
          <path d="M19 25 C11.5 18 13.5 9.5 21 11 C19 16 21 20 24 23 Z" fill="#FACC15" stroke="#78350F" strokeWidth="1.8" />
          <path d="M45 25 C52.5 18 50.5 9.5 43 11 C45 16 43 20 40 23 Z" fill="#FACC15" stroke="#78350F" strokeWidth="1.8" />
          {/* Dragon Head */}
          <path d="M14.5 34 C14.5 20.5 49.5 20.5 49.5 34 C49.5 46.5 41 52.5 32 52.5 C23 52.5 14.5 46.5 14.5 34 Z" fill="#E11D48" stroke="#881337" strokeWidth="2" />
          {/* Belly/Snout Ridge */}
          <ellipse cx="32" cy="43" rx="10.5" ry="7.2" fill="#FDA4AF" />
          <circle cx="28.5" cy="41.5" r="1.8" fill="#881337" />
          <circle cx="35.5" cy="41.5" r="1.8" fill="#881337" />
          {/* Friendly Dragon Eyes */}
          <circle cx="23.5" cy="33" r="3.6" fill="#FEF08A" stroke="#881337" strokeWidth="1.5" />
          <circle cx="40.5" cy="33" r="3.6" fill="#FEF08A" stroke="#881337" strokeWidth="1.5" />
          <circle cx="23.5" cy="33" r="1.8" fill="#1E1B4B" />
          <circle cx="40.5" cy="33" r="1.8" fill="#1E1B4B" />
          {/* Center Crest Spike */}
          <polygon points="32,15.5 28.5,24 35.5,24" fill="#FACC15" stroke="#78350F" strokeWidth="1.5" />
        </g>
      )}

      {/* 9: ASTRO-BOT (Creative Sci-Fi Robot with LED Visor) */}
      {index === 9 && (
        <g>
          <rect width="64" height="64" rx="18" fill={`url(#${uid}_bg5)`} />
          <circle cx="32" cy="34" r="24" fill="#FFFFFF" fillOpacity="0.3" />
          {/* Antenna */}
          <line x1="32" y1="8.5" x2="32" y2="17" stroke="#1E1B4B" strokeWidth="3" strokeLinecap="round" />
          <circle cx="32" cy="8.5" r="4" fill="#FACC15" stroke="#1E1B4B" strokeWidth="1.8" />
          {/* Side Bolts */}
          <rect x="9.5" y="31" width="5" height="10" rx="2" fill="#F59E0B" stroke="#1E1B4B" strokeWidth="1.5" />
          <rect x="49.5" y="31" width="5" height="10" rx="2" fill="#F59E0B" stroke="#1E1B4B" strokeWidth="1.5" />
          {/* Robot Chassis */}
          <rect x="14" y="17" width="36" height="34" rx="10" fill="#FFFFFF" stroke="#1E1B4B" strokeWidth="2.2" />
          {/* Dark LED Visor */}
          <rect x="18.5" y="22.5" width="27" height="14.5" rx="5" fill="#1E1B4B" />
          {/* Happy LED Eyes ^ ^ */}
          <path d="M22.5 31.5 L26 27 L29.5 31.5" stroke="#34D399" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M34.5 31.5 L38 27 L41.5 31.5" stroke="#34D399" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
          {/* Smile Mouth */}
          <rect x="24.5" y="41.5" width="15" height="4.5" rx="2.25" fill="#38BDF8" stroke="#1E1B4B" strokeWidth="1.5" />
        </g>
      )}

      {/* 10: PANDA BAMBU (Zen Panda with Green Headband) */}
      {index === 10 && (
        <g>
          <rect width="64" height="64" rx="18" fill={`url(#${uid}_bg1)`} />
          <circle cx="32" cy="34" r="24" fill="#FFFFFF" fillOpacity="0.28" />
          {/* Round Black Ears */}
          <circle cx="17" cy="20" r="6.8" fill="#1E1B4B" />
          <circle cx="47" cy="20" r="6.8" fill="#1E1B4B" />
          {/* White Head */}
          <ellipse cx="32" cy="36" rx="18.5" ry="16.5" fill="#FFFFFF" stroke="#1E1B4B" strokeWidth="2" />
          {/* Green Zen Headband */}
          <path d="M14.5 26 Q32 29 49.5 26" stroke="#10B981" strokeWidth="4.5" strokeLinecap="round" />
          {/* Iconic Panda Eye Patches */}
          <ellipse cx="24" cy="35" rx="5.5" ry="4.5" transform="rotate(-12 24 35)" fill="#1E1B4B" />
          <ellipse cx="40" cy="35" rx="5.5" ry="4.5" transform="rotate(12 40 35)" fill="#1E1B4B" />
          <circle cx="24.8" cy="34.2" r="1.9" fill="#FFFFFF" />
          <circle cx="39.8" cy="34.2" r="1.9" fill="#FFFFFF" />
          {/* Rosy Cheeks & Nose */}
          <circle cx="18" cy="41" r="3" fill="#FB7185" fillOpacity="0.75" />
          <circle cx="46" cy="41" r="3" fill="#FB7185" fillOpacity="0.75" />
          <ellipse cx="32" cy="40" rx="3.2" ry="2.2" fill="#1E1B4B" />
          <path d="M28.5 44.5 Q32 47.5 35.5 44.5" stroke="#1E1B4B" strokeWidth="2.2" strokeLinecap="round" />
        </g>
      )}

      {/* 11: TIGRE TROVÃO (Solar Tiger with Stripes & Star Emblem) */}
      {index === 11 && (
        <g>
          <rect width="64" height="64" rx="18" fill={`url(#${uid}_bg4)`} />
          <circle cx="32" cy="34" r="24" fill="#FFFFFF" fillOpacity="0.28" />
          {/* Ears */}
          <circle cx="17" cy="20" r="5.8" fill="#F97316" stroke="#7C2D12" strokeWidth="2" />
          <circle cx="47" cy="20" r="5.8" fill="#F97316" stroke="#7C2D12" strokeWidth="2" />
          {/* Tiger Head */}
          <ellipse cx="32" cy="36" rx="18.5" ry="16.5" fill="#FB923C" stroke="#7C2D12" strokeWidth="2" />
          {/* White Cheeks & Muzzle */}
          <ellipse cx="24" cy="42" rx="7.2" ry="5.2" fill="#FFFFFF" />
          <ellipse cx="40" cy="42" rx="7.2" ry="5.2" fill="#FFFFFF" />
          {/* Tiger Stripes */}
          <path d="M15 31 L20 32 M14 35 L19 35 M49 31 L44 32 M50 35 L45 35" stroke="#1E1B4B" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M32 20 L32 26 M28 22 L36 22" stroke="#1E1B4B" strokeWidth="2.5" strokeLinecap="round" />
          {/* Eyes */}
          <circle cx="24" cy="34" r="3.4" fill="#1E1B4B" />
          <circle cx="40" cy="34" r="3.4" fill="#1E1B4B" />
          <circle cx="25.2" cy="32.8" r="1.3" fill="#FFFFFF" />
          <circle cx="41.2" cy="32.8" r="1.3" fill="#FFFFFF" />
          {/* Nose */}
          <polygon points="32,38 28.5,41.5 35.5,41.5" fill="#F43F5E" />
          <path d="M28 44 Q32 47.5 36 44" stroke="#1E1B4B" strokeWidth="2.2" strokeLinecap="round" />
        </g>
      )}

      {/* Crisp White Cartoon Sticker Rim */}
      <rect
        x="1.5"
        y="1.5"
        width="61"
        height="61"
        rx="16.5"
        stroke="#FFFFFF"
        strokeOpacity="0.85"
        strokeWidth="3"
      />
    </svg>
  );
};
