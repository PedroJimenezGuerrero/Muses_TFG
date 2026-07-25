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

  const actionType = ((card as any).tipo || (card as any).tipoCarta) as TipoAccion;
  const meta = ACCIONES_METADATA[actionType] || {
    nombre: card.nombre || 'Acción',
    prioridad: (card as any).prioridad || 2,
    descripcion: '',
  };

  const priority = (card as any).prioridad ?? meta.prioridad ?? 2;
  const isSolar = actionType === 'DEVOCION_SOL' || actionType === 'REVOLUCION_SOL';

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
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={`group relative flex flex-col justify-between w-28 h-44 sm:w-36 sm:h-56 p-2 rounded-2xl transition-all duration-300 select-none text-left ${
        isDisabled
          ? 'opacity-40 cursor-not-allowed grayscale'
          : isSelected
          ? 'scale-105 ring-4 ring-amber-400 shadow-[0_0_25px_rgba(251,191,36,0.6)] cursor-pointer'
          : 'hover:scale-105 hover:ring-2 hover:ring-amber-400/50 cursor-pointer shadow-lg'
      } ${
        isSolar
          ? 'bg-gradient-to-b from-amber-950/80 via-slate-950 to-black border border-amber-600/40 text-amber-50'
          : 'bg-gradient-to-b from-indigo-950/80 via-slate-950 to-black border border-indigo-500/40 text-indigo-50'
      } ${className}`}
    >
      {/* Priority Badge */}
      <div className="flex items-center justify-between w-full">
        <span
          data-testid={`card-priority-${card.id}`}
          className={`flex items-center justify-center w-6 h-6 rounded-full font-mono font-bold text-xs shadow-md border ${
            isSolar
              ? 'bg-amber-500 text-amber-950 border-amber-300'
              : 'bg-indigo-500 text-indigo-950 border-indigo-300'
          }`}
          title={`Prioridad ${priority}`}
        >
          {priority}
        </span>
        <span className="text-[10px] uppercase font-bold tracking-wider opacity-75">
          {isSolar ? 'Sol' : 'Luna'}
        </span>
      </div>

      {/* Center Image or Fallback SVG */}
      <div className="relative flex-1 flex items-center justify-center my-1.5 overflow-hidden rounded-xl bg-black/40 border border-white/5">
        {!imgError ? (
          <img
            src={`/assets/cards/${actionType.toLowerCase()}.png`}
            alt={meta.nombre}
            onError={() => setImgError(true)}
            className="w-full h-full object-cover object-center rounded-xl transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div data-vector-fallback="true" className="w-full h-full flex items-center justify-center p-1">
            <ActionCardSvg action={actionType} width="100%" height="100%" />
          </div>
        )}
      </div>

      {/* Card Footer: Name */}
      <div className="pt-1 border-t border-white/10 text-center">
        <span className="font-serif font-bold text-xs sm:text-sm tracking-wide block truncate drop-shadow-sm">
          {meta.nombre}
        </span>
      </div>
    </button>
  );
});

export default ActionCard;
