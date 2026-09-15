import React, { useState } from 'react';
import { observer } from 'mobx-react-lite';
import { CartaAccion, AnyCard, TipoAccion, ACCIONES_METADATA } from '@/types/game';
import { ActionCardSvg } from '@/components/svg/ActionCardSvg';

export interface ActionCardProps {
  card: CartaAccion | AnyCard;
  isSelected?: boolean;
  isDisabled?: boolean;
  onClick?: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  className?: string;
}

export const ActionCard = observer<ActionCardProps>(({
  card,
  isSelected = false,
  isDisabled = false,
  onClick,
  onMouseEnter,
  onMouseLeave,
  className = '',
}) => {
  const [imgError, setImgError] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  const actionType = ((card as any).tipo || (card as any).tipoCarta) as TipoAccion;
  const meta = ACCIONES_METADATA[actionType] || {
    nombre: card.nombre || 'Acción',
    prioridad: (card as any).prioridad || 2,
    descripcion: '',
  };

  const priority = (card as any).prioridad ?? meta.prioridad ?? 2;
  const isSolar = actionType === 'DEVOCION_SOL' || actionType === 'REVOLUCION_SOL';

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
      aria-label={meta.nombre}
      aria-selected={isSelected ? 'true' : 'false'}
      aria-disabled={isDisabled ? 'true' : undefined}
      disabled={isDisabled}
      onClick={isDisabled ? undefined : onClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`group/card relative flex items-center justify-center w-24 h-40 sm:w-32 sm:h-52 rounded-2xl transition-all duration-300 select-none overflow-visible cursor-pointer shadow-2xl ${
        isDisabled
          ? 'opacity-40 cursor-not-allowed grayscale'
          : isSelected
          ? 'ring-4 ring-amber-400 shadow-[0_0_30px_rgba(251,191,36,0.8)] -translate-y-8 z-30'
          : 'hover:-translate-y-8 hover:z-30 hover:ring-2 hover:ring-amber-400/70'
      } ${
        isSolar
          ? 'bg-gradient-to-b from-amber-950 via-slate-950 to-black border border-amber-500/50 text-amber-50'
          : 'bg-gradient-to-b from-indigo-950 via-slate-950 to-black border border-indigo-500/50 text-indigo-50'
      } ${className}`}
    >
      {/* Full Card Art */}
      <div className="w-full h-full relative rounded-2xl overflow-hidden">
        {!imgError ? (
          <img
            src={`/assets/cards/${actionType.toLowerCase()}.png`}
            alt={meta.nombre}
            onError={() => setImgError(true)}
            className="w-full h-full object-cover object-center rounded-2xl"
          />
        ) : (
          <div data-vector-fallback="true" className="w-full h-full flex items-center justify-center p-2">
            <ActionCardSvg action={actionType} width="100%" height="100%" />
          </div>
        )}
        <span className="sr-only">{meta.nombre}</span>
      </div>

      {/* Priority Badge in Corner */}
      <span
        data-testid={`card-priority-${card.id}`}
        className={`absolute top-2 left-2 flex items-center justify-center w-6 h-6 rounded-full font-mono font-bold text-xs shadow-lg border z-10 ${
          isSolar
            ? 'bg-amber-500 text-amber-950 border-amber-300'
            : 'bg-indigo-500 text-indigo-950 border-indigo-300'
        }`}
        title={`Prioridad ${priority}`}
      >
        {priority}
      </span>

      {/* Floating Info Tooltip */}
      {showTooltip && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 w-52 p-3 rounded-2xl bg-zinc-950/95 border border-amber-500/40 shadow-2xl backdrop-blur-md z-50 text-left pointer-events-none animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-1.5 mb-1.5">
            <span className="font-serif font-bold text-xs sm:text-sm text-amber-200">
              {meta.nombre}
            </span>
            <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono font-bold">
              Prio {priority}
            </span>
          </div>
          <p className="text-[11px] text-zinc-300 leading-snug">
            {meta.descripcion || (isSolar ? 'Afecta al ciclo del Sol.' : 'Afecta al ciclo de la Luna.')}
          </p>
        </div>
      )}
    </button>
  );
});

export default ActionCard;
