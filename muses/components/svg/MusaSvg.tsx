import React from 'react';
import { TipoMusa, MUSAS_METADATA } from '@/types/game';

export interface MusaSvgProps {
  musa: TipoMusa | string;
  size?: number | string;
  className?: string;
  showPoints?: boolean;
}

export const MusaSvg: React.FC<MusaSvgProps> = ({
  musa,
  size = 200,
  className = '',
  showPoints = true,
}) => {
  const normKey = (musa.toUpperCase().replace('Í', 'I').replace('Ó', 'O') as TipoMusa);
  const meta = MUSAS_METADATA[normKey] || MUSAS_METADATA.CLIO;

  const renderMuseSymbol = () => {
    switch (meta.nombre) {
      case 'CLIO': // Scroll / Papyrus
        return (
          <g transform="translate(100, 100)" stroke="#FEF3C7" strokeWidth="2.5" fill="none">
            {/* Scroll body */}
            <rect x="-24" y="-28" width="48" height="56" rx="4" fill="#78350F" />
            <path d="M-28 -28 C-28 -34 -20 -34 -20 -28 L-20 28 C-20 34 -28 34 -28 28 Z" fill="#D97706" />
            <path d="M20 -28 C20 -34 28 -34 28 -28 L28 28 C28 34 20 34 20 28 Z" fill="#D97706" />
            {/* Text lines */}
            <line x1="-12" y1="-14" x2="12" y2="-14" stroke="#FDE68A" />
            <line x1="-12" y1="-4" x2="12" y2="-4" stroke="#FDE68A" />
            <line x1="-12" y1="6" x2="12" y2="6" stroke="#FDE68A" />
            <line x1="-12" y1="16" x2="6" y2="16" stroke="#FDE68A" />
          </g>
        );

      case 'EUTERPE': // Music / Lyre
        return (
          <g transform="translate(100, 100)" stroke="#FDE68A" strokeWidth="2.5" fill="none">
            <path d="M-20 -24 C-20 16 -12 28 0 28 C12 28 20 16 20 -24" strokeWidth="4" />
            <line x1="-24" y1="-24" x2="24" y2="-24" strokeWidth="4" strokeLinecap="round" />
            <line x1="-8" y1="-24" x2="-8" y2="24" strokeWidth="1.5" />
            <line x1="-2" y1="-24" x2="-2" y2="27" strokeWidth="1.5" />
            <line x1="4" y1="-24" x2="4" y2="27" strokeWidth="1.5" />
            <line x1="10" y1="-24" x2="10" y2="24" strokeWidth="1.5" />
            <circle cx="0" cy="33" r="5" fill="#D97706" />
          </g>
        );

      case 'TALIA': // Comedy Mask (Smiling)
        return (
          <g transform="translate(100, 96)">
            {/* Mask Outline */}
            <path
              d="M-26 -20 C-26 -35 26 -35 26 -20 C26 15 18 32 0 32 C-18 32 -26 15 -26 -20 Z"
              fill="#78350F"
              stroke="#FDE68A"
              strokeWidth="3"
            />
            {/* Joyful Eyes */}
            <path d="M-16 -10 Q-11 -16 -6 -10" stroke="#FEF3C7" strokeWidth="2.5" fill="none" strokeLinecap="round" />
            <path d="M6 -10 Q11 -16 16 -10" stroke="#FEF3C7" strokeWidth="2.5" fill="none" strokeLinecap="round" />
            {/* Laughing Smile */}
            <path
              d="M-15 4 Q0 24 15 4 Q0 12 -15 4 Z"
              fill="#F59E0B"
              stroke="#FEF3C7"
              strokeWidth="2"
            />
          </g>
        );

      case 'MELPOMENE': // Tragedy Mask (Weeping)
        return (
          <g transform="translate(100, 96)">
            {/* Mask Outline */}
            <path
              d="M-26 -20 C-26 -35 26 -35 26 -20 C26 15 18 32 0 32 C-18 32 -26 15 -26 -20 Z"
              fill="#450A0A"
              stroke="#F87171"
              strokeWidth="3"
            />
            {/* Sorrowful Eyes */}
            <path d="M-16 -8 Q-11 -4 -6 -8" stroke="#FEE2E2" strokeWidth="2.5" fill="none" strokeLinecap="round" />
            <path d="M6 -8 Q11 -4 16 -8" stroke="#FEE2E2" strokeWidth="2.5" fill="none" strokeLinecap="round" />
            {/* Weeping Mouth */}
            <path
              d="M-15 16 Q0 4 15 16 Q0 10 -15 16 Z"
              fill="#7F1D1D"
              stroke="#FEE2E2"
              strokeWidth="2"
            />
          </g>
        );

      case 'TERPSICORE': // Dance / Sandals & Rhythmic Lyre
        return (
          <g transform="translate(100, 100)" stroke="#A7F3D0" strokeWidth="2" fill="none">
            {/* Dancing figure swirl */}
            <path d="M0 -30 C15 -20 20 -5 10 10 C0 25 -15 15 -10 0 C-5 -15 15 -10 20 15" strokeWidth="3" />
            <circle cx="0" cy="-32" r="5" fill="#10B981" />
            <path d="M-18 20 Q-10 28 0 24 Q10 28 18 20" strokeWidth="2.5" />
          </g>
        );

      case 'ERATO': // Love Poetry / Cithara & Heart
        return (
          <g transform="translate(100, 98)">
            {/* Classical Love Heart */}
            <path
              d="M0 -10 C-6 -26 -26 -20 -22 -2 C-18 14 0 28 0 28 C0 28 18 14 22 -2 C26 -20 6 -26 0 -10 Z"
              fill="#831843"
              stroke="#F472B6"
              strokeWidth="2.5"
            />
            {/* Inner strings */}
            <line x1="-5" y1="-8" x2="-5" y2="18" stroke="#FBCFE8" strokeWidth="1.5" />
            <line x1="0" y1="-10" x2="0" y2="20" stroke="#FBCFE8" strokeWidth="1.5" />
            <line x1="5" y1="-8" x2="5" y2="18" stroke="#FBCFE8" strokeWidth="1.5" />
          </g>
        );

      case 'POLIMNIA': // Sacred Hymns / Veil & Temple Star
        return (
          <g transform="translate(100, 98)" stroke="#E9D5FF" strokeWidth="2" fill="none">
            {/* Sacred temple flame/veil */}
            <path
              d="M0 -30 C12 -18 24 0 20 18 C16 30 -16 30 -20 18 C-24 0 -12 -18 0 -30 Z"
              fill="#581C87"
            />
            {/* Eight-pointed star of contemplation */}
            <polygon
              points="0,-16 4,-6 14,-6 6,0 10,10 0,4 -10,10 -6,0 -14,-6 -4,-6"
              fill="#FDE047"
              stroke="none"
            />
          </g>
        );

      case 'URANIA': // Astronomy / Celestial Sphere & Stars
        return (
          <g transform="translate(100, 98)" stroke="#BAE6FD" strokeWidth="2" fill="none">
            {/* Armillary celestial globe */}
            <circle cx="0" cy="0" r="26" stroke="#38BDF8" strokeWidth="2.5" fill="#0C4A6E" />
            <ellipse cx="0" cy="0" rx="26" ry="10" stroke="#7DD3FC" strokeWidth="1.5" />
            <line x1="0" y1="-26" x2="0" y2="26" stroke="#7DD3FC" strokeWidth="1.5" />
            <line x1="-26" y1="0" x2="26" y2="0" stroke="#7DD3FC" strokeWidth="1.5" />
            {/* North star */}
            <circle cx="0" cy="-26" r="3.5" fill="#FEF08A" stroke="none" />
          </g>
        );

      case 'CALIOPE': // Epic Poetry / Wax Tablet & Stylus
      default:
        return (
          <g transform="translate(100, 98)">
            {/* Diptych Wax Tablets */}
            <rect x="-26" y="-22" width="24" height="42" rx="3" fill="#78350F" stroke="#FDE68A" strokeWidth="2" />
            <rect x="2" y="-22" width="24" height="42" rx="3" fill="#78350F" stroke="#FDE68A" strokeWidth="2" />
            <line x1="0" y1="-22" x2="0" y2="20" stroke="#B45309" strokeWidth="3" />
            {/* Stylus lying across */}
            <line x1="-18" y1="14" x2="20" y2="-16" stroke="#F59E0B" strokeWidth="3.5" strokeLinecap="round" />
            <polygon points="20,-16 23,-20 18,-18" fill="#FEF3C7" />
          </g>
        );
    }
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`select-none rounded-lg overflow-hidden shadow-lg ${className}`}
      aria-label={`Musa ${meta.nombre} ${meta.displayName}`}
    >
      <defs>
        <radialGradient id={`musa-bg-${meta.nombre}`} cx="50%" cy="45%" r="65%">
          <stop offset="0%" stopColor="#451A03" />
          <stop offset="70%" stopColor="#291205" />
          <stop offset="100%" stopColor="#180A03" />
        </radialGradient>
        <linearGradient id={`musa-frame-${meta.nombre}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FDE68A" />
          <stop offset="50%" stopColor="#D97706" />
          <stop offset="100%" stopColor="#92400E" />
        </linearGradient>
      </defs>

      {/* Background Marble Plate */}
      <rect width="200" height="200" fill={`url(#musa-bg-${meta.nombre})`} />

      {/* Classical Greek Diamond Border Frame */}
      <rect
        x="24"
        y="24"
        width="152"
        height="152"
        rx="8"
        stroke={`url(#musa-frame-${meta.nombre})`}
        strokeWidth="3"
        fill="none"
      />
      <rect
        x="30"
        y="30"
        width="140"
        height="140"
        rx="6"
        stroke="#78350F"
        strokeWidth="1"
        strokeDasharray="4 2"
        fill="none"
      />

      {/* Corner Notches */}
      <rect x="18" y="18" width="10" height="10" fill="#D97706" />
      <rect x="172" y="18" width="10" height="10" fill="#D97706" />
      <rect x="18" y="172" width="10" height="10" fill="#D97706" />
      <rect x="172" y="172" width="10" height="10" fill="#D97706" />

      {/* Central Muse Emblem */}
      {renderMuseSymbol()}

      {/* Muse Name Banner */}
      <text
        x="100"
        y="148"
        fill="#FEF3C7"
        fontSize="17"
        fontWeight="bold"
        fontFamily="serif"
        letterSpacing="2"
        textAnchor="middle"
      >
        {meta.nombre}
      </text>

      {/* Domain Subtitle */}
      <text
        x="100"
        y="162"
        fill="#FDE68A"
        fontSize="8.5"
        fontFamily="serif"
        letterSpacing="0.8"
        textAnchor="middle"
        opacity="0.9"
      >
        {meta.domain.toUpperCase()}
      </text>

      {/* Top Points Medals (Tier 1st, 2nd, 3rd) */}
      {showPoints && (
        <g transform="translate(100, 26)">
          {/* Medal 1 (1st place) */}
          <circle cx="-32" cy="0" r="10" fill="#D97706" stroke="#FEF3C7" strokeWidth="1.5" />
          <text x="-32" y="4" fill="#FEF3C7" fontSize="11" fontWeight="bold" textAnchor="middle">
            {meta.nivel1}
          </text>

          {/* Medal 2 (2nd place) */}
          <circle cx="0" cy="0" r="9" fill="#92400E" stroke="#FDE68A" strokeWidth="1.2" />
          <text x="0" y="3.5" fill="#FDE68A" fontSize="10" fontWeight="bold" textAnchor="middle">
            {meta.nivel2}
          </text>

          {/* Medal 3 (3rd place) */}
          <circle cx="30" cy="0" r="8" fill="#78350F" stroke="#FCD34D" strokeWidth="1" />
          <text x="30" y="3" fill="#FCD34D" fontSize="9" fontWeight="bold" textAnchor="middle">
            {meta.nivel3}
          </text>
        </g>
      )}
    </svg>
  );
};
