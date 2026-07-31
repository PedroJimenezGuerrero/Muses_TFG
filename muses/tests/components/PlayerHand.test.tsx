import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import {
  createMockPlayerHand,
  createMockJugador,
  CartaAccion,
  CartaInspiracion,
} from '../fixtures/mockGameState';

// @ts-expect-error - PlayerHand component implemented in Milestone M2
import PlayerHand from '@/components/game/PlayerHand';

describe('PlayerHand Component (F22: Fixed Bottom Hand, F27: Interactive Selection, F29: SVG Cards)', () => {
  const defaultHand = createMockPlayerHand(0, 'TERPSICORE'); // VERTICES card

  // -------------------------------------------------------------
  // Tier 1: Render & Static Semantics (>= 5 tests)
  // -------------------------------------------------------------
  describe('Tier 1: Render & Static Semantics', () => {
    it('T1-F22-01: Renders the player hand container with role="region" and accessible label', () => {
      render(
        <PlayerHand
          cards={defaultHand.allCards}
          solPos={0}
          onSelectCard={vi.fn()}
          onConfirm={vi.fn()}
          isSubmitting={false}
        />
      );

      const handRegion = screen.getByRole('region', { name: /mano del jugador/i });
      expect(handRegion).toBeInTheDocument();
    });

    it('T1-F22-02: Renders all 4 common action cards', () => {
      render(
        <PlayerHand
          cards={defaultHand.allCards}
          solPos={0}
          onSelectCard={vi.fn()}
          onConfirm={vi.fn()}
          isSubmitting={false}
        />
      );

      expect(screen.getByText(/devoción solar/i)).toBeInTheDocument();
      expect(screen.getByText(/devoción lunar/i)).toBeInTheDocument();
      expect(screen.getByText(/revolución solar/i)).toBeInTheDocument();
      expect(screen.getByText(/revolución lunar/i)).toBeInTheDocument();
    });

    it('T1-F22-03: Renders the 1 private inspiration card unique to active player', () => {
      render(
        <PlayerHand
          cards={defaultHand.allCards}
          solPos={0}
          onSelectCard={vi.fn()}
          onConfirm={vi.fn()}
          isSubmitting={false}
        />
      );

      const inspirationCard = screen.getByText(/inspiración de terpsícore/i);
      expect(inspirationCard).toBeInTheDocument();
    });

    it('T1-F22-04: Displays action priority badges (Inspiración 1, Dev Sol 2, Rev Sol 3, Rev Luna 4, Dev Luna 5)', () => {
      render(
        <PlayerHand
          cards={defaultHand.allCards}
          solPos={0}
          onSelectCard={vi.fn()}
          onConfirm={vi.fn()}
          isSubmitting={false}
        />
      );

      // Verify priorities are visible on cards
      expect(screen.getByTestId('card-priority-101')).toHaveTextContent('2'); // Dev Sol
      expect(screen.getByTestId('card-priority-102')).toHaveTextContent('5'); // Dev Luna
      expect(screen.getByTestId('card-priority-103')).toHaveTextContent('3'); // Rev Sol
      expect(screen.getByTestId('card-priority-104')).toHaveTextContent('4'); // Rev Luna
      expect(screen.getByTestId('card-priority-105')).toHaveTextContent('1'); // Inspiración
    });

    it('T1-F22-05: Renders "Confirmar Selección" button in disabled state when no card is selected', () => {
      render(
        <PlayerHand
          cards={defaultHand.allCards}
          solPos={0}
          selectedCard={null}
          onSelectCard={vi.fn()}
          onConfirm={vi.fn()}
          isSubmitting={false}
        />
      );

      const confirmButton = screen.getByRole('button', { name: /confirmar selección/i });
      expect(confirmButton).toBeInTheDocument();
      expect(confirmButton).toBeDisabled();
    });
  });

  // -------------------------------------------------------------
  // Tier 2: Dynamic Interaction, State Transitions & Boundary Conditions (>= 5 tests)
  // -------------------------------------------------------------
  describe('Tier 2: Dynamic Interaction, State Transitions & Boundary Conditions', () => {
    it('T2-F22-01: Clicking an unselected card invokes onSelectCard callback and enables confirmation', () => {
      const onSelectCard = vi.fn();
      render(
        <PlayerHand
          cards={defaultHand.allCards}
          solPos={0}
          selectedCard={null}
          onSelectCard={onSelectCard}
          onConfirm={vi.fn()}
          isSubmitting={false}
        />
      );

      const devSolCard = screen.getByRole('button', { name: /devoción solar/i });
      fireEvent.click(devSolCard);

      expect(onSelectCard).toHaveBeenCalledWith(
        expect.objectContaining({ tipoCarta: 'DEVOCION_SOL' })
      );
    });

    it('T2-F22-02: Enforces single-card selection mutual exclusion in active state', () => {
      const devSol = defaultHand.commonCards[0];
      const { rerender } = render(
        <PlayerHand
          cards={defaultHand.allCards}
          solPos={0}
          selectedCard={devSol}
          onSelectCard={vi.fn()}
          onConfirm={vi.fn()}
          isSubmitting={false}
        />
      );

      const devSolBtn = screen.getByRole('button', { name: /devoción solar/i });
      expect(devSolBtn).toHaveAttribute('aria-selected', 'true');

      const devLunaBtn = screen.getByRole('button', { name: /devoción lunar/i });
      expect(devLunaBtn).toHaveAttribute('aria-selected', 'false');

      // Switch selection to Devoción Luna
      const devLuna = defaultHand.commonCards[1];
      rerender(
        <PlayerHand
          cards={defaultHand.allCards}
          solPos={0}
          selectedCard={devLuna}
          onSelectCard={vi.fn()}
          onConfirm={vi.fn()}
          isSubmitting={false}
        />
      );

      expect(screen.getByRole('button', { name: /devoción solar/i })).toHaveAttribute('aria-selected', 'false');
      expect(screen.getByRole('button', { name: /devoción lunar/i })).toHaveAttribute('aria-selected', 'true');
    });

    it('T2-F22-03: Disables inspiration card and prevents selection when usada=true', () => {
      const usedInspirationHand = createMockPlayerHand(0, 'TERPSICORE');
      usedInspirationHand.inspirationCard.usada = true;
      const onSelectCard = vi.fn();

      render(
        <PlayerHand
          cards={usedInspirationHand.allCards}
          solPos={0}
          selectedCard={null}
          onSelectCard={onSelectCard}
          onConfirm={vi.fn()}
          isSubmitting={false}
        />
      );

      const inspirationBtn = screen.getByRole('button', { name: /inspiración de terpsícore/i });
      expect(inspirationBtn).toBeDisabled();
      expect(screen.getByText(/usada/i)).toBeInTheDocument();

      fireEvent.click(inspirationBtn);
      expect(onSelectCard).not.toHaveBeenCalled();
    });

    it('T2-F22-04: Blocks selection of VERTICES inspiration card when solPos is at a side (odd solPos)', () => {
      // TERPSICORE is VERTICES (valid for solPos 0, 2, 4, 6). If solPos = 1, it's invalid.
      const onSelectCard = vi.fn();
      render(
        <PlayerHand
          cards={defaultHand.allCards}
          solPos={1} // Side position
          selectedCard={null}
          onSelectCard={onSelectCard}
          onConfirm={vi.fn()}
          isSubmitting={false}
        />
      );

      const inspirationBtn = screen.getByRole('button', { name: /inspiración de terpsícore/i });
      expect(inspirationBtn).toHaveAttribute('aria-disabled', 'true');

      fireEvent.click(inspirationBtn);
      expect(onSelectCard).not.toHaveBeenCalled();
    });

    it('T2-F22-05: Disables all hand cards and confirmation button when isSubmitting=true', () => {
      const devSol = defaultHand.commonCards[0];
      const onConfirm = vi.fn();

      render(
        <PlayerHand
          cards={defaultHand.allCards}
          solPos={0}
          selectedCard={devSol}
          onSelectCard={vi.fn()}
          onConfirm={onConfirm}
          isSubmitting={true}
        />
      );

      const confirmBtn = screen.getByRole('button', { name: /confirmar selección/i });
      expect(confirmBtn).toBeDisabled();

      // Cards should be disabled
      defaultHand.allCards.forEach((card) => {
        const cardBtn = screen.getByTestId(`action-card-${card.id}`);
        expect(cardBtn).toHaveAttribute('aria-disabled', 'true');
      });
    });

    it('T2-F22-06: Clicking Confirm calls onConfirm with currently selected card', () => {
      const devSol = defaultHand.commonCards[0];
      const onConfirm = vi.fn();

      render(
        <PlayerHand
          cards={defaultHand.allCards}
          solPos={0}
          selectedCard={devSol}
          onSelectCard={vi.fn()}
          onConfirm={onConfirm}
          isSubmitting={false}
        />
      );

      const confirmBtn = screen.getByRole('button', { name: /confirmar selección/i });
      expect(confirmBtn).not.toBeDisabled();
      fireEvent.click(confirmBtn);

      expect(onConfirm).toHaveBeenCalledWith(devSol);
    });
  });

  // -------------------------------------------------------------
  // Tier 3: Pairwise Feature Interactions (F22 x F27 x F29)
  // -------------------------------------------------------------
  describe('Tier 3: Pairwise Feature Interactions', () => {
    it('P-04: Permits selection of LADOS inspiration card when solPos is at a side (solPos = 1, 3, 5, 7)', () => {
      const clioHand = createMockPlayerHand(1, 'CLIO'); // CLIO is LADOS
      const onSelectCard = vi.fn();

      render(
        <PlayerHand
          cards={clioHand.allCards}
          solPos={1} // Side position
          selectedCard={null}
          onSelectCard={onSelectCard}
          onConfirm={vi.fn()}
          isSubmitting={false}
        />
      );

      const inspirationBtn = screen.getByRole('button', { name: /inspiración de clío/i });
      expect(inspirationBtn).not.toHaveAttribute('aria-disabled', 'true');

      fireEvent.click(inspirationBtn);
      expect(onSelectCard).toHaveBeenCalledWith(
        expect.objectContaining({ tipoMusa: 'CLIO' })
      );
    });

    it('P-03: Hovering a card fires onHoverCard callback to trigger board glow highlights', () => {
      const onHoverCard = vi.fn();
      render(
        <PlayerHand
          cards={defaultHand.allCards}
          solPos={0}
          selectedCard={null}
          onSelectCard={vi.fn()}
          onHoverCard={onHoverCard}
          onConfirm={vi.fn()}
          isSubmitting={false}
        />
      );

      const devSolCard = screen.getByRole('button', { name: /devoción solar/i });
      fireEvent.mouseEnter(devSolCard);

      expect(onHoverCard).toHaveBeenCalledWith(
        expect.objectContaining({ tipoCarta: 'DEVOCION_SOL' })
      );

      fireEvent.mouseLeave(devSolCard);
      expect(onHoverCard).toHaveBeenCalledWith(null);
    });

    it('F29: Inspiration card renders embedded 3x3 miniature target grid', () => {
      render(
        <PlayerHand
          cards={defaultHand.allCards}
          solPos={0}
          onSelectCard={vi.fn()}
          onConfirm={vi.fn()}
          isSubmitting={false}
        />
      );

      const miniGrid = screen.getByTestId('inspiration-mini-grid');
      expect(miniGrid).toBeInTheDocument();
      // Verify mini grid contains 9 indicator cells
      const miniCells = miniGrid.querySelectorAll('[data-mini-cell]');
      expect(miniCells).toHaveLength(9);
    });
  });
});
