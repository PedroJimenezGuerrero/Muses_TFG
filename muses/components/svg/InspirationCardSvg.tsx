import React from 'react';
import { TipoMusa, MUSAS_METADATA } from '@/types/game';

export interface InspirationCardSvgProps {
  musa: TipoMusa | string;
  width?: number | string;
  height?: number | string;
  className?: string;
  isUsada?: boolean;
}

/**
 * Returns static sample target grid cells (0-8) to display on the 3x3 card preview
 * representing the characteristic geometry of that muse's inspiration power.
 */
function getPreviewTargetCells(musa: TipoMusa): number[] {
  switch (musa) {
    case 'CALIOPE':
      return [1, 7]; // Dual placement cells as illustrated in rulebook card
    case 'CLIO':
      return [5]; // Single side placement
    case 'ERATO':
      return [6]; // Corner placement
    case 'EUTERPE':
      return [8]; // Corner placement
    case 'MELPOMENE':
      return [3]; // Opposite side placement
    case 'POLIMNIA':
      return [2]; // Corner placement
    case 'TALIA':
      return [0]; // Corner placement
    case 'TERPSICORE':
      return [5]; // Side placement
    case 'URANIA':
      return [3]; // Side placement
    default:
      return [4];
  }
}

export const InspirationCardSvg: React.FC<InspirationCardSvgProps> = ({
  musa,
  width = 180,
  height = 245,
  className = '',
  isUsada = false,
}) => {
  const normKey = (musa.toUpperCase().replace('Í', 'I').replace('Ó', 'O') as TipoMusa);
  const meta = MUSAS_METADATA[normKey] || MUSAS_METADATA.CLIO;
  const isVertices = meta.tipoInspiracion === 'VERTICES';
  const previewCells = getPreviewTargetCells(meta.nombre);

  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 240 330"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`select-none rounded-xl overflow-hidden shadow-xl ${isUsada ? 'opacity-50 grayscale' : ''} ${className}`}
      aria-label={`Inspiración de ${meta.displayName}`}
    >
      <defs>
        <radialGradient id={`insp-bg-${meta.nombre}`} cx="50%" cy="35%" r="75%">
          <stop offset="0%" stopColor="#4A044E" />
          <stop offset="60%" stopColor="#2E1065" />
          <stop offset="100%" stopColor="#09090B" />
        </radialGradient>
        <linearGradient id={`insp-frame-${meta.nombre}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FDE047" />
          <stop offset="45%" stopColor="#C084FC" />
          <stop offset="100%" stopColor="#581C87" />
        </linearGradient>
      </defs>

      {/* Card Base Background */}
      <rect width="240" height="330" rx="12" fill={`url(#insp-bg-${meta.nombre})`} />

      {/* Ornamental Frame */}
      <rect
        x="12"
        y="12"
        width="216"
        height="306"
        rx="8"
        stroke={`url(#insp-frame-${meta.nombre})`}
        strokeWidth="3"
        fill="none"
      />
      <rect
        x="18"
        y="18"
        width="204"
        height="294"
        rx="6"
        stroke="#A855F7"
        strokeWidth="1"
        strokeDasharray="4 2"
        fill="none"
        opacity="0.5"
      />

      {/* Priority Badge (Priority 1) Top-Left */}
      <g transform="translate(34, 34)">
        <circle cx="0" cy="0" r="14" fill="#581C87" stroke="#FDE047" strokeWidth="2" />
        <text
          x="0"
          y="5"
          fill="#FDE047"
          fontSize="14"
          fontWeight="bold"
          fontFamily="sans-serif"
          textAnchor="middle"
        >
          1
        </text>
      </g>

      {/* Orientation Requirement Badge Top-Right */}
      <g transform="translate(180, 24)">
        <rect
          x="0"
          y="0"
          width="42"
          height="20"
          rx="4"
          fill={isVertices ? '#3B82F6' : '#EAB308'}
          opacity="0.9"
        />
        <text
          x="21"
          y="14"
          fill="#FFFFFF"
          fontSize="9"
          fontWeight="bold"
          fontFamily="sans-serif"
          textAnchor="middle"
        >
          {isVertices ? 'VÉRTICES' : 'LADOS'}
        </text>
      </g>

      {/* Card Header */}
      <text
        x="120"
        y="68"
        fill="#F3E8FF"
        fontSize="12"
        fontWeight="bold"
        fontFamily="serif"
        letterSpacing="2"
        textAnchor="middle"
      >
        INSPIRACIÓN DE
      </text>
      <text
        x="120"
        y="88"
        fill="#FDE047"
        fontSize="16"
        fontWeight="bold"
        fontFamily="serif"
        letterSpacing="1.5"
        textAnchor="middle"
      >
        {meta.nombre}
      </text>

      {/* Embedded 3x3 Mini Grid Container */}
      <g transform="translate(70, 105)">
        {/* Background plate */}
        <rect x="-6" y="-6" width="112" height="112" rx="8" fill="#18181B" stroke="#7C3AED" strokeWidth="1.5" />

        {/* 9 Grid Cells */}
        {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((cellIdx) => {
          const row = Math.floor(cellIdx / 3);
          const col = cellIdx % 3;
          const x = col * 34;
          const y = row * 34;
          const isTarget = previewCells.includes(cellIdx);
          const isCenter = cellIdx === 4;

          return (
            <g key={cellIdx} transform={`translate(${x}, ${y})`}>
              <rect
                x="2"
                y="2"
                width="28"
                height="28"
                rx="4"
                fill={isTarget ? '#9333EA' : isCenter ? '#27272A' : '#1F2937'}
                stroke={isTarget ? '#FDE047' : '#4B5563'}
                strokeWidth={isTarget ? 2 : 1}
              />
              {isTarget && (
                // Flame icon on target cells
                <path
                  d="M16 8 C18 13 21 16 21 19 C21 23 18 25 16 25 C14 25 11 23 11 19 C11 16 14 13 16 8 Z"
                  fill="#FDE047"
                />
              )}
            </g>
          );
        })}
      </g>

      {/* Description / Rules */}
      <text
        x="120"
        y="245"
        fill="#E9D5FF"
        fontSize="11"
        fontWeight="bold"
        fontFamily="sans-serif"
        textAnchor="middle"
      >
        {meta.nombre === 'CALIOPE' ? 'Coloca 1 ficha en 2 musas' : 'Coloca 2 fichas de devoción'}
      </text>
      <text
        x="120"
        y="262"
        fill="#C084FC"
        fontSize="9.5"
        fontFamily="sans-serif"
        textAnchor="middle"
      >
        según la posición del Sol
      </text>

      {/* Single-use badge footer */}
      <rect x="50" y="280" width="140" height="22" rx="11" fill="#3B0764" stroke="#9333EA" strokeWidth="1" />
      <text
        x="120"
        y="295"
        fill="#F5D0FE"
        fontSize="10"
        fontWeight="bold"
        fontFamily="sans-serif"
        letterSpacing="0.8"
        textAnchor="middle"
      >
        1 SOLO USO POR PARTIDA
      </text>

      {/* Usada Overlay Banner */}
      {isUsada && (
        <g transform="translate(120, 165) rotate(-25)">
          <rect x="-85" y="-18" width="170" height="36" rx="6" fill="#DC2626" stroke="#FEF2F2" strokeWidth="2" />
          <text
            x="0"
            y="7"
            fill="#FFFFFF"
            fontSize="18"
            fontWeight="bold"
            fontFamily="sans-serif"
            letterSpacing="3"
            textAnchor="middle"
          >
            YA USADA
          </text>
        </g>
      )}
    </svg>
  );
};
