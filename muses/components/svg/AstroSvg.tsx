import React from 'react';

export interface AstroSvgProps {
  type: 'sun' | 'moon' | 'SOL' | 'LUNA';
  className?: string;
  size?: number | string;
  showGlow?: boolean;
}

export const AstroSvg: React.FC<AstroSvgProps> = ({
  type,
  className = '',
  size = 64,
  showGlow = true,
}) => {
  const isSun = type === 'sun' || type === 'SOL';

  if (isSun) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`select-none ${className}`}
        aria-label="Astro Solar"
      >
        <defs>
          <radialGradient id="sun-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FDE047" stopOpacity="0.9" />
            <stop offset="50%" stopColor="#F59E0B" stopOpacity="0.8" />
            <stop offset="85%" stopColor="#D97706" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#B45309" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="sun-gold" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FEF08A" />
            <stop offset="40%" stopColor="#F59E0B" />
            <stop offset="100%" stopColor="#B45309" />
          </linearGradient>
          <filter id="sun-shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#78350F" floodOpacity="0.5" />
          </filter>
        </defs>

        {/* Ambient Outer Halo */}
        {showGlow && <circle cx="50" cy="50" r="48" fill="url(#sun-glow)" />}

        {/* 12 Radiating Sun Rays (alternating large and medium triangles) */}
        <g filter="url(#sun-shadow)">
          {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((angle, i) => (
            <polygon
              key={angle}
              points={i % 2 === 0 ? '50,6 45,28 55,28' : '50,12 46,28 54,28'}
              fill="url(#sun-gold)"
              transform={`rotate(${angle} 50 50)`}
            />
          ))}

          {/* Outer Sun Medallion Rim */}
          <circle cx="50" cy="50" r="26" fill="#78350F" stroke="#FDE047" strokeWidth="1.5" />

          {/* Inner Golden Body */}
          <circle cx="50" cy="50" r="23" fill="url(#sun-gold)" />

          {/* Ancient Vergina Sun Center Disc */}
          <circle cx="50" cy="50" r="14" fill="#92400E" stroke="#FEF08A" strokeWidth="1.2" />
          <circle cx="50" cy="50" r="8" fill="#FBBF24" />
          <circle cx="50" cy="50" r="3.5" fill="#78350F" />
        </g>
      </svg>
    );
  }

  // Moon Astro SVG
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`select-none ${className}`}
      aria-label="Astro Lunar"
    >
      <defs>
        <radialGradient id="moon-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#A5B4FC" stopOpacity="0.8" />
          <stop offset="50%" stopColor="#6366F1" stopOpacity="0.5" />
          <stop offset="85%" stopColor="#312E81" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#1E1B4B" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="moon-silver" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="45%" stopColor="#C7D2FE" />
          <stop offset="100%" stopColor="#6366F1" />
        </linearGradient>
        <filter id="moon-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#0F172A" floodOpacity="0.6" />
        </filter>
      </defs>

      {/* Ambient Celestial Glow */}
      {showGlow && <circle cx="50" cy="50" r="48" fill="url(#moon-glow)" />}

      <g filter="url(#moon-shadow)">
        {/* Deep Night Medallion Base */}
        <circle cx="50" cy="50" r="36" fill="#1E1B4B" stroke="#818CF8" strokeWidth="2" />
        <circle cx="50" cy="50" r="32" fill="#312E81" />

        {/* 4-Point Stars in Background */}
        <path d="M68 28 Q68 32 72 32 Q68 32 68 36 Q68 32 64 32 Q68 32 68 28 Z" fill="#E0E7FF" opacity="0.9" />
        <path d="M30 68 Q30 71 33 71 Q30 71 30 74 Q30 71 27 71 Q30 71 30 68 Z" fill="#E0E7FF" opacity="0.8" />
        <circle cx="66" cy="68" r="1.5" fill="#C7D2FE" opacity="0.7" />
        <circle cx="34" cy="30" r="1.2" fill="#C7D2FE" opacity="0.7" />

        {/* Double Crescent Moon Motif */}
        {/* Outer Crescent */}
        <path
          d="M48 22 C63 22 74 34 74 50 C74 66 63 78 48 78 C58 71 63 61 63 50 C63 39 58 29 48 22 Z"
          fill="url(#moon-silver)"
        />
        {/* Inner Mirrored Crescent */}
        <path
          d="M44 32 C35 32 28 40 28 50 C28 60 35 68 44 68 C38 63 35 57 35 50 C35 43 38 37 44 32 Z"
          fill="#E0E7FF"
          opacity="0.85"
        />
      </g>
    </svg>
  );
};
