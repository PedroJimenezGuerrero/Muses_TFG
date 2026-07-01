import React from 'react';

export interface DevotionTokenSvgProps {
  color?: string;
  playerNumber?: number; // 1 to 5
  size?: number | string;
  className?: string;
  count?: number;
}

const PLAYER_COLORS: Record<number, { primary: string; secondary: string; border: string }> = {
  1: { primary: '#F59E0B', secondary: '#B45309', border: '#78350F' }, // Amber / Gold
  2: { primary: '#3B82F6', secondary: '#1D4ED8', border: '#1E3A8A' }, // Sapphire / Blue
  3: { primary: '#EF4444', secondary: '#B91C1C', border: '#7F1D1D' }, // Ruby / Crimson
  4: { primary: '#10B981', secondary: '#047857', border: '#064E3B' }, // Emerald / Jade
  5: { primary: '#8B5CF6', secondary: '#6D28D9', border: '#4C1D95' }, // Amethyst / Purple
};

export const DevotionTokenSvg: React.FC<DevotionTokenSvgProps> = ({
  color,
  playerNumber = 1,
  size = 36,
  className = '',
  count,
}) => {
  const palette = PLAYER_COLORS[playerNumber] || {
    primary: color || '#F59E0B',
    secondary: '#B45309',
    border: '#78350F',
  };

  const idSuffix = `p${playerNumber}-${(color || 'def').replace(/[^a-zA-Z0-9]/g, '')}`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`select-none inline-block ${className}`}
      aria-label={`Devotion Token Player ${playerNumber}`}
    >
      <defs>
        <radialGradient id={`token-base-${idSuffix}`} cx="40%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.4" />
          <stop offset="25%" stopColor={palette.primary} />
          <stop offset="100%" stopColor={palette.secondary} />
        </radialGradient>
        <linearGradient id={`token-rim-${idSuffix}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FDE68A" />
          <stop offset="50%" stopColor="#D97706" />
          <stop offset="100%" stopColor="#78350F" />
        </linearGradient>
        <filter id={`token-shadow-${idSuffix}`} x="-15%" y="-15%" width="130%" height="130%">
          <feDropShadow dx="0" dy="2.5" stdDeviation="2.5" floodColor="#000000" floodOpacity="0.45" />
        </filter>
      </defs>

      <g filter={`url(#token-shadow-${idSuffix})`}>
        {/* Outer Beveled Bronze/Gold Rim */}
        <circle cx="50" cy="50" r="46" fill={`url(#token-rim-${idSuffix})`} stroke={palette.border} strokeWidth="1.5" />

        {/* Inner Groove */}
        <circle cx="50" cy="50" r="41" fill={palette.border} />

        {/* Medallion Core with Player Hue */}
        <circle cx="50" cy="50" r="38" fill={`url(#token-base-${idSuffix})`} />

        {/* Concentric Decorative Ring */}
        <circle cx="50" cy="50" r="32" stroke="#FFFFFF" strokeWidth="1" strokeDasharray="3 2" opacity="0.5" />

        {/* Sacred Flame Motif */}
        <path
          d="M50 20 C53 28 58 33 60 40 C63 47 62 57 56 63 C53 66 49 67 46 67 C41 67 36 63 34 57 C32 50 35 43 38 38 C39 42 41 45 44 46 C44 41 43 36 45 30 C47 26 49 22 50 20 Z"
          fill="#FEF3C7"
          opacity="0.95"
        />
        <path
          d="M50 36 C52 42 55 45 55 50 C55 55 52 59 48 60 C45 60 42 58 41 55 C40 51 42 47 44 44 C45 47 46 48 48 48 C48 44 47 41 49 38 C49 37 50 36 50 36 Z"
          fill="#F59E0B"
        />

        {/* Subtle Specular Highlight */}
        <ellipse cx="42" cy="28" rx="14" ry="7" fill="#FFFFFF" opacity="0.25" transform="rotate(-20 42 28)" />
      </g>

      {/* Optional Stack Count Overlay */}
      {count !== undefined && count > 1 && (
        <g>
          <circle cx="76" cy="24" r="18" fill="#18181B" stroke="#FDE68A" strokeWidth="2" />
          <text
            x="76"
            y="29"
            fill="#FEF08A"
            fontSize="18"
            fontWeight="bold"
            fontFamily="sans-serif"
            textAnchor="middle"
          >
            {count}
          </text>
        </g>
      )}
    </svg>
  );
};
