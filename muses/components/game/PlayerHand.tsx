import React from 'react';
import { observer } from 'mobx-react-lite';
import { AnyCard, CartaAccion, CartaInspiracion } from '@/types/game';
import { ActionCard } from './ActionCard';
import { InspirationCard } from './InspirationCard';

export interface PlayerHandProps {
  cards?: (CartaAccion | CartaInspiracion | AnyCard)[];
  hand?: { allCards: (CartaAccion | CartaInspiracion | AnyCard)[] };
  solPos: number;
  selectedCard?: AnyCard | CartaAccion | CartaInspiracion | null;
  onSelectCard: (card: AnyCard) => void;
  onHoverCard?: (card: AnyCard | null) => void;
  onConfirm: (card?: AnyCard) => void;
  isSubmitting?: boolean;
  className?: string;
}

export const PlayerHand = observer<PlayerHandProps>(({
  cards,
  hand,
  solPos,
  selectedCard,
  onSelectCard,
  onHoverCard,
  onConfirm,
  isSubmitting = false,
  className = '',
}) => {
  const cardList = cards || hand?.allCards || [];

  const isInspirationCard = (card: AnyCard): boolean => {
    return (
      (card as any).tipoCarta === 'INSPIRACION' ||
      (card as any).tipoMusa !== undefined ||
      (card as any).nombreMusa !== undefined
    );
  };

  const isCardSelected = (card: AnyCard): boolean => {
    if (!selectedCard) return false;
    if (selectedCard.id !== undefined && card.id !== undefined) {
      return selectedCard.id === card.id;
    }
    const selType = (selectedCard as any).tipo || (selectedCard as any).tipoCarta;
    const cardType = (card as any).tipo || (card as any).tipoCarta;
    return selType === cardType;
  };

  const handleConfirm = () => {
    if (selectedCard && !isSubmitting) {
      onConfirm(selectedCard as AnyCard);
    }
  };

  return (
    <div
      role="region"
      aria-label="Mano del Jugador"
      data-testid="player-hand"
      className={`w-full max-w-5xl mx-auto p-4 sm:p-5 rounded-3xl bg-slate-950/90 border border-amber-900/40 backdrop-blur-md shadow-2xl flex flex-col items-center gap-4 select-none ${className}`}
    >
      {/* Hand Cards Horizontal Deck */}
      <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-4 w-full">
        {cardList.map((card, idx) => {
          const isInsp = isInspirationCard(card as AnyCard);
          const selected = isCardSelected(card as AnyCard);

          if (isInsp) {
            return (
              <InspirationCard
                key={card.id ?? `insp-${idx}`}
                card={card as CartaInspiracion}
                solPos={solPos}
                isSelected={selected}
                isDisabled={isSubmitting}
                onClick={() => onSelectCard(card as AnyCard)}
                onMouseEnter={() => onHoverCard?.(card as AnyCard)}
                onMouseLeave={() => onHoverCard?.(null)}
              />
            );
          }

          return (
            <ActionCard
              key={card.id ?? `act-${idx}`}
              card={card as CartaAccion}
              isSelected={selected}
              isDisabled={isSubmitting}
              onClick={() => onSelectCard(card as AnyCard)}
              onMouseEnter={() => onHoverCard?.(card as AnyCard)}
              onMouseLeave={() => onHoverCard?.(null)}
            />
          );
        })}
      </div>

      {/* Confirmation Area */}
      <div className="flex items-center justify-center w-full pt-2">
        <button
          type="button"
          role="button"
          aria-label="Confirmar Selección"
          disabled={!selectedCard || isSubmitting}
          onClick={handleConfirm}
          className={`flex items-center justify-center gap-2 px-8 py-3 rounded-2xl font-serif font-bold text-sm sm:text-base tracking-wider transition-all duration-300 shadow-xl ${
            !selectedCard || isSubmitting
              ? 'bg-zinc-800 text-zinc-500 border border-zinc-700/50 cursor-not-allowed opacity-50'
              : 'bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-amber-950 border border-amber-300 hover:brightness-110 hover:shadow-[0_0_20px_rgba(245,158,11,0.6)] cursor-pointer active:scale-95'
          }`}
        >
          {isSubmitting ? (
            <>
              <span className="w-4 h-4 border-2 border-amber-950 border-t-transparent rounded-full animate-spin" />
              <span>Confirmando...</span>
            </>
          ) : (
            <span>Confirmar Selección</span>
          )}
        </button>
      </div>
    </div>
  );
});

export default PlayerHand;
