import React from 'react';

interface AvatarSvgProps {
  avatarId: number;
  size?: number;
  className?: string;
}

export const AVATAR_LIST = [
  { id: 0, label: 'Kitsune Artista', role: 'Raposa de Boina' },
  { id: 1, label: 'Sapo DJ', role: 'Fones de Estúdio' },
  { id: 2, label: 'Capitão Octo', role: 'Pirata dos Mares' },
  { id: 3, label: 'Coruja Arcana', role: 'Maga Estelar' },
  { id: 4, label: 'Rei Juba', role: 'Monarca Dourado' },
  { id: 5, label: 'Pinguim Aviador', role: 'Piloto Polar' },
  { id: 6, label: 'Neko Ninja', role: 'Gato Mistério' },
  { id: 7, label: 'Camaleão Pop', role: 'Mestre Croma' },
  { id: 8, label: 'Draco Rubi', role: 'Guardião do Fogo' },
  { id: 9, label: 'Astro-Bot', role: 'Androide Criativo' },
  { id: 10, label: 'Panda Bambu', role: 'Mestre Zen' },
  { id: 11, label: 'Tigre Trovão', role: 'Campeão Solar' },
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
      className={`shrink-0 rounded-2xl shadow-md select-none ${className}`}
      role="img"
      aria-label={meta.label}
    >
      <defs>
        <linearGradient id={`${uid}_bg0`} x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#431407" />
          <stop offset="100%" stopColor="#1E1B4B" />
        </linearGradient>
        <linearGradient id={`${uid}_bg1`} x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#064E3B" />
          <stop offset="100%" stopColor="#0F172A" />
        </linearGradient>
        <linearGradient id={`${uid}_bg2`} x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#4C0519" />
          <stop offset="100%" stopColor="#1E1B4B" />
        </linearGradient>
        <linearGradient id={`${uid}_bg3`} x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#2E1065" />
          <stop offset="100%" stopColor="#090D16" />
        </linearGradient>
        <linearGradient id={`${uid}_bg4`} x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#78350F" />
          <stop offset="100%" stopColor="#271206" />
        </linearGradient>
        <linearGradient id={`${uid}_bg5`} x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#0C4A6E" />
          <stop offset="100%" stopColor="#0F172A" />
        </linearGradient>
      </defs>

      {/* 0: KITSUNE ARTISTA (Fox with Purple Artist Beret) */}
      {index === 0 && (
        <g>
          <rect width="64" height="64" rx="16" fill={`url(#${uid}_bg0)`} />
          <circle cx="32" cy="34" r="24" fill="#F97316" fillOpacity="0.12" />
          {/* Ears */}
          <path d="M12 14 L25 26 L13 33 Z" fill="#EA580C" stroke="#9A3412" strokeWidth="1.5" />
          <path d="M15 18 L22 25 L15 29 Z" fill="#FDE68A" />
          <path d="M52 14 L39 26 L51 33 Z" fill="#EA580C" stroke="#9A3412" strokeWidth="1.5" />
          <path d="M49 18 L42 25 L49 29 Z" fill="#FDE68A" />
          {/* Head */}
          <path d="M14 34 C14 23 50 23 50 34 C53 43 43 52 32 52 C21 52 11 43 14 34 Z" fill="#FB923C" />
          {/* White Cheeks */}
          <path d="M14 38 C19 36 26 42 32 51 C21 52 13 45 14 38 Z" fill="#FFFBEB" />
          <path d="M50 38 C45 36 38 42 32 51 C43 52 51 45 50 38 Z" fill="#FFFBEB" />
          {/* Eyes with catchlights */}
          <circle cx="24" cy="36" r="3.6" fill="#0F172A" />
          <circle cx="25.2" cy="34.8" r="1.3" fill="#FFFFFF" />
          <circle cx="40" cy="36" r="3.6" fill="#0F172A" />
          <circle cx="41.2" cy="34.8" r="1.3" fill="#FFFFFF" />
          {/* Nose & Smile */}
          <polygon points="32,41 29,44.5 35,44.5" fill="#0F172A" />
          <path d="M28 46.5 Q32 49.5 36 46.5" stroke="#0F172A" strokeWidth="2" strokeLinecap="round" />
          {/* Artist Beret */}
          <ellipse cx="34" cy="18" rx="15" ry="6.5" transform="rotate(-10 34 18)" fill="#9333EA" stroke="#FACC15" strokeWidth="1.5" />
          <path d="M33 10 L35 13" stroke="#FACC15" strokeWidth="2.5" strokeLinecap="round" />
        </g>
      )}

      {/* 1: SAPO DJ (Emerald Frog with Studio Headphones) */}
      {index === 1 && (
        <g>
          <rect width="64" height="64" rx="16" fill={`url(#${uid}_bg1)`} />
          {/* Headphone Arc */}
          <path d="M11 36 C11 14 53 14 53 36" stroke="#F59E0B" strokeWidth="4" strokeLinecap="round" />
          {/* Frog Eye Bumps */}
          <circle cx="22" cy="24" r="8" fill="#10B981" />
          <circle cx="42" cy="24" r="8" fill="#10B981" />
          <circle cx="22" cy="24" r="5" fill="#FFFFFF" />
          <circle cx="42" cy="24" r="5" fill="#FFFFFF" />
          <circle cx="22" cy="24" r="2.8" fill="#0F172A" />
          <circle cx="42" cy="24" r="2.8" fill="#0F172A" />
          <circle cx="23" cy="22.8" r="1.1" fill="#FFFFFF" />
          <circle cx="43" cy="22.8" r="1.1" fill="#FFFFFF" />
          {/* Face */}
          <ellipse cx="32" cy="38" rx="19" ry="14" fill="#10B981" />
          <ellipse cx="32" cy="43" rx="14" ry="8" fill="#A7F3D0" />
          {/* Rosy Cheeks */}
          <circle cx="19" cy="38" r="3" fill="#F43F5E" fillOpacity="0.55" />
          <circle cx="45" cy="38" r="3" fill="#F43F5E" fillOpacity="0.55" />
          {/* Big Happy Smile */}
          <path d="M21 39 Q32 47 43 39" stroke="#064E3B" strokeWidth="2.8" strokeLinecap="round" />
          {/* Headphone Cups */}
          <rect x="7" y="30" width="7" height="14" rx="3.5" fill="#F59E0B" stroke="#FEF3C7" strokeWidth="1.2" />
          <rect x="50" y="30" width="7" height="14" rx="3.5" fill="#F59E0B" stroke="#FEF3C7" strokeWidth="1.2" />
        </g>
      )}

      {/* 2: CAPITÃO OCTO (Pirate Octopus with Bandana & Golden Monocle) */}
      {index === 2 && (
        <g>
          <rect width="64" height="64" rx="16" fill={`url(#${uid}_bg2)`} />
          {/* Tentacles at bottom */}
          <path d="M12 48 Q16 56 22 50 Q27 56 32 50 Q37 56 42 50 Q48 56 52 48" stroke="#FB7185" strokeWidth="5" strokeLinecap="round" fill="none" />
          {/* Head Dome */}
          <ellipse cx="32" cy="33" rx="18" ry="17" fill="#F43F5E" />
          {/* Pirate Bandana */}
          <path d="M14 27 C16 16 48 16 50 27 Z" fill="#1E293B" />
          <path d="M14 27 L50 27" stroke="#FBBF24" strokeWidth="2.5" />
          <circle cx="32" cy="21" r="2.5" fill="#F8FAFC" />
          {/* Eyes & Golden Monocle */}
          <circle cx="24" cy="35" r="3.5" fill="#0F172A" />
          <circle cx="25" cy="33.8" r="1.2" fill="#FFFFFF" />
          <circle cx="40" cy="35" r="5.5" fill="#FEF08A" fillOpacity="0.25" stroke="#FACC15" strokeWidth="2.2" />
          <circle cx="40" cy="35" r="2.8" fill="#0F172A" />
          <line x1="45.5" y1="36" x2="48" y2="46" stroke="#FACC15" strokeWidth="1.5" />
          {/* Cute Suction Mouth */}
          <circle cx="32" cy="42" r="3" fill="#881337" stroke="#FDA4AF" strokeWidth="1.5" />
        </g>
      )}

      {/* 3: CORUJA ARCANA (Mystic Owl with Starry Wizard Hat & Glasses) */}
      {index === 3 && (
        <g>
          <rect width="64" height="64" rx="16" fill={`url(#${uid}_bg3)`} />
          {/* Owl Body/Head */}
          <ellipse cx="32" cy="38" rx="17" ry="16" fill="#818CF8" />
          <ellipse cx="32" cy="43" rx="11" ry="10" fill="#E0E7FF" />
          {/* Feather Chest Marks */}
          <path d="M28 43 Q30 45 32 43 M32 43 Q34 45 36 43 M30 48 Q32 50 34 48" stroke="#6366F1" strokeWidth="1.8" strokeLinecap="round" />
          {/* Big Spectacles & Eyes */}
          <circle cx="24" cy="33" r="6.5" fill="#FEFCE8" stroke="#FBBF24" strokeWidth="2.2" />
          <circle cx="40" cy="33" r="6.5" fill="#FEFCE8" stroke="#FBBF24" strokeWidth="2.2" />
          <line x1="30.5" y1="33" x2="33.5" y2="33" stroke="#FBBF24" strokeWidth="2.2" />
          <circle cx="24" cy="33" r="3.2" fill="#1E1B4B" />
          <circle cx="40" cy="33" r="3.2" fill="#1E1B4B" />
          <circle cx="25" cy="31.8" r="1.2" fill="#FFFFFF" />
          <circle cx="41" cy="31.8" r="1.2" fill="#FFFFFF" />
          {/* Beak */}
          <polygon points="32,35 29,40 35,40" fill="#F59E0B" />
          {/* Wizard Hat */}
          <path d="M12 24 L52 24 L37 7 L29 12 Z" fill="#4C1D95" stroke="#C084FC" strokeWidth="1.5" />
          <ellipse cx="32" cy="24" rx="21" ry="3.5" fill="#6D28D9" />
          <circle cx="34" cy="17" r="2" fill="#FACC15" />
        </g>
      )}

      {/* 4: REI JUBA (Royal Lion with Golden Crown) */}
      {index === 4 && (
        <g>
          <rect width="64" height="64" rx="16" fill={`url(#${uid}_bg4)`} />
          {/* Lush Mane */}
          <circle cx="32" cy="36" r="21" fill="#B45309" stroke="#78350F" strokeWidth="2" />
          {/* Ears */}
          <circle cx="18" cy="23" r="4.5" fill="#F59E0B" />
          <circle cx="46" cy="23" r="4.5" fill="#F59E0B" />
          {/* Face */}
          <circle cx="32" cy="36" r="14.5" fill="#FBBF24" />
          {/* Muzzle */}
          <ellipse cx="28.5" cy="41" rx="4.5" ry="3.5" fill="#FEF3C7" />
          <ellipse cx="35.5" cy="41" rx="4.5" ry="3.5" fill="#FEF3C7" />
          <polygon points="32,37 28.5,40 35.5,40" fill="#78350F" />
          {/* Eyes */}
          <circle cx="25" cy="33" r="2.8" fill="#1E293B" />
          <circle cx="39" cy="33" r="2.8" fill="#1E293B" />
          <circle cx="25.8" cy="32" r="1" fill="#FFFFFF" />
          <circle cx="39.8" cy="32" r="1" fill="#FFFFFF" />
          {/* Royal Crown */}
          <polygon points="20,21 23,11 28,17 32,9 36,17 41,11 44,21" fill="#FACC15" stroke="#FEF08A" strokeWidth="1.2" />
          <circle cx="32" cy="16" r="2" fill="#EF4444" />
        </g>
      )}

      {/* 5: PINGUIM AVIADOR (Polar Penguin with Aviator Goggles & Scarf) */}
      {index === 5 && (
        <g>
          <rect width="64" height="64" rx="16" fill={`url(#${uid}_bg5)`} />
          {/* Body/Head */}
          <ellipse cx="32" cy="36" rx="17" ry="18" fill="#1E293B" />
          <ellipse cx="32" cy="39" rx="12.5" ry="13.5" fill="#F8FAFC" />
          {/* Aviator Goggles on Forehead */}
          <rect x="16" y="19" width="32" height="7" rx="3" fill="#78350F" />
          <circle cx="24" cy="22.5" r="5" fill="#38BDF8" stroke="#FBBF24" strokeWidth="2" />
          <circle cx="40" cy="22.5" r="5" fill="#38BDF8" stroke="#FBBF24" strokeWidth="2" />
          {/* Eyes */}
          <circle cx="25" cy="34" r="2.8" fill="#0F172A" />
          <circle cx="39" cy="34" r="2.8" fill="#0F172A" />
          <circle cx="25.8" cy="33" r="1" fill="#FFFFFF" />
          <circle cx="39.8" cy="33" r="1" fill="#FFFFFF" />
          {/* Beak */}
          <polygon points="32,36 27,40 32,43 37,40" fill="#FB923C" />
          {/* Red Winter Scarf */}
          <rect x="18" y="47" width="28" height="6" rx="3" fill="#EF4444" />
          <rect x="36" y="49" width="6" height="10" rx="2" fill="#DC2626" />
        </g>
      )}

      {/* 6: NEKO NINJA (Cyber-Samurai Cat with Headband) */}
      {index === 6 && (
        <g>
          <rect width="64" height="64" rx="16" fill={`url(#${uid}_bg3)`} />
          {/* Cat Ears */}
          <polygon points="14,14 26,24 15,31" fill="#312E81" stroke="#818CF8" strokeWidth="1.5" />
          <polygon points="50,14 38,24 49,31" fill="#312E81" stroke="#818CF8" strokeWidth="1.5" />
          {/* Head */}
          <ellipse cx="32" cy="36" rx="17" ry="15" fill="#1E1B4B" stroke="#6366F1" strokeWidth="1.5" />
          {/* Ninja Headband */}
          <path d="M15 29 Q32 32 49 29 L49 24 Q32 27 15 24 Z" fill="#EF4444" />
          <rect x="27" y="24.5" width="10" height="5" rx="1.5" fill="#E2E8F0" />
          {/* Glowing Eyes */}
          <ellipse cx="24" cy="37" rx="3.8" ry="3" fill="#22D3EE" />
          <ellipse cx="40" cy="37" rx="3.8" ry="3" fill="#22D3EE" />
          <rect x="23.2" y="34.5" width="1.6" height="5" fill="#0F172A" />
          <rect x="39.2" y="34.5" width="1.6" height="5" fill="#0F172A" />
          {/* Whiskers & Cute Mouth */}
          <path d="M29 43 Q32 45 35 43" stroke="#F8FAFC" strokeWidth="2" strokeLinecap="round" />
          <line x1="12" y1="39" x2="18" y2="40" stroke="#94A3B8" strokeWidth="1.5" />
          <line x1="52" y1="39" x2="46" y2="40" stroke="#94A3B8" strokeWidth="1.5" />
        </g>
      )}

      {/* 7: CAMALEÃO POP (Chameleon with Crest & Vivid Eyes) */}
      {index === 7 && (
        <g>
          <rect width="64" height="64" rx="16" fill={`url(#${uid}_bg1)`} />
          {/* Chameleon Crest */}
          <path d="M18 28 C18 13 44 12 46 28 Z" fill="#84CC16" stroke="#ECFCCB" strokeWidth="1.5" />
          {/* Face */}
          <ellipse cx="32" cy="36" rx="18" ry="14" fill="#A3E635" />
          {/* Colorful Turret Eyes */}
          <circle cx="23" cy="34" r="6" fill="#06B6D4" stroke="#FEF08A" strokeWidth="2" />
          <circle cx="41" cy="34" r="6" fill="#EC4899" stroke="#FEF08A" strokeWidth="2" />
          <circle cx="23" cy="34" r="2.5" fill="#0F172A" />
          <circle cx="41" cy="34" r="2.5" fill="#0F172A" />
          {/* Curled Tongue Smile */}
          <path d="M22 44 Q32 48 42 44" stroke="#14532D" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M36 45 C42 48 44 53 40 53 C38 53 38 50 40 50" stroke="#F43F5E" strokeWidth="2.5" strokeLinecap="round" fill="none" />
        </g>
      )}

      {/* 8: DRACO RUBI (Dragon with Curved Golden Horns) */}
      {index === 8 && (
        <g>
          <rect width="64" height="64" rx="16" fill={`url(#${uid}_bg2)`} />
          {/* Curved Golden Horns */}
          <path d="M19 25 C12 18 14 10 21 11 C19 16 21 20 24 23 Z" fill="#FACC15" stroke="#CA8A04" strokeWidth="1.2" />
          <path d="M45 25 C52 18 50 10 43 11 C45 16 43 20 40 23 Z" fill="#FACC15" stroke="#CA8A04" strokeWidth="1.2" />
          {/* Dragon Head */}
          <path d="M15 34 C15 21 49 21 49 34 C49 46 41 52 32 52 C23 52 15 46 15 34 Z" fill="#E11D48" stroke="#FDA4AF" strokeWidth="1.2" />
          {/* Belly/Snout Ridge */}
          <ellipse cx="32" cy="43" rx="10" ry="7" fill="#FB7185" />
          <circle cx="28.5" cy="41.5" r="1.5" fill="#4C0519" />
          <circle cx="35.5" cy="41.5" r="1.5" fill="#4C0519" />
          {/* Fierce Amber Eyes */}
          <polygon points="20,31 28,33 22,36" fill="#FEF08A" />
          <polygon points="44,31 36,33 42,36" fill="#FEF08A" />
          {/* Center Crest Spike */}
          <polygon points="32,16 29,24 35,24" fill="#FACC15" />
        </g>
      )}

      {/* 9: ASTRO-BOT (Creative Sci-Fi Robot with LED Visor) */}
      {index === 9 && (
        <g>
          <rect width="64" height="64" rx="16" fill={`url(#${uid}_bg5)`} />
          {/* Antenna */}
          <line x1="32" y1="9" x2="32" y2="17" stroke="#38BDF8" strokeWidth="3" strokeLinecap="round" />
          <circle cx="32" cy="9" r="3.5" fill="#FACC15" />
          {/* Side Bolts */}
          <rect x="10" y="31" width="5" height="10" rx="2" fill="#94A3B8" />
          <rect x="49" y="31" width="5" height="10" rx="2" fill="#94A3B8" />
          {/* Robot Chassis */}
          <rect x="14" y="17" width="36" height="34" rx="10" fill="#E2E8F0" stroke="#38BDF8" strokeWidth="2" />
          {/* Dark LED Visor */}
          <rect x="19" y="23" width="26" height="14" rx="5" fill="#0F172A" />
          {/* Happy LED Eyes ^ ^ */}
          <path d="M23 31 L26 27 L29 31" stroke="#2DD4BF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M35 31 L38 27 L41 31" stroke="#2DD4BF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          {/* Audio Grill Mouth */}
          <rect x="25" y="42" width="14" height="4" rx="2" fill="#0F172A" />
          <line x1="29" y1="42" x2="29" y2="46" stroke="#38BDF8" strokeWidth="1.5" />
          <line x1="32" y1="42" x2="32" y2="46" stroke="#38BDF8" strokeWidth="1.5" />
          <line x1="35" y1="42" x2="35" y2="46" stroke="#38BDF8" strokeWidth="1.5" />
        </g>
      )}

      {/* 10: PANDA BAMBU (Zen Panda with Green Headband) */}
      {index === 10 && (
        <g>
          <rect width="64" height="64" rx="16" fill={`url(#${uid}_bg1)`} />
          {/* Round Black Ears */}
          <circle cx="17" cy="20" r="6.5" fill="#0F172A" />
          <circle cx="47" cy="20" r="6.5" fill="#0F172A" />
          {/* White Head */}
          <ellipse cx="32" cy="36" rx="18" ry="16" fill="#F8FAFC" stroke="#CBD5E1" strokeWidth="1.5" />
          {/* Green Zen Headband */}
          <path d="M15 26 Q32 29 49 26" stroke="#10B981" strokeWidth="4" strokeLinecap="round" />
          {/* Iconic Panda Eye Patches */}
          <ellipse cx="24" cy="35" rx="5.5" ry="4.5" transform="rotate(-12 24 35)" fill="#0F172A" />
          <ellipse cx="40" cy="35" rx="5.5" ry="4.5" transform="rotate(12 40 35)" fill="#0F172A" />
          <circle cx="24.5" cy="34.5" r="1.8" fill="#FFFFFF" />
          <circle cx="39.5" cy="34.5" r="1.8" fill="#FFFFFF" />
          {/* Rosy Cheeks & Nose */}
          <circle cx="18" cy="41" r="2.8" fill="#FDA4AF" />
          <circle cx="46" cy="41" r="2.8" fill="#FDA4AF" />
          <ellipse cx="32" cy="40" rx="3" ry="2" fill="#0F172A" />
          <path d="M29 44 Q32 46.5 35 44" stroke="#0F172A" strokeWidth="2" strokeLinecap="round" />
        </g>
      )}

      {/* 11: TIGRE TROVÃO (Solar Tiger with Stripes & Star Emblem) */}
      {index === 11 && (
        <g>
          <rect width="64" height="64" rx="16" fill={`url(#${uid}_bg0)`} />
          {/* Ears */}
          <circle cx="17" cy="20" r="5.5" fill="#F59E0B" stroke="#78350F" strokeWidth="1.5" />
          <circle cx="47" cy="20" r="5.5" fill="#F59E0B" stroke="#78350F" strokeWidth="1.5" />
          {/* Tiger Head */}
          <ellipse cx="32" cy="36" rx="18" ry="16" fill="#FB923C" />
          {/* White Cheeks & Muzzle */}
          <ellipse cx="24" cy="42" rx="7" ry="5" fill="#FFFBEB" />
          <ellipse cx="40" cy="42" rx="7" ry="5" fill="#FFFBEB" />
          {/* Tiger Stripes */}
          <path d="M15 31 L20 32 M14 35 L19 35 M49 31 L44 32 M50 35 L45 35" stroke="#1E293B" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M32 20 L32 26 M28 22 L36 22" stroke="#1E293B" strokeWidth="2.5" strokeLinecap="round" />
          {/* Eyes */}
          <circle cx="24" cy="34" r="3" fill="#0F172A" />
          <circle cx="40" cy="34" r="3" fill="#0F172A" />
          <circle cx="25" cy="33" r="1.1" fill="#FEF08A" />
          <circle cx="41" cy="33" r="1.1" fill="#FEF08A" />
          {/* Nose */}
          <polygon points="32,38 28.5,41.5 35.5,41.5" fill="#F43F5E" />
          <path d="M28 44 Q32 47 36 44" stroke="#0F172A" strokeWidth="2.2" strokeLinecap="round" />
        </g>
      )}

      {/* Subtle Glossy Rim Border */}
      <rect
        x="1"
        y="1"
        width="62"
        height="62"
        rx="15"
        stroke="white"
        strokeOpacity="0.18"
        strokeWidth="2"
      />
    </svg>
  );
};
