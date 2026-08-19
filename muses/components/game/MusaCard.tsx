import React, { useState } from 'react';
import { observer } from 'mobx-react-lite';
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

export const MusaCard = observer<MusaCardProps>(({
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
  const [showTooltip, setShowTooltip] = useState(false);

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
    highlightStyles = 'ring-4 ring-amber-400 shadow-[0_0_30px_rgba(245,158,11,0.85)] z-20 scale-105';
  } else if (activeHighlight === 'moon') {
    highlightStyles = 'ring-4 ring-indigo-400 shadow-[0_0_30px_rgba(99,102,241,0.85)] z-20 scale-105';
  } else if (activeHighlight === 'inspiration') {
    highlightStyles = 'ring-4 ring-purple-500 shadow-[0_0_35px_rgba(168,85,247,0.95)] z-20 scale-105';
  } else if (isRevolutionMember === true) {
    highlightStyles = 'ring-3 ring-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.75)] z-10';
  } else if (isRevolutionMember === false) {
    highlightStyles = 'opacity-35 grayscale';
  }

  return (
    <div
      role="gridcell"
      data-testid={`musa-card-${index}`}
      data-center-muse={isCenter ? 'true' : undefined}
      data-highlight={activeHighlight}
      data-revolution-member={isRevolutionMember !== undefined ? (isRevolutionMember ? 'true' : 'false') : undefined}
      onClick={onClick}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      className={`group relative flex items-center justify-center w-28 h-40 sm:w-36 sm:h-52 rounded-2xl bg-zinc-950 border border-amber-900/40 text-amber-50 shadow-xl select-none transition-all duration-300 hover:scale-105 hover:z-30 cursor-pointer overflow-visible ${highlightStyles} ${className}`}
    >
      {/* Center Muse indicator badge */}
      {isCenter && (
        <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-600 to-amber-500 text-[10px] font-bold tracking-wider text-black uppercase shadow-lg border border-amber-300/40 z-30">
          Centro
        </span>
      )}

      {/* Full-bleed Illustration */}
      <div className="relative w-full h-full rounded-2xl overflow-hidden bg-black/60">
        {!imgError ? (
          <img
            src={`/assets/musas/${musa.nombre.toLowerCase()}.png`}
            alt={musa.nombre}
            onError={() => setImgError(true)}
            className="w-full h-full object-cover object-center rounded-2xl transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div data-vector-fallback="true" className="w-full h-full flex items-center justify-center p-2">
            <MusaSvg musa={musa.nombre} size={90} showPoints={false} />
          </div>
        )}

        {/* Placed Devotion Tokens overlay */}
        {placedTokens.length > 0 && (
          <div className="absolute inset-x-0 bottom-0 p-1.5 flex flex-wrap items-center justify-center gap-1 bg-gradient-to-t from-black/90 via-black/50 to-transparent rounded-b-2xl z-20">
            {placedTokens.map((token: any, tIdx: number) => {
              const pId = token.jugador?.id ?? token.jugadorId ?? token.jugador?.numeroJugador ?? token.numeroJugador ?? 1;
              const pNum = token.jugador?.numeroJugador ?? token.numeroJugador ?? pId ?? 1;
              return (
                <DevotionToken
                  key={token.id ?? `token-${tIdx}`}
                  id={token.id}
                  playerId={pId}
                  playerNumber={pNum}
                  size={24}
                />
              );
            })}
          </div>
        )}

        {/* Screen Reader & DOM Accessible Text Summary */}
        <span className="sr-only">
          {musa.nombre} {meta.domain} 1º: {nivel1} 2º: {nivel2} 3º: {nivel3}
        </span>
      </div>

      {/* Floating Info Tooltip on Hover */}
      {showTooltip && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-48 p-3 rounded-2xl bg-zinc-950/95 border border-amber-500/40 shadow-2xl backdrop-blur-md z-50 text-left pointer-events-none animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between border-b border-amber-500/20 pb-1.5 mb-1.5">
            <div>
              <span className="font-serif font-bold text-sm text-amber-200 block leading-tight">
                {musa.nombre}
              </span>
              <span className="text-[10px] text-amber-400/80 font-sans tracking-tight">
                {meta.domain}
              </span>
            </div>
            <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono font-bold">
              {meta.tipoInspiracion}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-1 text-center bg-black/40 rounded-xl p-1.5 border border-white/5">
            <div className="flex flex-col">
              <span className="text-[9px] text-zinc-400 uppercase font-semibold">1º</span>
              <span className="text-xs font-bold text-amber-400 font-mono">{nivel1} pts</span>
            </div>
            <div className="flex flex-col border-x border-zinc-800">
              <span className="text-[9px] text-zinc-400 uppercase font-semibold">2º</span>
              <span className="text-xs font-bold text-zinc-200 font-mono">{nivel2} pts</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[9px] text-zinc-400 uppercase font-semibold">3º</span>
              <span className="text-xs font-bold text-amber-600/80 font-mono">{nivel3} pts</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

export default MusaCard;
