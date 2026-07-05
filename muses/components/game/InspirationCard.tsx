import React, { useState } from 'react';
import { CartaInspiracion, AnyCard, MUSAS_METADATA, TipoMusa } from '@/types/game';
import { canPlayInspirationCard, getInspirationTargetCells } from '@/lib/gameRules';
import { InspirationCardSvg } from '@/components/svg/InspirationCardSvg';

export interface InspirationCardProps {
  card: CartaInspiracion | AnyCard;
  solPos: number;
  isSelected?: boolean;
  isDisabled?: boolean;
  onClick?: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  className?: string;
}

export const InspirationCard: React.FC<InspirationCardProps> = ({
  card,
  solPos,
  isSelected = false,
  isDisabled = false,
  onClick,
  onMouseEnter,
  onMouseLeave,
  className = '',
}) => {
  const [imgError, setImgError] = useState(false);

  const musaName = ((card as any).tipoMusa || (card as any).nombreMusa || 'TERPSICORE') as TipoMusa;
  const meta = MUSAS_METADATA[musaName] || MUSAS_METADATA.TERPSICORE;
  const orientacion = (card as any).orientacion ?? meta.tipoInspiracion;
  const isUsada = !!(card as any).usada;

  const validation = canPlayInspirationCard(orientacion, solPos, isUsada);
  const isRuleDisabled = !validation.canPlay;
  const effectiveDisabled = isDisabled || isRuleDisabled;

  const cardName = `Inspiración de ${meta.displayName}`;
  const priority = (card as any).prioridad ?? 1;

  // Compute miniature preview cells
  const targetCells = getInspirationTargetCells(musaName, solPos);

  const handleClick = (e: React.MouseEvent) => {
    if (effectiveDisabled) {
      e.preventDefault();
      return;
    }
    onClick?.();
  };

  return (
    <button
      type="button"
      role="button"
      data-testid={`action-card-${card.id}`}
      aria-label={cardName}
      aria-selected={isSelected ? 'true' : 'false'}
      aria-disabled={effectiveDisabled ? 'true' : undefined}
      disabled={isUsada || isDisabled}
      onClick={handleClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={`group relative flex flex-col justify-between w-28 h-44 sm:w-36 sm:h-56 p-2 rounded-2xl transition-all duration-300 select-none text-left bg-gradient-to-b from-purple-950/90 via-slate-950 to-black border border-purple-500/50 text-purple-50 shadow-lg ${
        effectiveDisabled
          ? 'opacity-40 cursor-not-allowed grayscale'
          : isSelected
          ? 'scale-105 ring-4 ring-purple-400 shadow-[0_0_25px_rgba(192,132,252,0.7)] cursor-pointer'
          : 'hover:scale-105 hover:ring-2 hover:ring-purple-400/50 cursor-pointer'
      } ${className}`}
    >
      {/* Priority Badge & Orientation Type */}
      <div className="flex items-center justify-between w-full">
        <span
          data-testid={`card-priority-${card.id}`}
          className="flex items-center justify-center w-6 h-6 rounded-full font-mono font-bold text-xs bg-purple-500 text-purple-950 border border-purple-300 shadow-md"
          title={`Prioridad ${priority}`}
        >
          {priority}
        </span>
        <span className="text-[10px] uppercase font-bold tracking-wider text-purple-300">
          {orientacion}
        </span>
      </div>

      {/* Center Graphic & Embedded Mini-Grid */}
      <div className="relative flex-1 flex flex-col items-center justify-center my-1.5 overflow-hidden rounded-xl bg-black/40 border border-purple-500/20">
        {!imgError ? (
          <img
            src={`/assets/cards/inspiracion_${musaName.toLowerCase()}.png`}
            alt={cardName}
            onError={() => setImgError(true)}
            className="w-full h-full object-cover object-center rounded-xl transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div data-vector-fallback="true" className="w-full h-full flex items-center justify-center p-1">
            <InspirationCardSvg musa={musaName} isUsada={isUsada} width="100%" height="100%" />
          </div>
        )}

        {/* Embedded 3x3 Miniature Target Grid */}
        <div
          data-testid="inspiration-mini-grid"
          className="absolute bottom-1 right-1 grid grid-cols-3 gap-0.5 w-10 h-10 p-0.5 rounded bg-black/80 border border-purple-400/40 backdrop-blur-sm z-10"
          title="Patrón de activación"
        >
          {Array.from({ length: 9 }, (_, i) => {
            const isTarget = targetCells.includes(i);
            const isCenter = i === 4;
            return (
              <div
                key={i}
                data-mini-cell={i}
                className={`w-full h-full rounded-[1px] transition-colors ${
                  isTarget
                    ? 'bg-amber-400 shadow-[0_0_4px_rgba(251,191,36,0.9)]'
                    : isCenter
                    ? 'bg-zinc-700'
                    : 'bg-zinc-900'
                }`}
              />
            );
          })}
        </div>

        {/* Usada Overlay Banner */}
        {isUsada && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/70 backdrop-blur-[2px] z-20">
            <span className="px-2.5 py-1 rounded bg-red-600 text-white font-bold text-xs uppercase tracking-wider -rotate-12 border border-white shadow-lg">
              Usada
            </span>
          </div>
        )}
      </div>

      {/* Card Footer: Name & Status */}
      <div className="pt-1 border-t border-purple-500/20 text-center">
        <span className="font-serif font-bold text-xs sm:text-sm tracking-wide block truncate text-purple-200 drop-shadow-sm">
          {cardName}
        </span>
      </div>
    </button>
  );
};

export default InspirationCard;
