import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import {
  createMockTablero,
  createMockPlayerHand,
  createMockJugador,
  Tablero,
  CartaAccion,
  CartaInspiracion,
  Token,
} from '../fixtures/mockGameState';

import Board from '@/components/game/Board';

describe('Board Component (F21: 3x3 Musas Grid & 8-Astro Orbit UI, F28, F30)', () => {
  // -------------------------------------------------------------
  // Tier 1: Render & Static Semantics (>= 5 tests)
  // -------------------------------------------------------------
  describe('Tier 1: Render & Static Semantics', () => {
    it('T1-F21-01: Renders the 3x3 board container with role="grid" and accessible label', () => {
      const tablero = createMockTablero();
      render(<Board tablero={tablero} />);

      const boardGrid = screen.getByRole('grid', { name: /tablero de musas/i });
      expect(boardGrid).toBeInTheDocument();
    });

    it('T1-F21-02: Renders exactly 9 distinct musa cards in the grid', () => {
      const tablero = createMockTablero();
      render(<Board tablero={tablero} />);

      const musaCells = screen.getAllByRole('gridcell');
      expect(musaCells).toHaveLength(9);

      // Verify all 9 mythological musas appear
      const expectedMusas = [
        'CLIO', 'EUTERPE', 'TALIA',
        'MELPOMENE', 'TERPSICORE', 'ERATO',
        'POLIMNIA', 'URANIA', 'CALIOPE',
      ];
      expectedMusas.forEach((musaName) => {
        expect(screen.getByText(new RegExp(musaName, 'i'))).toBeInTheDocument();
      });
    });

    it('T1-F21-03: Renders the 8-position perimeter astro orbit ring', () => {
      const tablero = createMockTablero();
      render(<Board tablero={tablero} />);

      for (let pos = 0; pos < 8; pos++) {
        const slot = screen.getByTestId(`astro-slot-${pos}`);
        expect(slot).toBeInTheDocument();
      }
    });

    it('T1-F21-04: Renders the Sun marker at initial solPos = 0', () => {
      const tablero = createMockTablero({ solPos: 0, lunaPos: 4 });
      render(<Board tablero={tablero} />);

      const solSlot = screen.getByTestId('astro-slot-0');
      expect(solSlot).toContainElement(screen.getByLabelText(/sol/i));
    });

    it('T1-F21-05: Renders the Moon marker at initial lunaPos = 4', () => {
      const tablero = createMockTablero({ solPos: 0, lunaPos: 4 });
      render(<Board tablero={tablero} />);

      const lunaSlot = screen.getByTestId('astro-slot-4');
      expect(lunaSlot).toContainElement(screen.getByLabelText(/luna/i));
    });

    it('T1-F21-06: Identifies Cell 4 (Center Muse) as the Revolution center', () => {
      const tablero = createMockTablero();
      render(<Board tablero={tablero} />);

      const centerCard = screen.getByTestId('musa-card-4');
      expect(centerCard).toHaveAttribute('data-center-muse', 'true');
    });

    it('T1-F21-07: Renders point level badges (Nivel 1, 2, 3) on musa cards', () => {
      const tablero = createMockTablero();
      render(<Board tablero={tablero} />);

      // E.g. Clio has points 7, 5, 3
      const clioCard = screen.getByTestId('musa-card-0');
      expect(clioCard).toHaveTextContent('7');
      expect(clioCard).toHaveTextContent('5');
      expect(clioCard).toHaveTextContent('3');
    });
  });

  // -------------------------------------------------------------
  // Tier 2: Dynamic State Transitions & Boundary Conditions (>= 5 tests)
  // -------------------------------------------------------------
  describe('Tier 2: Dynamic Interaction, State Transitions & Boundary Conditions', () => {
    it('T2-F21-01: Dynamically updates Sun and Moon positions when props advance', () => {
      const initialTablero = createMockTablero({ solPos: 0, lunaPos: 4 });
      const { rerender } = render(<Board tablero={initialTablero} />);

      expect(screen.getByTestId('astro-slot-0')).toContainElement(screen.getByLabelText(/sol/i));
      expect(screen.getByTestId('astro-slot-4')).toContainElement(screen.getByLabelText(/luna/i));

      // Advance clock: solPos = 1, lunaPos = 5
      const updatedTablero = createMockTablero({ solPos: 1, lunaPos: 5 });
      rerender(<Board tablero={updatedTablero} />);

      expect(screen.getByTestId('astro-slot-1')).toContainElement(screen.getByLabelText(/sol/i));
      expect(screen.getByTestId('astro-slot-5')).toContainElement(screen.getByLabelText(/luna/i));
    });

    it('T2-F21-02: Renders placed devotion tokens on target musa cells matching player ownership', () => {
      const tokens: Token[] = [
        { id: 1, colocado: true, jugadorId: 1 },
        { id: 2, colocado: true, jugadorId: 1 },
      ];
      const tablero = createMockTablero();
      tablero.grid[0].tokensColocados = tokens;

      render(<Board tablero={tablero} />);

      const cell0 = screen.getByTestId('musa-card-0');
      const renderedTokens = cell0.querySelectorAll('[data-testid^="devotion-token-"]');
      expect(renderedTokens).toHaveLength(2);
      expect(renderedTokens[0]).toHaveAttribute('data-player-id', '1');
    });

    it('T2-F21-03: Displays tokens from multiple players coexisting on the same musa cell', () => {
      const tokens: Token[] = [
        { id: 1, colocado: true, jugadorId: 1 },
        { id: 2, colocado: true, jugadorId: 2 },
        { id: 3, colocado: true, jugadorId: 3 },
      ];
      const tablero = createMockTablero();
      tablero.grid[4].tokensColocados = tokens;

      render(<Board tablero={tablero} />);

      const cell4 = screen.getByTestId('musa-card-4');
      expect(cell4.querySelector('[data-player-id="1"]')).toBeInTheDocument();
      expect(cell4.querySelector('[data-player-id="2"]')).toBeInTheDocument();
      expect(cell4.querySelector('[data-player-id="3"]')).toBeInTheDocument();
    });

    it('T2-F21-04: Handles 0 tokens on a musa cell gracefully without layout distortion', () => {
      const tablero = createMockTablero();
      render(<Board tablero={tablero} />);

      const cell1 = screen.getByTestId('musa-card-1');
      const tokens = cell1.querySelectorAll('[data-testid^="devotion-token-"]');
      expect(tokens).toHaveLength(0);
    });

    it('T2-F21-05: Boundary condition: Astro ring rollover from slot 7 to slot 0', () => {
      const tableroRound8 = createMockTablero({ solPos: 7, lunaPos: 3 });
      const { rerender } = render(<Board tablero={tableroRound8} />);

      expect(screen.getByTestId('astro-slot-7')).toContainElement(screen.getByLabelText(/sol/i));

      // Rollover to round 9 (solPos wraps to 0)
      const tableroRound9 = createMockTablero({ solPos: 0, lunaPos: 4 });
      rerender(<Board tablero={tableroRound9} />);

      expect(screen.getByTestId('astro-slot-0')).toContainElement(screen.getByLabelText(/sol/i));
    });

    it('T2-F21-06: Triggers onPositionSelect callback when an interactive orbit slot is clicked', () => {
      const onPositionSelect = vi.fn();
      const tablero = createMockTablero();
      render(<Board tablero={tablero} onPositionSelect={onPositionSelect} />);

      const slot2 = screen.getByTestId('astro-slot-2');
      fireEvent.click(slot2);

      expect(onPositionSelect).toHaveBeenCalledWith(2);
    });
  });

  // -------------------------------------------------------------
  // Tier 3: Pairwise Feature Interactions
  // -------------------------------------------------------------
  describe('Tier 3: Pairwise Feature Interactions (F21 x F26 Glow, F28 x F30 Assets)', () => {
    it('P-01 (F21 x F26): Illuminates single solar cell when DEVOCION_SOL card is hovered', () => {
      // solPos = 0 -> maps to Grid index 0
      const tablero = createMockTablero({ solPos: 0, lunaPos: 4 });
      const hoveredCard: CartaAccion = {
        id: 101,
        tipoCarta: 'DEVOCION_SOL',
        prioridad: 2,
        nombre: 'Devoción Solar',
      };

      render(<Board tablero={tablero} hoveredCard={hoveredCard} />);

      const cell0 = screen.getByTestId('musa-card-0');
      expect(cell0).toHaveAttribute('data-highlight', 'sun');

      // Other cells must not have sun highlight
      const cell1 = screen.getByTestId('musa-card-1');
      expect(cell1).not.toHaveAttribute('data-highlight', 'sun');
    });

    it('P-01b (F21 x F26): Illuminates lunar target cell when DEVOCION_LUNA card is hovered', () => {
      // lunaPos = 4 -> maps to Grid index 8
      const tablero = createMockTablero({ solPos: 0, lunaPos: 4 });
      const hoveredCard: CartaAccion = {
        id: 102,
        tipoCarta: 'DEVOCION_LUNA',
        prioridad: 5,
        nombre: 'Devoción Lunar',
      };

      render(<Board tablero={tablero} hoveredCard={hoveredCard} />);

      const cell8 = screen.getByTestId('musa-card-8');
      expect(cell8).toHaveAttribute('data-highlight', 'moon');
    });

    it('P-09 (F21 x F26): Illuminates 6-muse rotation loop and leaves 3 musas stationary when REVOLUCION_SOL hovered', () => {
      // solPos = 0: cycle is 4 -> 0 -> 1 -> 2 -> 5 -> 8 -> 4. Stationary are 3, 6, 7.
      const tablero = createMockTablero({ solPos: 0, lunaPos: 4 });
      const hoveredCard: CartaAccion = {
        id: 103,
        tipoCarta: 'REVOLUCION_SOL',
        prioridad: 3,
        nombre: 'Revolución Solar',
      };

      render(<Board tablero={tablero} hoveredCard={hoveredCard} />);

      // Rotating loop members
      [0, 1, 2, 4, 5, 8].forEach((cellIndex) => {
        expect(screen.getByTestId(`musa-card-${cellIndex}`)).toHaveAttribute('data-revolution-member', 'true');
      });

      // Stationary cells
      [3, 6, 7].forEach((cellIndex) => {
        expect(screen.getByTestId(`musa-card-${cellIndex}`)).toHaveAttribute('data-revolution-member', 'false');
      });
    });

    it('P-08 (F28 x F30): Gracefully renders fallback vector SVG if musa image triggers error', () => {
      const tablero = createMockTablero();
      render(<Board tablero={tablero} />);

      const cell0 = screen.getByTestId('musa-card-0');
      const img = cell0.querySelector('img');
      if (img) {
        fireEvent.error(img);
      }

      // Either fallback SVG or styled vector placeholder is rendered
      const svgOrCard = cell0.querySelector('svg') || cell0.querySelector('[data-vector-fallback="true"]');
      expect(svgOrCard).toBeInTheDocument();
    });
  });
});
