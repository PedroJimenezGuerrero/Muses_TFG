import React from 'react';
import { observer } from 'mobx-react-lite';
import { motion } from 'motion/react';
import { Tablero, AnyCard, CartaAccion, CartaInspiracion } from '@/types/game';
import { mapAstroToGrid, REVOLUTION_CYCLES, getInspirationTargetCells } from '@/lib/gameRules';
import { AstroOrbit } from './AstroOrbit';
import { MusaCard } from './MusaCard';

export interface BoardProps {
  tablero: Tablero;
  hoveredCard?: AnyCard | CartaAccion | CartaInspiracion | null;
  selectedCard?: AnyCard | CartaAccion | CartaInspiracion | null;
  activeMusaIndex?: number | null;
  revolutionAnimating?: boolean;
  onPositionSelect?: (pos: number) => void;
  onCardClick?: (index: number) => void;
  className?: string;
  children?: React.ReactNode;
}

export const Board = observer<BoardProps>(({
  tablero,
  hoveredCard,
  selectedCard,
  activeMusaIndex,
  revolutionAnimating,
  onPositionSelect,
  onCardClick,
  className = '',
  children,
}) => {
  const activeCard = hoveredCard ?? selectedCard;

  // Calculate affected cells based on the active previewed card
  const getCellHighlightInfo = (index: number) => {
    if (!activeCard) {
      return {
        highlightType: undefined,
        isRevolutionMember: undefined,
      };
    }

    const cardType = (activeCard as any).tipo || (activeCard as any).tipoCarta;

    if (cardType === 'DEVOCION_SOL') {
      const target = mapAstroToGrid(tablero.solPos);
      return {
        highlightType: index === target ? ('sun' as const) : undefined,
        isRevolutionMember: undefined,
      };
    }

    if (cardType === 'DEVOCION_LUNA') {
      const target = mapAstroToGrid(tablero.lunaPos);
      return {
        highlightType: index === target ? ('moon' as const) : undefined,
        isRevolutionMember: undefined,
      };
    }

    if (cardType === 'REVOLUCION_SOL') {
      const normSol = ((tablero.solPos % 8) + 8) % 8;
      const cycle = REVOLUTION_CYCLES[normSol] || [4, 0, 1, 2, 5, 8];
      const isMember = cycle.includes(index);
      return {
        highlightType: undefined,
        isRevolutionMember: isMember,
      };
    }

    if (cardType === 'REVOLUCION_LUNA') {
      const normLuna = ((tablero.lunaPos % 8) + 8) % 8;
      const cycle = REVOLUTION_CYCLES[normLuna] || [4, 8, 7, 6, 3, 0];
      const isMember = cycle.includes(index);
      return {
        highlightType: undefined,
        isRevolutionMember: isMember,
      };
    }

    if (cardType === 'INSPIRACION' || (activeCard as any).tipoMusa || (activeCard as any).nombreMusa) {
      const musaName = (activeCard as any).tipoMusa || (activeCard as any).nombreMusa;
      if (musaName) {
        const targetCells = getInspirationTargetCells(musaName, tablero.solPos);
        return {
          highlightType: targetCells.includes(index) ? ('inspiration' as const) : undefined,
          isRevolutionMember: undefined,
        };
      }
    }

    return {
      highlightType: undefined,
      isRevolutionMember: undefined,
    };
  };

  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      <AstroOrbit
        solPos={tablero.solPos}
        lunaPos={tablero.lunaPos}
        onPositionSelect={onPositionSelect}
      >
        <div
          role="grid"
          aria-label="Tablero de Musas"
          className="grid grid-cols-3 gap-2 sm:gap-3.5 p-2 sm:p-4 rounded-3xl bg-zinc-950/70 border border-amber-900/30 backdrop-blur-sm shadow-inner"
        >
          {tablero.grid.map((musa, index) => {
            const { highlightType, isRevolutionMember } = getCellHighlightInfo(index);
            const isReceiving = activeMusaIndex === index;
            const isRevMember = isRevolutionMember ?? (revolutionAnimating && (index === 4 || index === mapAstroToGrid(tablero.solPos) || index === mapAstroToGrid(tablero.lunaPos)));
            return (
              <motion.div
                key={musa.nombre}
                layoutId={`musa-card-${musa.nombre}`}
                layout
                transition={{
                  type: 'spring',
                  stiffness: 150,
                  damping: 20,
                  mass: 0.8,
                }}
                className="relative"
              >
                <MusaCard
                  musa={musa}
                  index={index}
                  highlightType={highlightType}
                  isRevolutionMember={isRevMember}
                  isReceivingTokens={isReceiving}
                  isRevolutionAnimating={revolutionAnimating && (isRevolutionMember || index === 4)}
                  tokens={musa.tokensColocados}
                  onClick={() => onCardClick?.(index)}
                />
              </motion.div>
            );
          })}
          {children}
        </div>
      </AstroOrbit>
    </div>
  );
});

export default Board;
