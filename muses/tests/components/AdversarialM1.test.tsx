import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import {
  createMockTablero,
  createMockPlayerHand,
  createMockJugador,
  createMockPartida,
  CartaAccion,
  CartaInspiracion,
  TipoMusa,
  Tablero,
  Token,
} from '../fixtures/mockGameState';

import Board from '@/components/game/Board';
import PlayerHand from '@/components/game/PlayerHand';
import AstroOrbit from '@/components/game/AstroOrbit';
import StatusPanel from '@/components/game/StatusPanel';
import ActionCard from '@/components/game/ActionCard';
import InspirationCard from '@/components/game/InspirationCard';
import MusaCard from '@/components/game/MusaCard';
import { mapAstroToGrid, canPlayInspirationCard, getInspirationTargetCells } from '@/lib/gameRules';

describe('Adversarial M1 Stress Tests: Robustness & Empirical Edge Cases', () => {
  // =========================================================================
  // Challenge 1: Rapid Card Hover Transitions and Un-hover Highlight Clearing
  // =========================================================================
  describe('Challenge 1: Rapid Card Hover Transitions & Un-hover Clearing', () => {
    it('ADV-01: Rapid sequence of card hovers correctly updates active highlight and cleanly clears all cells on un-hover', () => {
      const tablero = createMockTablero({ solPos: 0, lunaPos: 4 });
      const devSol: CartaAccion = { id: 101, tipoCarta: 'DEVOCION_SOL', prioridad: 2, nombre: 'Devoción Sol' };
      const devLuna: CartaAccion = { id: 102, tipoCarta: 'DEVOCION_LUNA', prioridad: 5, nombre: 'Devoción Luna' };
      const revSol: CartaAccion = { id: 103, tipoCarta: 'REVOLUCION_SOL', prioridad: 3, nombre: 'Revolución Sol' };
      const inspTerp: CartaInspiracion = {
        id: 105,
        tipoCarta: 'INSPIRACION',
        prioridad: 1,
        nombre: 'Inspiración Terpsícore',
        tipoMusa: 'TERPSICORE',
        orientacion: 'VERTICES',
        usada: false,
      };

      const { rerender } = render(<Board tablero={tablero} hoveredCard={null} />);

      // Initial: No highlights on any cell
      for (let i = 0; i < 9; i++) {
        const cell = screen.getByTestId(`musa-card-${i}`);
        expect(cell).not.toHaveAttribute('data-highlight');
        expect(cell).not.toHaveAttribute('data-revolution-member');
      }

      // Step 1: Hover Devocion Sol -> Cell 0 has "sun"
      rerender(<Board tablero={tablero} hoveredCard={devSol} />);
      expect(screen.getByTestId('musa-card-0')).toHaveAttribute('data-highlight', 'sun');
      for (let i = 1; i < 9; i++) {
        expect(screen.getByTestId(`musa-card-${i}`)).not.toHaveAttribute('data-highlight');
      }

      // Step 2: Rapidly switch to Devocion Luna -> Cell 0 cleared, Cell 8 has "moon"
      rerender(<Board tablero={tablero} hoveredCard={devLuna} />);
      expect(screen.getByTestId('musa-card-0')).not.toHaveAttribute('data-highlight');
      expect(screen.getByTestId('musa-card-8')).toHaveAttribute('data-highlight', 'moon');

      // Step 3: Rapidly switch to Revolucion Sol -> Cell 8 cleared, 6 rotation cells active
      rerender(<Board tablero={tablero} hoveredCard={revSol} />);
      expect(screen.getByTestId('musa-card-8')).not.toHaveAttribute('data-highlight');
      [0, 1, 2, 4, 5, 8].forEach((idx) => {
        expect(screen.getByTestId(`musa-card-${idx}`)).toHaveAttribute('data-revolution-member', 'true');
      });
      [3, 6, 7].forEach((idx) => {
        expect(screen.getByTestId(`musa-card-${idx}`)).toHaveAttribute('data-revolution-member', 'false');
      });

      // Step 4: Rapidly switch to Inspiration Terpsicore (solPos 0 -> targets cell 5)
      rerender(<Board tablero={tablero} hoveredCard={inspTerp} />);
      for (let i = 0; i < 9; i++) {
        expect(screen.getByTestId(`musa-card-${i}`)).not.toHaveAttribute('data-revolution-member');
      }
      expect(screen.getByTestId('musa-card-5')).toHaveAttribute('data-highlight', 'inspiration');

      // Step 5: Un-hover (mouse leaves completely) -> ALL 9 cells MUST be completely clean
      rerender(<Board tablero={tablero} hoveredCard={null} />);
      for (let i = 0; i < 9; i++) {
        const cell = screen.getByTestId(`musa-card-${i}`);
        expect(cell).not.toHaveAttribute('data-highlight');
        expect(cell).not.toHaveAttribute('data-revolution-member');
      }
    });

    it('ADV-02: Card hover previews override selected card, and un-hover cleanly restores selected card highlight', () => {
      const tablero = createMockTablero({ solPos: 0, lunaPos: 4 });
      const devSol: CartaAccion = { id: 101, tipoCarta: 'DEVOCION_SOL', prioridad: 2, nombre: 'Devoción Sol' };
      const devLuna: CartaAccion = { id: 102, tipoCarta: 'DEVOCION_LUNA', prioridad: 5, nombre: 'Devoción Luna' };

      // Dev Sol is selected
      const { rerender } = render(<Board tablero={tablero} selectedCard={devSol} hoveredCard={null} />);
      expect(screen.getByTestId('musa-card-0')).toHaveAttribute('data-highlight', 'sun');

      // User hovers Dev Luna -> Preview overrides selection (Cell 8 is "moon", Cell 0 cleared)
      rerender(<Board tablero={tablero} selectedCard={devSol} hoveredCard={devLuna} />);
      expect(screen.getByTestId('musa-card-0')).not.toHaveAttribute('data-highlight');
      expect(screen.getByTestId('musa-card-8')).toHaveAttribute('data-highlight', 'moon');

      // User unhovers -> Preview clears, selected card Dev Sol highlight is restored on Cell 0
      rerender(<Board tablero={tablero} selectedCard={devSol} hoveredCard={null} />);
      expect(screen.getByTestId('musa-card-0')).toHaveAttribute('data-highlight', 'sun');
      expect(screen.getByTestId('musa-card-8')).not.toHaveAttribute('data-highlight');
    });

    it('ADV-03: Rapid mouseEnter and mouseLeave events across PlayerHand cards trigger onHoverCard in proper order', () => {
      const hand = createMockPlayerHand(0, 'TERPSICORE');
      const onHoverCard = vi.fn();

      render(
        <PlayerHand
          cards={hand.allCards}
          solPos={0}
          onSelectCard={vi.fn()}
          onHoverCard={onHoverCard}
          onConfirm={vi.fn()}
        />
      );

      const devSolBtn = screen.getByRole('button', { name: /devoción solar/i });
      const devLunaBtn = screen.getByRole('button', { name: /devoción lunar/i });
      const revSolBtn = screen.getByRole('button', { name: /revolución solar/i });

      // Rapidly enter and leave across buttons
      fireEvent.mouseEnter(devSolBtn);
      expect(onHoverCard).toHaveBeenLastCalledWith(expect.objectContaining({ tipoCarta: 'DEVOCION_SOL' }));

      fireEvent.mouseLeave(devSolBtn);
      expect(onHoverCard).toHaveBeenLastCalledWith(null);

      fireEvent.mouseEnter(devLunaBtn);
      expect(onHoverCard).toHaveBeenLastCalledWith(expect.objectContaining({ tipoCarta: 'DEVOCION_LUNA' }));

      fireEvent.mouseEnter(revSolBtn);
      expect(onHoverCard).toHaveBeenLastCalledWith(expect.objectContaining({ tipoCarta: 'REVOLUCION_SOL' }));

      fireEvent.mouseLeave(revSolBtn);
      expect(onHoverCard).toHaveBeenLastCalledWith(null);
    });
  });

  // =========================================================================
  // Challenge 2: Disabled Inspiration Card Clicks & Orientation Invariants
  // =========================================================================
  describe('Challenge 2: Disabled Inspiration Card Clicks & Orientation Invariants', () => {
    const verticesMusas: TipoMusa[] = ['TERPSICORE', 'ERATO', 'POLIMNIA', 'URANIA'];
    const ladosMusas: TipoMusa[] = ['CLIO', 'EUTERPE', 'TALIA', 'MELPOMENE', 'CALIOPE'];

    it('ADV-04: Blocks clicks and sets aria-disabled on all 4 VERTICES musas when solPos is at a side (1, 3, 5, 7)', () => {
      const oddSolPositions = [1, 3, 5, 7];

      verticesMusas.forEach((musa) => {
        oddSolPositions.forEach((solPos) => {
          const onSelectCard = vi.fn();
          const card: CartaInspiracion = {
            id: 200,
            tipoCarta: 'INSPIRACION',
            prioridad: 1,
            nombre: `Inspiración de ${musa}`,
            tipoMusa: musa,
            orientacion: 'VERTICES',
            usada: false,
          };

          const { unmount } = render(
            <InspirationCard
              card={card}
              solPos={solPos}
              onClick={onSelectCard}
            />
          );

          const btn = screen.getByRole('button');
          expect(btn).toHaveAttribute('aria-disabled', 'true');

          fireEvent.click(btn);
          expect(onSelectCard).not.toHaveBeenCalled();

          unmount();
        });
      });
    });

    it('ADV-05: Permits clicks and does not set aria-disabled on all 4 VERTICES musas when solPos is at a vertex (0, 2, 4, 6)', () => {
      const evenSolPositions = [0, 2, 4, 6];

      verticesMusas.forEach((musa) => {
        evenSolPositions.forEach((solPos) => {
          const onSelectCard = vi.fn();
          const card: CartaInspiracion = {
            id: 201,
            tipoCarta: 'INSPIRACION',
            prioridad: 1,
            nombre: `Inspiración de ${musa}`,
            tipoMusa: musa,
            orientacion: 'VERTICES',
            usada: false,
          };

          const { unmount } = render(
            <InspirationCard
              card={card}
              solPos={solPos}
              onClick={onSelectCard}
            />
          );

          const btn = screen.getByRole('button');
          expect(btn).not.toHaveAttribute('aria-disabled', 'true');

          fireEvent.click(btn);
          expect(onSelectCard).toHaveBeenCalledTimes(1);

          unmount();
        });
      });
    });

    it('ADV-06: Blocks clicks and sets aria-disabled on all 5 LADOS musas when solPos is at a vertex (0, 2, 4, 6)', () => {
      const evenSolPositions = [0, 2, 4, 6];

      ladosMusas.forEach((musa) => {
        evenSolPositions.forEach((solPos) => {
          const onSelectCard = vi.fn();
          const card: CartaInspiracion = {
            id: 300,
            tipoCarta: 'INSPIRACION',
            prioridad: 1,
            nombre: `Inspiración de ${musa}`,
            tipoMusa: musa,
            orientacion: 'LADOS',
            usada: false,
          };

          const { unmount } = render(
            <InspirationCard
              card={card}
              solPos={solPos}
              onClick={onSelectCard}
            />
          );

          const btn = screen.getByRole('button');
          expect(btn).toHaveAttribute('aria-disabled', 'true');

          fireEvent.click(btn);
          expect(onSelectCard).not.toHaveBeenCalled();

          unmount();
        });
      });
    });

    it('ADV-07: Inspiration card with usada=true is natively disabled and completely unclickable regardless of orientation', () => {
      const onSelectCard = vi.fn();
      const usedCard: CartaInspiracion = {
        id: 400,
        tipoCarta: 'INSPIRACION',
        prioridad: 1,
        nombre: 'Inspiración de Terpsícore',
        tipoMusa: 'TERPSICORE',
        orientacion: 'VERTICES',
        usada: true,
      };

      // SolPos = 0 is a valid vertex, but card is used
      render(
        <InspirationCard
          card={usedCard}
          solPos={0}
          onClick={onSelectCard}
        />
      );

      const btn = screen.getByRole('button');
      expect(btn).toBeDisabled();
      expect(screen.getByText(/usada/i)).toBeInTheDocument();

      fireEvent.click(btn);
      expect(onSelectCard).not.toHaveBeenCalled();
    });

    it('ADV-08: In PlayerHand, clicking a disabled inspiration card does not select it and Confirm button remains disabled', () => {
      const hand = createMockPlayerHand(1, 'TERPSICORE'); // TERPSICORE is VERTICES, solPos 1 is invalid
      const onSelectCard = vi.fn();
      const onConfirm = vi.fn();

      render(
        <PlayerHand
          cards={hand.allCards}
          solPos={1}
          selectedCard={null}
          onSelectCard={onSelectCard}
          onConfirm={onConfirm}
        />
      );

      const inspirationBtn = screen.getByRole('button', { name: /inspiración de terpsícore/i });
      fireEvent.click(inspirationBtn);

      expect(onSelectCard).not.toHaveBeenCalled();

      const confirmBtn = screen.getByRole('button', { name: /confirmar selección/i });
      expect(confirmBtn).toBeDisabled();

      fireEvent.click(confirmBtn);
      expect(onConfirm).not.toHaveBeenCalled();
    });
  });

  // =========================================================================
  // Challenge 3: Fallback Rendering When Images Fail to Load
  // =========================================================================
  describe('Challenge 3: Fallback Rendering When Images Fail to Load', () => {
    it('ADV-09: MusaCard unmounts broken img and renders MusaSvg vector fallback when onError fires for all 9 musas', () => {
      const allMusas: TipoMusa[] = [
        'CLIO', 'EUTERPE', 'TALIA', 'MELPOMENE', 'TERPSICORE',
        'ERATO', 'POLIMNIA', 'URANIA', 'CALIOPE',
      ];

      allMusas.forEach((musaName, idx) => {
        const musa = { id: idx + 1, nombre: musaName, tokensColocados: [] };
        const { unmount } = render(<MusaCard musa={musa} index={idx} />);

        const img = screen.getByRole('img', { name: musaName });
        expect(img).toBeInTheDocument();

        // Simulate image load error
        fireEvent.error(img);

        // Img should now be replaced by SVG fallback
        const fallbackContainer = screen.getByTestId(`musa-card-${idx}`).querySelector('[data-vector-fallback="true"]');
        expect(fallbackContainer).toBeInTheDocument();
        expect(fallbackContainer?.querySelector('svg')).toBeInTheDocument();

        unmount();
      });
    });

    it('ADV-10: AstroOrbit switches to AstroSvg fallback for Sun marker on error', () => {
      render(<AstroOrbit solPos={0} lunaPos={4} />);

      const solContainer = screen.getByLabelText('Astro Solar');
      const solImg = solContainer.querySelector('img');
      expect(solImg).toBeInTheDocument();

      fireEvent.error(solImg!);

      // Vector fallback SVG replaces img
      expect(solContainer.querySelector('img')).toBeNull();
      expect(solContainer.querySelector('svg')).toBeInTheDocument();
    });

    it('ADV-11: AstroOrbit switches to AstroSvg fallback for Moon marker on error', () => {
      render(<AstroOrbit solPos={0} lunaPos={4} />);

      const lunaContainer = screen.getByLabelText('Astro Lunar');
      const lunaImg = lunaContainer.querySelector('img');
      expect(lunaImg).toBeInTheDocument();

      fireEvent.error(lunaImg!);

      expect(lunaContainer.querySelector('img')).toBeNull();
      expect(lunaContainer.querySelector('svg')).toBeInTheDocument();
    });

    it('ADV-12: ActionCard renders ActionCardSvg fallback on img onError', () => {
      const actionCard: CartaAccion = {
        id: 101,
        tipoCarta: 'DEVOCION_SOL',
        prioridad: 2,
        nombre: 'Devoción Solar',
      };

      render(<ActionCard card={actionCard} />);

      const img = screen.getByRole('img', { name: 'Devoción Solar' });
      expect(img).toBeInTheDocument();

      fireEvent.error(img);

      const fallback = screen.getByTestId('action-card-101').querySelector('[data-vector-fallback="true"]');
      expect(fallback).toBeInTheDocument();
      expect(fallback?.querySelector('svg')).toBeInTheDocument();
    });

    it('ADV-13: InspirationCard renders InspirationCardSvg fallback on img onError', () => {
      const inspCard: CartaInspiracion = {
        id: 105,
        tipoCarta: 'INSPIRACION',
        prioridad: 1,
        nombre: 'Inspiración de Terpsícore',
        tipoMusa: 'TERPSICORE',
        orientacion: 'VERTICES',
        usada: false,
      };

      render(<InspirationCard card={inspCard} solPos={0} />);

      const img = screen.getByRole('img', { name: 'Inspiración de Terpsícore' });
      expect(img).toBeInTheDocument();

      fireEvent.error(img);

      const fallback = screen.getByTestId('action-card-105').querySelector('[data-vector-fallback="true"]');
      expect(fallback).toBeInTheDocument();
      expect(fallback?.querySelector('svg')).toBeInTheDocument();
    });
  });

  // =========================================================================
  // Challenge 4: 0-Token Reserve Condition Display in StatusPanel
  // =========================================================================
  describe('Challenge 4: 0-Token Reserve Condition Display in StatusPanel', () => {
    it('ADV-14: Exactly 0 tokens reserve renders data-reserve-exhausted="true" and red styling badge', () => {
      const partida = createMockPartida(5, 9);
      partida.jugadores[0] = createMockJugador(1, 'Apolo', 1, 0); // 0 remaining

      render(<StatusPanel partida={partida} />);

      const reserveBadge = screen.getByTestId('token-reserve-1');
      expect(reserveBadge).toHaveAttribute('data-reserve-exhausted', 'true');
      expect(reserveBadge).toHaveTextContent('0');
      expect(reserveBadge.className).toContain('text-red-400');
    });

    it('ADV-15: Non-zero token reserve does NOT have data-reserve-exhausted attribute', () => {
      const partida = createMockPartida(5, 9);
      partida.jugadores[0] = createMockJugador(1, 'Apolo', 1, 14);

      render(<StatusPanel partida={partida} />);

      const reserveBadge = screen.getByTestId('token-reserve-1');
      expect(reserveBadge).not.toHaveAttribute('data-reserve-exhausted');
      expect(reserveBadge).toHaveTextContent('14');
      expect(reserveBadge.className).not.toContain('text-red-400');
    });

    it('ADV-16: Multi-player setup with independent token reserves correctly distinguishes exhausted vs non-exhausted players', () => {
      const p1 = createMockJugador(1, 'Apolo', 1, 0); // Exhausted
      const p2 = createMockJugador(2, 'Atenea', 2, 8); // Active
      const p3 = createMockJugador(3, 'Hermes', 3, 0); // Exhausted

      const partida: any = {
        id: 1,
        rondaActual: 7,
        maxRondas: 9,
        tablero: createMockTablero(),
        jugadores: [p1, p2, p3],
      };

      render(<StatusPanel partida={partida} />);

      expect(screen.getByTestId('token-reserve-1')).toHaveAttribute('data-reserve-exhausted', 'true');
      expect(screen.getByTestId('token-reserve-1')).toHaveTextContent('0');

      expect(screen.getByTestId('token-reserve-2')).not.toHaveAttribute('data-reserve-exhausted');
      expect(screen.getByTestId('token-reserve-2')).toHaveTextContent('8');

      expect(screen.getByTestId('token-reserve-3')).toHaveAttribute('data-reserve-exhausted', 'true');
      expect(screen.getByTestId('token-reserve-3')).toHaveTextContent('0');
    });

    it('ADV-17: Empty tokens array [] and all placed tokens [colocado: true] both yield 0 tokens and exhausted attribute', () => {
      const p1 = createMockJugador(1, 'Apolo', 1, 0);
      p1.tokens = []; // Empty array

      const p2 = createMockJugador(2, 'Atenea', 2, 5);
      p2.tokens = [
        { id: 1, colocado: true, jugadorId: 2 },
        { id: 2, colocado: true, jugadorId: 2 },
      ]; // All colocado

      const partida: any = {
        id: 1,
        rondaActual: 3,
        maxRondas: 9,
        tablero: createMockTablero(),
        jugadores: [p1, p2],
      };

      render(<StatusPanel partida={partida} />);

      expect(screen.getByTestId('token-reserve-1')).toHaveAttribute('data-reserve-exhausted', 'true');
      expect(screen.getByTestId('token-reserve-1')).toHaveTextContent('0');

      expect(screen.getByTestId('token-reserve-2')).toHaveAttribute('data-reserve-exhausted', 'true');
      expect(screen.getByTestId('token-reserve-2')).toHaveTextContent('0');
    });

    it('ADV-18: Dynamic state update from 1 token to 0 triggers reactive transition to exhausted', () => {
      const partida = createMockPartida(4, 9);
      partida.jugadores[0] = createMockJugador(1, 'Apolo', 1, 1);

      const { rerender } = render(<StatusPanel partida={partida} />);

      expect(screen.getByTestId('token-reserve-1')).not.toHaveAttribute('data-reserve-exhausted');
      expect(screen.getByTestId('token-reserve-1')).toHaveTextContent('1');

      // Update state to 0 tokens
      const updatedPartida = createMockPartida(5, 9);
      updatedPartida.jugadores[0] = createMockJugador(1, 'Apolo', 1, 0);

      rerender(<StatusPanel partida={updatedPartida} />);

      expect(screen.getByTestId('token-reserve-1')).toHaveAttribute('data-reserve-exhausted', 'true');
      expect(screen.getByTestId('token-reserve-1')).toHaveTextContent('0');
    });
  });

  // =========================================================================
  // Challenge 5: All 8 Orbit Positions Mapped to Correct Grid Cells
  // =========================================================================
  describe('Challenge 5: All 8 Orbit Positions Mapped to Correct Grid Cells', () => {
    const EXPECTED_MAPPING: Record<number, number> = {
      0: 0, // Top-Left Vertex -> Cell 0
      1: 1, // Top Side         -> Cell 1
      2: 2, // Top-Right Vertex-> Cell 2
      3: 5, // Right Side       -> Cell 5
      4: 8, // Bot-Right Vertex-> Cell 8
      5: 7, // Bot Side         -> Cell 7
      6: 6, // Bot-Left Vertex -> Cell 6
      7: 3, // Left Side        -> Cell 3
    };

    it('ADV-19: mapAstroToGrid mathematically maps all 8 orbit positions (0..7) to exact grid cells', () => {
      for (let pos = 0; pos < 8; pos++) {
        expect(mapAstroToGrid(pos)).toBe(EXPECTED_MAPPING[pos]);
      }
    });

    it('ADV-20: Board highlights the exact mapped grid cell for DEVOCION_SOL across all 8 orbit positions', () => {
      const devSol: CartaAccion = { id: 101, tipoCarta: 'DEVOCION_SOL', prioridad: 2, nombre: 'Devoción Sol' };

      for (let pos = 0; pos < 8; pos++) {
        const targetCell = EXPECTED_MAPPING[pos];
        const tablero = createMockTablero({ solPos: pos, lunaPos: (pos + 4) % 8 });

        const { unmount } = render(<Board tablero={tablero} hoveredCard={devSol} />);

        // Expected cell MUST have highlight="sun"
        expect(screen.getByTestId(`musa-card-${targetCell}`)).toHaveAttribute('data-highlight', 'sun');

        // All other 8 cells must NOT have highlight="sun"
        for (let other = 0; other < 9; other++) {
          if (other !== targetCell) {
            expect(screen.getByTestId(`musa-card-${other}`)).not.toHaveAttribute('data-highlight', 'sun');
          }
        }

        unmount();
      }
    });

    it('ADV-21: Board highlights the exact mapped grid cell for DEVOCION_LUNA across all 8 orbit positions', () => {
      const devLuna: CartaAccion = { id: 102, tipoCarta: 'DEVOCION_LUNA', prioridad: 5, nombre: 'Devoción Luna' };

      for (let pos = 0; pos < 8; pos++) {
        const targetCell = EXPECTED_MAPPING[pos];
        const tablero = createMockTablero({ solPos: (pos + 4) % 8, lunaPos: pos });

        const { unmount } = render(<Board tablero={tablero} hoveredCard={devLuna} />);

        // Expected cell MUST have highlight="moon"
        expect(screen.getByTestId(`musa-card-${targetCell}`)).toHaveAttribute('data-highlight', 'moon');

        // All other 8 cells must NOT have highlight="moon"
        for (let other = 0; other < 9; other++) {
          if (other !== targetCell) {
            expect(screen.getByTestId(`musa-card-${other}`)).not.toHaveAttribute('data-highlight', 'moon');
          }
        }

        unmount();
      }
    });

    it('ADV-22: Modular arithmetic handles wrap-around (> 7) and negative orbit positions cleanly', () => {
      // 8 % 8 = 0 -> maps to 0
      expect(mapAstroToGrid(8)).toBe(0);
      // 9 % 8 = 1 -> maps to 1
      expect(mapAstroToGrid(9)).toBe(1);
      // 15 % 8 = 7 -> maps to 3
      expect(mapAstroToGrid(15)).toBe(3);
      // -1 maps to pos 7 -> Cell 3
      expect(mapAstroToGrid(-1)).toBe(3);
      // -8 maps to pos 0 -> Cell 0
      expect(mapAstroToGrid(-8)).toBe(0);

      // Verify Board rendering with wrapped solPos = 11 (11 % 8 = 3 -> target 5)
      const tablero = createMockTablero({ solPos: 11, lunaPos: 15 });
      const devSol: CartaAccion = { id: 101, tipoCarta: 'DEVOCION_SOL', prioridad: 2, nombre: 'Dev Sol' };
      render(<Board tablero={tablero} hoveredCard={devSol} />);

      expect(screen.getByTestId('musa-card-5')).toHaveAttribute('data-highlight', 'sun');
    });

    it('ADV-23: AstroOrbit renders Sun and Moon in their exact respective perimeter slots 0..7', () => {
      for (let s = 0; s < 8; s++) {
        const l = (s + 4) % 8;
        const { unmount } = render(<AstroOrbit solPos={s} lunaPos={l} />);

        const solSlot = screen.getByTestId(`astro-slot-${s}`);
        expect(solSlot).toContainElement(screen.getByLabelText(/astro solar/i));

        const lunaSlot = screen.getByTestId(`astro-slot-${l}`);
        expect(lunaSlot).toContainElement(screen.getByLabelText(/astro lunar/i));

        unmount();
      }
    });
  });
});
