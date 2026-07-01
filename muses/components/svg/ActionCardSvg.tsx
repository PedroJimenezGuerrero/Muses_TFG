import React from 'react';
import { TipoAccion, ACCIONES_METADATA } from '@/types/game';

export interface ActionCardSvgProps {
  action: TipoAccion | 'DEVOCION_SOL' | 'DEVOCION_LUNA' | 'REVOLUCION_SOL' | 'REVOLUCION_LUNA';
  width?: number | string;
  height?: number | string;
  className?: string;
}

export const ActionCardSvg: React.FC<ActionCardSvgProps> = ({
  action,
  width = 180,
  height = 245,
  className = '',
}) => {
  const meta = ACCIONES_METADATA[action as TipoAccion] || ACCIONES_METADATA.DEVOCION_SOL;
  const isSolar = action === 'DEVOCION_SOL' || action === 'REVOLUCION_SOL';
  const isDevocion = action === 'DEVOCION_SOL' || action === 'DEVOCION_LUNA';

  // Palette settings
  const primaryColor = isSolar ? '#F59E0B' : '#6366F1';
  const secondaryColor = isSolar ? '#B45309' : '#312E81';
  const accentColor = isSolar ? '#FEF08A' : '#C7D2FE';
  const bgGradientId = `action-bg-${action}`;

  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 240 330"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`select-none rounded-xl overflow-hidden shadow-xl ${className}`}
      aria-label={meta.nombre}
    >
      <defs>
        <radialGradient id={bgGradientId} cx="50%" cy="40%" r="70%">
          <stop offset="0%" stopColor={isSolar ? '#451A03' : '#1E1B4B'} />
          <stop offset="70%" stopColor={isSolar ? '#291205' : '#0F172A'} />
          <stop offset="100%" stopColor="#09090B" />
        </radialGradient>
        <linearGradient id={`action-frame-${action}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={accentColor} />
          <stop offset="50%" stopColor={primaryColor} />
          <stop offset="100%" stopColor={secondaryColor} />
        </linearGradient>
      </defs>

      {/* Card Background Base */}
      <rect width="240" height="330" rx="12" fill={`url(#${bgGradientId})`} />

      {/* Ornamental Card Border */}
      <rect
        x="12"
        y="12"
        width="216"
        height="306"
        rx="8"
        stroke={`url(#action-frame-${action})`}
        strokeWidth="3"
        fill="none"
      />
      <rect
        x="18"
        y="18"
        width="204"
        height="294"
        rx="6"
        stroke={primaryColor}
        strokeWidth="1"
        strokeDasharray="4 2"
        fill="none"
        opacity="0.6"
      />

      {/* Priority Badge (Top-Left) */}
      <g transform="translate(34, 34)">
        <circle cx="0" cy="0" r="14" fill={secondaryColor} stroke={accentColor} strokeWidth="2" />
        <text
          x="0"
          y="5"
          fill={accentColor}
          fontSize="14"
          fontWeight="bold"
          fontFamily="sans-serif"
          textAnchor="middle"
        >
          {meta.prioridad}
        </text>
      </g>

      {/* Astro Symbol Badge (Top-Right) */}
      <g transform="translate(206, 34)">
        <circle cx="0" cy="0" r="14" fill={secondaryColor} stroke={accentColor} strokeWidth="2" />
        {isSolar ? (
          // Mini Sun
          <circle cx="0" cy="0" r="6" fill="#FDE047" />
        ) : (
          // Mini Crescent
          <path d="M-3 -6 C2 -6 6 -2 6 3 C6 8 2 12 -3 12 C1 9 3 6 3 3 C3 0 1 -3 -3 -6 Z" fill="#E0E7FF" />
        )}
      </g>

      {/* Center Artwork Box */}
      <rect
        x="36"
        y="60"
        width="168"
        height="145"
        rx="8"
        fill={isSolar ? '#78350F' : '#312E81'}
        opacity="0.3"
        stroke={primaryColor}
        strokeWidth="1.5"
      />

      {isDevocion ? (
        // Devotion Artwork: Central Celestial Sun/Moon with 2 Falling Flame Tokens
        <g transform="translate(120, 130)">
          {isSolar ? (
            // Solar Medallion
            <circle cx="0" cy="-14" r="28" fill="#F59E0B" stroke="#FEF08A" strokeWidth="2" />
          ) : (
            // Lunar Medallion
            <circle cx="0" cy="-14" r="28" fill="#4338CA" stroke="#C7D2FE" strokeWidth="2" />
          )}

          {/* 2 Tokens Bestowed Indicator */}
          <g transform="translate(-24, 26)">
            <circle cx="0" cy="0" r="13" fill="#D97706" stroke="#FEF3C7" strokeWidth="2" />
            <path d="M0 -6 C2 -2 5 0 5 4 C5 7 2 9 0 9 C-2 9 -5 7 -5 4 C-5 0 -2 -2 0 -6 Z" fill="#FEF3C7" />
          </g>
          <g transform="translate(24, 26)">
            <circle cx="0" cy="0" r="13" fill="#D97706" stroke="#FEF3C7" strokeWidth="2" />
            <path d="M0 -6 C2 -2 5 0 5 4 C5 7 2 9 0 9 C-2 9 -5 7 -5 4 C-5 0 -2 -2 0 -6 Z" fill="#FEF3C7" />
          </g>
          <text x="0" y="31" fill="#FEF08A" fontSize="16" fontWeight="bold" textAnchor="middle">
            +2
          </text>
        </g>
      ) : (
        // Revolution Artwork: 6-cell Orbit arrows with +1 center token
        <g transform="translate(120, 130)">
          {/* Orbital Circular Track */}
          <circle cx="0" cy="-2" r="42" stroke={primaryColor} strokeWidth="2" strokeDasharray="6 4" fill="none" />
          {/* 3 Arrow heads showing clockwise direction */}
          <polygon points="42,-2 36,-10 46,-8" fill={accentColor} />
          <polygon points="-42,-2 -36,6 -46,4" fill={accentColor} />
          <polygon points="0,40 -8,34 -6,44" fill={accentColor} />

          {/* Center Space Token (+1) */}
          <circle cx="0" cy="-2" r="18" fill={secondaryColor} stroke={accentColor} strokeWidth="2" />
          <text x="0" y="4" fill={accentColor} fontSize="14" fontWeight="bold" textAnchor="middle">
            +1
          </text>
        </g>
      )}

      {/* Action Title */}
      <text
        x="120"
        y="235"
        fill="#FFFFFF"
        fontSize="16"
        fontWeight="bold"
        fontFamily="serif"
        letterSpacing="1.2"
        textAnchor="middle"
      >
        {isDevocion ? 'DEVOCIÓN' : 'REVOLUCIÓN'}
      </text>

      {/* Subtitle */}
      <text
        x="120"
        y="254"
        fill={accentColor}
        fontSize="12"
        fontWeight="bold"
        fontFamily="sans-serif"
        letterSpacing="2"
        textAnchor="middle"
      >
        {isSolar ? 'SOLAR' : 'LUNAR'}
      </text>

      {/* Action Effect Summary */}
      <text
        x="120"
        y="282"
        fill="#E4E4E7"
        fontSize="10"
        fontFamily="sans-serif"
        textAnchor="middle"
      >
        {isDevocion ? 'Coloca 2 fichas de devoción' : 'Rota 6 musas alrededor del astro'}
      </text>
      <text
        x="120"
        y="298"
        fill="#A1A1AA"
        fontSize="9.5"
        fontFamily="sans-serif"
        textAnchor="middle"
      >
        {isDevocion ? 'en la musa iluminada' : 'y coloca 1 ficha en el centro'}
      </text>
    </svg>
  );
};
