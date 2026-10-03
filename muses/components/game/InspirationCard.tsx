import React, { useState } from 'react';
import { observer } from 'mobx-react-lite';
import { CartaInspiracion, AnyCard, MUSAS_METADATA, INSPIRACIONES_METADATA, TipoMusa } from '@/types/game';
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

export const InspirationCard = observer<InspirationCardProps>(({
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
  const [showTooltip, setShowTooltip] = useState(false);

  const musaName = ((card as any).tipoMusa || (card as any).nombreMusa || 'TERPSICORE') as TipoMusa;
  const meta = MUSAS_METADATA[musaName] || MUSAS_METADATA.TERPSICORE;
  const inspMeta = INSPIRACIONES_METADATA[musaName];
  const orientacion = (card as any).orientacion ?? meta.tipoInspiracion;
  const isUsada = !!(card as any).usada;

  const validation = canPlayInspirationCard(orientacion, solPos, isUsada);
  const isRuleDisabled = !validation.canPlay;
  const effectiveDisabled = isDisabled || isRuleDisabled;

  const cardName = `Inspiración de ${meta.displayName}`;
  const priority = (card as any).prioridad ?? 1;

  // Compute target cells for miniature preview
  const targetCells = getInspirationTargetCells(musaName, solPos);

  const handleClick = (e: React.MouseEvent) => {
    if (effectiveDisabled) {
      e.preventDefault();
      return;
    }
    onClick?.();
  };

  const handleMouseEnter = () => {
    setShowTooltip(true);
    onMouseEnter?.();
  };

  const handleMouseLeave = () => {
    setShowTooltip(false);
    onMouseLeave?.();
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
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`group/card relative flex items-center justify-center w-24 h-40 sm:w-32 sm:h-52 rounded-2xl transition-all duration-300 select-none overflow-visible cursor-pointer shadow-2xl bg-gradient-to-b from-purple-950 via-slate-950 to-black border border-purple-500/50 text-purple-50 ${
        effectiveDisabled
          ? 'opacity-50 cursor-not-allowed contrast-90'
          : isSelected
          ? 'ring-4 ring-purple-400 shadow-[0_0_30px_rgba(192,132,252,0.8)] -translate-y-8 z-30'
          : 'hover:-translate-y-8 hover:z-30 hover:ring-2 hover:ring-purple-400/70'
      } ${className}`}
    >
      {/* Full Card Art */}
      <div className="w-full h-full relative rounded-2xl overflow-hidden">
        {!imgError ? (
          <img
            src={`/assets/cards/inspiracion_${musaName.toLowerCase()}.png`}
            alt={cardName}
            onError={() => setImgError(true)}
            className="w-full h-full object-cover object-center rounded-2xl"
          />
        ) : (
          <div data-vector-fallback="true" className="w-full h-full flex items-center justify-center p-2">
            <InspirationCardSvg musa={musaName} isUsada={isUsada} width="100%" height="100%" />
          </div>
        )}

        {isUsada && (
          <div className="absolute inset-0 bg-black/75 flex items-center justify-center backdrop-blur-[1px]">
            <span className="text-xs uppercase font-bold tracking-widest text-zinc-400 border border-zinc-600 px-2 py-1 rounded">
              Usada
            </span>
          </div>
        )}
        <span className="sr-only">{cardName}</span>
      </div>

      {/* Priority Badge */}
      <span
        data-testid={`card-priority-${card.id}`}
        className="absolute top-2 left-2 flex items-center justify-center w-6 h-6 rounded-full font-mono font-bold text-xs bg-purple-500 text-purple-950 border border-purple-300 shadow-lg z-10"
        title={`Prioridad ${priority}`}
      >
        {priority}
      </span>

      {/* Type Badge */}
      <span className="absolute top-2 right-2 text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-purple-900/80 text-purple-200 border border-purple-400/30 z-10">
        {orientacion}
      </span>

      {/* Miniature preview grid container */}
      <div
        data-testid="inspiration-mini-grid"
        className="absolute bottom-2 right-2 grid grid-cols-3 gap-0.5 p-1 bg-black/80 rounded border border-purple-500/30 z-10 opacity-75 group-hover/card:opacity-100 transition-opacity"
      >
        {Array.from({ length: 9 }).map((_, cellIdx) => {
          const isTarget = targetCells.includes(cellIdx);
          return (
            <div
              key={cellIdx}
              data-mini-cell={cellIdx}
              data-active={isTarget ? 'true' : 'false'}
              className={`w-1.5 h-1.5 rounded-[1px] transition-colors ${
                isTarget ? 'bg-purple-400 shadow-[0_0_4px_rgba(192,132,252,0.8)]' : 'bg-zinc-800'
              }`}
            />
          );
        })}
      </div>

      {/* Floating Info Tooltip */}
      {showTooltip && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 w-52 p-3 rounded-2xl bg-zinc-950/95 border border-purple-500/40 shadow-2xl backdrop-blur-md z-50 text-left pointer-events-none animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-1.5 mb-1.5">
            <span className="font-serif font-bold text-xs sm:text-sm text-purple-200">
              {cardName}
            </span>
            <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 font-mono font-bold">
              Única
            </span>
          </div>
          <div className="space-y-1.5 text-[11px] leading-snug">
            <p className="text-zinc-200 font-medium">
              {inspMeta?.descripcion || 'Coloca fichas de devoción según el patrón geométrico del Sol.'}
            </p>
            {isUsada ? (
              <p className="text-zinc-500 italic">Ya has utilizado esta carta en una ronda anterior.</p>
            ) : isRuleDisabled ? (
              <p className="text-amber-400/90 text-[10px] font-semibold">
                ⚠️ {inspMeta?.requiere || `Requiere Sol en ${orientacion}.`}
              </p>
            ) : (
              <p className="text-emerald-400 text-[10px] font-semibold flex items-center gap-1">
                ✓ Orientación solar compatible (Lista para jugar)
              </p>
            )}
          </div>
        </div>
      )}
    </button>
  );
});

export default InspirationCard;
