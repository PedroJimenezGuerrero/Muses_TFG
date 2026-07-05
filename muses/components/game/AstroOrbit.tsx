import React, { useState } from 'react';
import { AstroSvg } from '@/components/svg/AstroSvg';

export interface AstroOrbitProps {
  solPos: number;
  lunaPos: number;
  onPositionSelect?: (pos: number) => void;
  children?: React.ReactNode;
  className?: string;
}

export const AstroOrbit: React.FC<AstroOrbitProps> = ({
  solPos,
  lunaPos,
  onPositionSelect,
  children,
  className = '',
}) => {
  const [imgErrorSol, setImgErrorSol] = useState(false);
  const [imgErrorLuna, setImgErrorLuna] = useState(false);

  const normSol = ((solPos % 8) + 8) % 8;
  const normLuna = ((lunaPos % 8) + 8) % 8;

  const renderAstroMarker = (pos: number) => {
    const isSol = pos === normSol;
    const isLuna = pos === normLuna;

    if (isSol) {
      return (
        <div
          role="img"
          aria-label="Astro Solar"
          className="relative z-20 flex items-center justify-center animate-pulse drop-shadow-[0_0_15px_rgba(245,158,11,0.85)]"
        >
          {!imgErrorSol ? (
            <img
              src="/assets/astros/sol.png"
              alt=""
              aria-hidden="true"
              onError={() => setImgErrorSol(true)}
              className="w-12 h-12 sm:w-14 sm:h-14 object-contain"
            />
          ) : (
            <AstroSvg type="sun" size={54} />
          )}
        </div>
      );
    }

    if (isLuna) {
      return (
        <div
          role="img"
          aria-label="Astro Lunar"
          className="relative z-20 flex items-center justify-center animate-pulse drop-shadow-[0_0_15px_rgba(99,102,241,0.85)]"
        >
          {!imgErrorLuna ? (
            <img
              src="/assets/astros/luna.png"
              alt=""
              aria-hidden="true"
              onError={() => setImgErrorLuna(true)}
              className="w-12 h-12 sm:w-14 sm:h-14 object-contain"
            />
          ) : (
            <AstroSvg type="moon" size={54} />
          )}
        </div>
      );
    }

    return (
      <div className="w-4 h-4 rounded-full border border-amber-500/30 bg-amber-950/20 group-hover:scale-125 transition-transform duration-200" />
    );
  };

  const renderSlot = (pos: number, positionLabel: string) => {
    const isOccupied = pos === normSol || pos === normLuna;
    return (
      <button
        key={pos}
        type="button"
        data-testid={`astro-slot-${pos}`}
        aria-label={`Posición orbital ${pos}: ${positionLabel}`}
        onClick={() => onPositionSelect?.(pos)}
        className={`group relative flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-2xl transition-all duration-300 ${
          isOccupied
            ? 'scale-105'
            : 'border border-amber-500/20 bg-slate-950/60 hover:border-amber-400/50 hover:bg-slate-900/80'
        } ${onPositionSelect ? 'cursor-pointer hover:shadow-lg' : 'cursor-default'}`}
      >
        {renderAstroMarker(pos)}
      </button>
    );
  };

  return (
    <div
      data-testid="astro-orbit"
      className={`relative flex flex-col items-center justify-center p-3 sm:p-5 rounded-3xl bg-slate-950/80 border border-amber-900/30 backdrop-blur-md shadow-2xl ${className}`}
    >
      {/* Top Orbit Track: Slots 0, 1, 2 */}
      <div className="flex items-center justify-between w-full max-w-[620px] px-2 sm:px-6 mb-2 sm:mb-3">
        {renderSlot(0, 'Vértice Superior Izquierdo')}
        {renderSlot(1, 'Lado Superior')}
        {renderSlot(2, 'Vértice Superior Derecho')}
      </div>

      {/* Middle Row: Slot 7, Board/Children, Slot 3 */}
      <div className="flex items-center justify-between w-full max-w-[660px]">
        {/* Slot 7 (Left) */}
        <div className="flex items-center justify-center">
          {renderSlot(7, 'Lado Izquierdo')}
        </div>

        {/* Center: Children (Board grid) */}
        <div className="flex-1 flex items-center justify-center mx-2 sm:mx-4">
          {children}
        </div>

        {/* Slot 3 (Right) */}
        <div className="flex items-center justify-center">
          {renderSlot(3, 'Lado Derecho')}
        </div>
      </div>

      {/* Bottom Orbit Track: Slots 6, 5, 4 */}
      <div className="flex items-center justify-between w-full max-w-[620px] px-2 sm:px-6 mt-2 sm:mt-3">
        {renderSlot(6, 'Vértice Inferior Izquierdo')}
        {renderSlot(5, 'Lado Inferior')}
        {renderSlot(4, 'Vértice Inferior Derecho')}
      </div>
    </div>
  );
};

export default AstroOrbit;
