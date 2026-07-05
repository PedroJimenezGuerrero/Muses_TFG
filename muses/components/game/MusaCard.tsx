import React, { useState } from 'react';
import { Musa, MUSAS_METADATA, TipoMusa } from '@/types/game';
import { MusaSvg } from '@/components/svg/MusaSvg';
import { DevotionToken } from './DevotionToken';

export interface MusaCardProps {
  musa: Musa;
  index: number;
  isHighlighted?: boolean;
  highlightType?: 'sun' | 'moon' | 'inspiration' | 'revolution';
  isRevolutionMember?: boolean;
  tokens?: Musa['tokensColocados'];
  className?: string;
  onClick?: () => void;
}

export const MusaCard: React.FC<MusaCardProps> = ({
  musa,
  index,
  isHighlighted,
  highlightType,
  isRevolutionMember,
  tokens,
  className = '',
  onClick,
}) => {
  const [imgError, setImgError] = useState(false);

  const meta = MUSAS_METADATA[musa.nombre] || MUSAS_METADATA.CLIO;
  const isCenter = index === 4;

  const nivel1 = (musa as any).nivel1 ?? meta.nivel1;
  const nivel2 = (musa as any).nivel2 ?? meta.nivel2;
  const nivel3 = (musa as any).nivel3 ?? meta.nivel3;

  const placedTokens = tokens ?? musa.tokensColocados ?? [];

  // Determine highlight attribute
  const activeHighlight = highlightType || (isHighlighted ? 'sun' : undefined);

  // Compute highlight styling
  let highlightStyles = '';
  if (activeHighlight === 'sun') {
    highlightStyles = 'ring-2 ring-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.75)] animate-pulse';
  } else if (activeHighlight === 'moon') {
    highlightStyles = 'ring-2 ring-indigo-400 shadow-[0_0_20px_rgba(99,102,241,0.75)] animate-pulse';
  } else if (activeHighlight === 'inspiration') {
    highlightStyles = 'ring-2 ring-purple-500 shadow-[0_0_25px_rgba(168,85,247,0.85)] animate-pulse';
  } else if (isRevolutionMember === true) {
    highlightStyles = 'ring-2 ring-emerald-400 shadow-[0_0_16px_rgba(16,185,129,0.7)] animate-pulse';
  } else if (isRevolutionMember === false) {
    highlightStyles = 'opacity-40 grayscale';
  }

  return (
    <div
      role="gridcell"
      data-testid={`musa-card-${index}`}
      data-center-muse={isCenter ? 'true' : undefined}
      data-highlight={activeHighlight}
      data-revolution-member={isRevolutionMember !== undefined ? (isRevolutionMember ? 'true' : 'false') : undefined}
      onClick={onClick}
      className={`relative flex flex-col justify-between w-28 h-40 sm:w-36 sm:h-52 p-2 sm:p-2.5 rounded-2xl bg-gradient-to-b from-slate-900 to-zinc-950 border border-amber-900/40 text-amber-50 shadow-lg select-none transition-all duration-300 hover:scale-[1.02] ${highlightStyles} ${className}`}
    >
      {/* Center Muse indicator ribbon */}
      {isCenter && (
        <span className="absolute -top-2 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-amber-600/90 text-[9px] font-bold tracking-wider text-amber-100 uppercase shadow-md border border-amber-400/30 z-10">
          Centro
        </span>
      )}

      {/* Header: Musa Name */}
      <div className="flex flex-col items-center justify-center pt-0.5">
        <span className="text-xs sm:text-sm font-serif font-bold tracking-wide text-amber-200 uppercase drop-shadow-sm">
          {musa.nombre}
        </span>
        <span className="text-[9px] text-amber-400/70 font-sans tracking-tight line-clamp-1">
          {meta.domain}
        </span>
      </div>

      {/* Illustration Area */}
      <div className="relative flex-1 flex items-center justify-center my-1 overflow-hidden rounded-xl bg-black/40 border border-amber-950/50">
        {!imgError ? (
          <img
            src={`/assets/musas/${musa.nombre.toLowerCase()}.png`}
            alt={musa.nombre}
            onError={() => setImgError(true)}
            className="w-full h-full object-cover object-center rounded-xl transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div data-vector-fallback="true" className="w-full h-full flex items-center justify-center p-1">
            <MusaSvg musa={musa.nombre} size={70} showPoints={false} />
          </div>
        )}

        {/* Placed Devotion Tokens overlay */}
        {placedTokens.length > 0 && (
          <div className="absolute inset-0 p-1 flex flex-wrap items-center justify-center gap-1 bg-black/40 backdrop-blur-[2px] rounded-xl z-20 overflow-y-auto">
            {placedTokens.map((token, idx) => {
              const pId = (token as any).jugadorId ?? token.jugador?.numeroJugador ?? token.jugador?.id ?? 1;
              return (
                <DevotionToken
                  key={token.id ?? idx}
                  id={token.id}
                  playerId={pId}
                  size={20}
                  className="shadow-md"
                />
              );
            })}
          </div>
        )}
      </div>

      {/* Footer: Level 1, 2, 3 Points Badges */}
      <div className="flex items-center justify-between gap-1 pt-1 border-t border-amber-900/30 text-[10px] sm:text-xs font-semibold">
        <div className="flex-1 flex flex-col items-center px-1 py-0.5 rounded bg-amber-500/20 border border-amber-500/30 text-amber-300" title="1º Puesto">
          <span className="text-[8px] text-amber-400/80">1º</span>
          <span>{nivel1}</span>
        </div>
        <div className="flex-1 flex flex-col items-center px-1 py-0.5 rounded bg-slate-800/60 border border-slate-700/50 text-slate-300" title="2º Puesto">
          <span className="text-[8px] text-slate-400/80">2º</span>
          <span>{nivel2}</span>
        </div>
        <div className="flex-1 flex flex-col items-center px-1 py-0.5 rounded bg-orange-950/40 border border-orange-800/40 text-orange-300" title="3º Puesto">
          <span className="text-[8px] text-orange-400/80">3º</span>
          <span>{nivel3}</span>
        </div>
      </div>
    </div>
  );
};

export default MusaCard;
