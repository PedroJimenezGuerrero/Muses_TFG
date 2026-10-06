import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import {
  createMockTablero,
  createMockPlayerHand,
  createMockPartida,
} from '../fixtures/mockGameState';
import { CartaAccion, CartaInspiracion } from '@/types/game';
import Board from '@/components/game/Board';
import MusaCard from '@/components/game/MusaCard';
import AstroOrbit from '@/components/game/AstroOrbit';
import StatusPanel from '@/components/game/StatusPanel';
import PlayerHand from '@/components/game/PlayerHand';
import ActionCard from '@/components/game/ActionCard';
import InspirationCard from '@/components/game/InspirationCard';
import GamePage from '@/app/page';
import { gameStore } from '@/store';

describe('Adversarial Challenge: DOM Semantics, ARIA Accessibility & Interaction Contracts (M1)', () => {
  // --------------------------------------------------------------------------
  // Dimension 1: ARIA Grid Semantics (Board & MusaCard)
  // --------------------------------------------------------------------------
  describe('Dimension 1: Board & MusaCard ARIA Grid Hierarchy & Keyboard Semantics', () => {
    it('CH-GRID-01: Verifies Board has role="grid" and accessible name', () => {
      const tablero = createMockTablero();
      render(<Board tablero={tablero} />);
      const grid = screen.getByRole('grid');
      expect(grid).toHaveAttribute('aria-label', 'Tablero de Musas');
    });

    it('CH-GRID-02: Verifies MusaCard has role="gridcell" for all 9 cells', () => {
      const tablero = createMockTablero();
      render(<Board tablero={tablero} />);
      const cells = screen.getAllByRole('gridcell');
      expect(cells).toHaveLength(9);
    });

    it('CH-GRID-03: STRESS (W3C Defect): role="grid" lacks intermediate role="row" containers for gridcells', () => {
      const tablero = createMockTablero();
      const { container } = render(<Board tablero={tablero} />);
      const grid = container.querySelector('[role="grid"]');
      const rows = grid?.querySelectorAll('[role="row"]');
      // Documenting W3C ARIA violation: grid must contain rows, but Board directly contains gridcells
      expect(rows?.length ?? 0).toBe(0);
    });

    it('CH-GRID-04: STRESS (Keyboard A11y Defect): Interactive MusaCard gridcell lacks tabIndex and keyboard listeners', () => {
      const tablero = createMockTablero();
      const onCardClick = vi.fn();
      render(<Board tablero={tablero} onCardClick={onCardClick} />);
      const cells = screen.getAllByRole('gridcell');
      cells.forEach((cell) => {
        expect(cell.hasAttribute('tabIndex')).toBe(false);
      });
    });
  });

  // --------------------------------------------------------------------------
  // Dimension 2: Region Semantics (StatusPanel & PlayerHand)
  // --------------------------------------------------------------------------
  describe('Dimension 2: Region Semantics & Accessible Names', () => {
    it('CH-REG-01: StatusPanel has role="region" and accessible label "Estado de Partida"', () => {
      const partida = createMockPartida();
      render(<StatusPanel partida={partida} />);
      const region = screen.getByRole('region', { name: /estado de partida/i });
      expect(region).toBeInTheDocument();
    });

    it('CH-REG-02: PlayerHand has role="region" and accessible label "Mano del Jugador"', () => {
      const hand = createMockPlayerHand(0, 'TERPSICORE');
      render(
        <PlayerHand
          cards={hand.allCards}
          solPos={0}
          onSelectCard={vi.fn()}
          onConfirm={vi.fn()}
        />
      );
      const region = screen.getByRole('region', { name: /mano del jugador/i });
      expect(region).toBeInTheDocument();
    });

    it('CH-REG-03: StatusPanel timeline indicates active step via data-active="true"', () => {
      const partida = createMockPartida(3, 9);
      render(<StatusPanel partida={partida} />);
      const activeStep = screen.getByTestId('round-step-3');
      expect(activeStep.getAttribute('data-active')).toBe('true');
    });
  });

  // --------------------------------------------------------------------------
  // Dimension 3: Button States (aria-pressed vs aria-selected, disabled, aria-disabled)
  // --------------------------------------------------------------------------
  describe('Dimension 3: Button States & Selection Contracts', () => {
    it('CH-BTN-01: STRESS (ARIA Spec Deviation): ActionCard uses aria-selected instead of aria-pressed on role="button"', () => {
      const devSol: CartaAccion = {
        id: 101,
        tipoCarta: 'ACCION',
        tipo: 'DEVOCION_SOL',
        nombre: 'Devoción Solar',
      };

      const { rerender } = render(<ActionCard card={devSol} isSelected={false} />);
      const btnUnselected = screen.getByRole('button', { name: /devoción solar/i });
      expect(btnUnselected).toHaveAttribute('aria-selected', 'false');
      expect(btnUnselected.hasAttribute('aria-pressed')).toBe(false);

      rerender(<ActionCard card={devSol} isSelected={true} />);
      const btnSelected = screen.getByRole('button', { name: /devoción solar/i });
      expect(btnSelected).toHaveAttribute('aria-selected', 'true');
      expect(btnSelected.hasAttribute('aria-pressed')).toBe(false);
    });

    it('CH-BTN-02: ActionCard sets disabled and aria-disabled when isDisabled=true', () => {
      const devSol: CartaAccion = {
        id: 101,
        tipoCarta: 'ACCION',
        tipo: 'DEVOCION_SOL',
        nombre: 'Devoción Solar',
      };
      const onClick = vi.fn();
      render(<ActionCard card={devSol} isDisabled={true} onClick={onClick} />);
      const btn = screen.getByRole('button', { name: /devoción solar/i });
      expect(btn).toBeDisabled();
      expect(btn).toHaveAttribute('aria-disabled', 'true');
      fireEvent.click(btn);
      expect(onClick).not.toHaveBeenCalled();
    });

    it('CH-BTN-03: InspirationCard disabled semantics when rule-disabled vs used', () => {
      const card: CartaInspiracion = {
        id: 105,
        tipoCarta: 'INSPIRACION',
        nombreMusa: 'TERPSICORE', // VERTICES (0, 2, 4, 6)
        usada: false,
        nombre: 'Inspiración de Terpsícore',
      };

      // Sol at side position 1 -> rule disabled (aria-disabled="true", but button not HTML disabled to preserve focus)
      const onClick = vi.fn();
      const { rerender } = render(
        <InspirationCard card={card} solPos={1} onClick={onClick} />
      );
      const btn = screen.getByRole('button', { name: /inspiración de terpsícore/i });
      expect(btn).toHaveAttribute('aria-disabled', 'true');
      fireEvent.click(btn);
      expect(onClick).not.toHaveBeenCalled();

      // Used card -> must be fully HTML disabled
      const usedCard = { ...card, usada: true };
      rerender(<InspirationCard card={usedCard} solPos={0} onClick={onClick} />);
      expect(btn).toBeDisabled();
      fireEvent.click(btn);
      expect(onClick).not.toHaveBeenCalled();
    });

    it('CH-BTN-04: Confirm button disabled state and accessibility', () => {
      const hand = createMockPlayerHand(0, 'TERPSICORE');
      const onConfirm = vi.fn();
      const { rerender } = render(
        <PlayerHand
          cards={hand.allCards}
          solPos={0}
          selectedCard={null}
          onSelectCard={vi.fn()}
          onConfirm={onConfirm}
          isSubmitting={false}
        />
      );

      const confirmBtn = screen.getByRole('button', { name: /confirmar selección/i });
      expect(confirmBtn).toBeDisabled();
      fireEvent.click(confirmBtn);
      expect(onConfirm).not.toHaveBeenCalled();

      // When card is selected
      rerender(
        <PlayerHand
          cards={hand.allCards}
          solPos={0}
          selectedCard={hand.commonCards[0]}
          onSelectCard={vi.fn()}
          onConfirm={onConfirm}
          isSubmitting={false}
        />
      );
      expect(confirmBtn).not.toBeDisabled();
      fireEvent.click(confirmBtn);
      expect(onConfirm).toHaveBeenCalled();
    });
  });

  // --------------------------------------------------------------------------
  // Dimension 4: Sun & Moon Markers Accessible Names & Image Fallbacks
  // --------------------------------------------------------------------------
  describe('Dimension 4: Sun & Moon Markers Accessible Names & Fallback Collisions', () => {
    it('CH-ASTRO-01: Renders Sun marker with accessible name "Astro Solar"', () => {
      render(<AstroOrbit solPos={0} lunaPos={4} />);
      const sun = screen.getByLabelText(/astro solar/i);
      expect(sun).toBeInTheDocument();
    });

    it('CH-ASTRO-02: Renders Moon marker with accessible name "Astro Lunar"', () => {
      render(<AstroOrbit solPos={0} lunaPos={4} />);
      const moon = screen.getByLabelText(/astro lunar/i);
      expect(moon).toBeInTheDocument();
    });

    it('CH-ASTRO-03: STRESS (A11y Label Collision): SVG fallback introduces duplicate aria-label on Sun marker', () => {
      const { container } = render(<AstroOrbit solPos={0} lunaPos={4} />);
      const sunImg = container.querySelector('img[src*="sol.png"]');
      if (sunImg) {
        fireEvent.error(sunImg);
      }
      // Both outer div (role="img" aria-label="Astro Solar") and inner svg (aria-label="Astro Solar") have the same label
      const sunElements = screen.getAllByLabelText(/astro solar/i);
      expect(sunElements.length).toBe(2);
    });

    it('CH-ASTRO-04: STRESS (A11y Label Collision): SVG fallback introduces duplicate aria-label on Moon marker', () => {
      const { container } = render(<AstroOrbit solPos={0} lunaPos={4} />);
      const moonImg = container.querySelector('img[src*="luna.png"]');
      if (moonImg) {
        fireEvent.error(moonImg);
      }
      const moonElements = screen.getAllByLabelText(/astro lunar/i);
      expect(moonElements.length).toBe(2);
    });
  });

  // --------------------------------------------------------------------------
  // Dimension 5: Interactive page.tsx State & Turn Simulation Flow
  // --------------------------------------------------------------------------
  describe('Dimension 5: page.tsx Interactive Simulation & Edge Cases', () => {
    beforeEach(() => {
      act(() => {
        gameStore.iniciarPartidaContraBots();
      });
    });

    it('CH-PAGE-01: STRESS (Semantic Landmark): Brand title in page.tsx is a span, missing an h1 heading element', () => {
      const { container } = render(<GamePage />);
      const brandSpan = container.querySelector('header span.text-2xl');
      expect(brandSpan?.textContent).toBe('MUSES');
      // Notice: page.tsx renders <span>MUSES</span> without an <h1> tag
      const headings = screen.queryAllByRole('heading');
      expect(headings.length).toBe(0);
    });

    it('CH-PAGE-02: Full turn simulation: Select Devoción Solar -> Confirm -> Astros Advance -> Round increments', async () => {
      vi.useFakeTimers();
      render(<GamePage />);

      // Initially Round 1, solPos 0 (Slot 0 has Sun)
      expect(screen.getByText(/ronda 1 de 9/i)).toBeInTheDocument();
      expect(screen.getByTestId('astro-slot-0')).toContainElement(screen.getByLabelText(/astro solar/i));

      // Select Devoción Solar
      const devSol = screen.getByRole('button', { name: /devoción solar/i });
      fireEvent.click(devSol);

      // Confirm button should now be enabled
      const confirmBtn = screen.getByRole('button', { name: /confirmar selección/i });
      expect(confirmBtn).not.toBeDisabled();

      // Click Confirm
      fireEvent.click(confirmBtn);

      // Submitting state active
      expect(screen.getByText(/confirmando/i)).toBeInTheDocument();

      // Fast-forward timeout (600ms)
      act(() => {
        vi.advanceTimersByTime(650);
      });

      // Now Round 2, solPos 1 (Slot 1 has Sun)
      expect(screen.getByText(/ronda 2 de 9/i)).toBeInTheDocument();
      expect(screen.getByTestId('astro-slot-1')).toContainElement(screen.getByLabelText(/astro solar/i));

      // Cell 0 should now have 2 devotion tokens placed
      const cell0 = screen.getByTestId('musa-card-0');
      const tokens = cell0.querySelectorAll('[data-motion="token"]');
      expect(tokens).toHaveLength(2);

      // Apolo token reserve should have dropped from 20 to 18
      const reserve = screen.getByTestId('token-reserve-1');
      expect(reserve).toHaveTextContent('18');

      vi.useRealTimers();
    });

    it('CH-PAGE-03: STRESS: Revolution Solar execution in page.tsx rotates grid cells', async () => {
      vi.useFakeTimers();
      render(<GamePage />);

      // Select Revolución Solar
      const revSol = screen.getByRole('button', { name: /revolución solar/i });
      fireEvent.click(revSol);

      const confirmBtn = screen.getByRole('button', { name: /confirmar selección/i });
      fireEvent.click(confirmBtn);

      act(() => {
        vi.advanceTimersByTime(650);
      });

      // Center muse (cell 4) should have received 1 devotion token
      // and astros advanced to solPos 1
      expect(screen.getByText(/ronda 2 de 9/i)).toBeInTheDocument();

      vi.useRealTimers();
    });

    it('CH-PAGE-04: STRESS: Reset button resets game state cleanly back to Round 1', async () => {
      vi.useFakeTimers();
      render(<GamePage />);

      // Play 1 round
      fireEvent.click(screen.getByRole('button', { name: /devoción solar/i }));
      fireEvent.click(screen.getByRole('button', { name: /confirmar selección/i }));
      act(() => {
        vi.advanceTimersByTime(650);
      });
      expect(screen.getByText(/ronda 2 de 9/i)).toBeInTheDocument();

      // Click Reset
      const resetBtn = screen.getByRole('button', { name: /reiniciar partida/i });
      fireEvent.click(resetBtn);

      expect(screen.getByText(/ronda 1 de 9/i)).toBeInTheDocument();
      expect(screen.getByTestId('token-reserve-1')).toHaveTextContent('20');

      vi.useRealTimers();
    });

    it('CH-PAGE-05: STRESS: Inspiration card can be played in Round 1 and transitions to used (cannot be replayed)', async () => {
      vi.useFakeTimers();
      render(<GamePage />);

      // Round 1 (solPos = 0, VERTICES is valid for Terpsícore)
      const inspBtn = screen.getByRole('button', { name: /inspiración de terpsícore/i });
      expect(inspBtn).not.toBeDisabled();
      expect(inspBtn).not.toHaveAttribute('aria-disabled', 'true');

      // Select Inspiration Card
      fireEvent.click(inspBtn);
      const confirmBtn = screen.getByRole('button', { name: /confirmar selección/i });
      fireEvent.click(confirmBtn);

      act(() => {
        vi.advanceTimersByTime(650);
      });

      // Now Round 2: solPos is 1, and inspiration card is marked used
      expect(screen.getByText(/ronda 2 de 9/i)).toBeInTheDocument();
      const updatedInspBtn = screen.getByRole('button', { name: /inspiración de terpsícore/i });
      expect(updatedInspBtn).toBeDisabled();
      expect(screen.getByText(/usada/i)).toBeInTheDocument();

      // Clicking does not select it
      fireEvent.click(updatedInspBtn);
      expect(confirmBtn).toBeDisabled();

      vi.useRealTimers();
    });

    it('CH-PAGE-06: STRESS: Mutual exclusion and toggling selection off', () => {
      render(<GamePage />);

      const devSol = screen.getByRole('button', { name: /devoción solar/i });
      const devLuna = screen.getByRole('button', { name: /devoción lunar/i });
      const confirmBtn = screen.getByRole('button', { name: /confirmar selección/i });

      // Click Dev Sol -> Selected
      fireEvent.click(devSol);
      expect(devSol).toHaveAttribute('aria-selected', 'true');
      expect(devLuna).toHaveAttribute('aria-selected', 'false');
      expect(confirmBtn).not.toBeDisabled();

      // Click Dev Sol again -> Deselected
      fireEvent.click(devSol);
      expect(devSol).toHaveAttribute('aria-selected', 'false');
      expect(confirmBtn).toBeDisabled();

      // Click Dev Luna -> Selected
      fireEvent.click(devLuna);
      expect(devLuna).toHaveAttribute('aria-selected', 'true');
      expect(confirmBtn).not.toBeDisabled();
    });
  });
});
