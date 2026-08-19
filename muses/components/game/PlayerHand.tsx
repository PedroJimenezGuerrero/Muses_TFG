import React from 'react';
import { observer } from 'mobx-react-lite';
import { AnyCard, CartaAccion, CartaInspiracion } from '@/types/game';
import { ActionCard } from './ActionCard';
import { InspirationCard } from './InspirationCard';
import { Play } from 'lucide-react';

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
      className={`fixed bottom-0 left-0 right-0 z-40 flex flex-col items-center select-none pointer-events-none ${className}`}
    >
      {/* Action Confirmation Bar */}
      <div className="mb-2 pointer-events-auto">
        <button
          type="button"
          aria-label="Confirmar selección"
          onClick={handleConfirm}
          disabled={!selectedCard || isSubmitting}
          className={`px-6 py-2.5 rounded-full font-bold text-xs sm:text-sm tracking-wider uppercase transition-all shadow-[0_0_25px_rgba(251,191,36,0.6)] flex items-center gap-2 border ${
            selectedCard && !isSubmitting
              ? 'bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 text-zinc-950 hover:brightness-110 active:scale-95 border-amber-300 cursor-pointer animate-in fade-in slide-in-from-bottom-2'
              : 'bg-zinc-900/80 text-zinc-500 border-zinc-800 opacity-40 cursor-not-allowed'
          }`}
        >
          <Play className="w-4 h-4 fill-current" />
          {isSubmitting ? 'Confirmando...' : 'Confirmar Selección'}
        </button>
      </div>

      {/* Hand Deck - anchored to bottom half */}
      <div className="w-full max-w-4xl mx-auto px-4 pt-4 pb-2 bg-gradient-to-t from-black/95 via-black/80 to-transparent flex justify-center items-end gap-1.5 sm:gap-3 translate-y-12 sm:translate-y-16 hover:translate-y-0 transition-transform duration-300 ease-out pointer-events-auto">
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
    </div>
  );
});

export default PlayerHand;
