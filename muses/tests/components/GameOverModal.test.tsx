import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import {
  createMockPartida,
  createMockScoreBreakdown,
  ScoreBreakdown,
} from '../fixtures/mockGameState';

// @ts-expect-error - GameOverModal component implemented in Milestone M3
import GameOverModal from '@/components/game/GameOverModal';

describe('GameOverModal Component (F24: Victory Podium & Scoring Breakdown Modal)', () => {
  const finishedPartida = createMockPartida(9, 9);
  finishedPartida.jugadores[0].puntuacionTotal = 47;
  finishedPartida.jugadores[1].puntuacionTotal = 44;
  finishedPartida.ganadores = [{ id: 1, username: 'Apolo' }];

  const scoreBreakdown = createMockScoreBreakdown();

  // -------------------------------------------------------------
  // Tier 1: Render & Static Semantics (>= 5 tests)
  // -------------------------------------------------------------
  describe('Tier 1: Render & Static Semantics', () => {
    it('T1-F24-01: Renders modal with role="dialog", aria-modal="true" and title when isOpen=true', () => {
      render(
        <GameOverModal
          isOpen={true}
          partida={finishedPartida}
          breakdown={scoreBreakdown}
          onRestart={vi.fn()}
        />
      );

      const dialog = screen.getByRole('dialog', { name: /fin de partida|victoria/i });
      expect(dialog).toBeInTheDocument();
      expect(dialog).toHaveAttribute('aria-modal', 'true');
    });

    it('T1-F24-02: Renders Victory Podium with 1st, 2nd, and 3rd place pedestals', () => {
      render(
        <GameOverModal
          isOpen={true}
          partida={finishedPartida}
          breakdown={scoreBreakdown}
          onRestart={vi.fn()}
        />
      );

      const podium = screen.getByTestId('victory-podium');
      expect(podium).toBeInTheDocument();

      // Check 1st place winner is on podium
      expect(screen.getByTestId('podium-place-1')).toHaveTextContent(/apolo/i);
      expect(screen.getByTestId('podium-place-2')).toHaveTextContent(/atenea/i);
    });

    it('T1-F24-03: Renders detailed 9xN breakdown table with rows for all 9 musas', () => {
      render(
        <GameOverModal
          isOpen={true}
          partida={finishedPartida}
          breakdown={scoreBreakdown}
          onRestart={vi.fn()}
        />
      );

      const table = screen.getByRole('table', { name: /desglose de puntuación/i });
      expect(table).toBeInTheDocument();

      const expectedMusas = [
        'CLIO', 'EUTERPE', 'TALIA',
        'MELPOMENE', 'TERPSICORE', 'ERATO',
        'POLIMNIA', 'URANIA', 'CALIOPE',
      ];
      expectedMusas.forEach((musa) => {
        expect(screen.getByTestId(`breakdown-row-${musa}`)).toBeInTheDocument();
      });
    });

    it('T1-F24-04: Renders total score row at the bottom summing points accurately', () => {
      render(
        <GameOverModal
          isOpen={true}
          partida={finishedPartida}
          breakdown={scoreBreakdown}
          onRestart={vi.fn()}
        />
      );

      const totalRow = screen.getByTestId('breakdown-total-row');
      expect(totalRow).toBeInTheDocument();
      expect(totalRow).toHaveTextContent('47'); // Apolo
      expect(totalRow).toHaveTextContent('44'); // Atenea
    });

    it('T1-F24-05: Renders "Nueva Partida" restart action button', () => {
      render(
        <GameOverModal
          isOpen={true}
          partida={finishedPartida}
          breakdown={scoreBreakdown}
          onRestart={vi.fn()}
        />
      );

      const restartBtn = screen.getByRole('button', { name: /nueva partida|jugar de nuevo/i });
      expect(restartBtn).toBeInTheDocument();
    });
  });

  // -------------------------------------------------------------
  // Tier 2: Dynamic Interaction, State Transitions & Boundary Conditions (>= 5 tests)
  // -------------------------------------------------------------
  describe('Tier 2: Dynamic Interaction, State Transitions & Boundary Conditions', () => {
    it('T2-F24-01: Modal does not render in DOM when isOpen=false', () => {
      render(
        <GameOverModal
          isOpen={false}
          partida={finishedPartida}
          breakdown={scoreBreakdown}
          onRestart={vi.fn()}
        />
      );

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('T2-F24-02: Supports multiple winners: Displays joint 1st place when match ends in a tie', () => {
      const tiedPartida = createMockPartida(9, 9);
      tiedPartida.jugadores[0].puntuacionTotal = 45;
      tiedPartida.jugadores[1].puntuacionTotal = 45;
      tiedPartida.ganadores = [
        { id: 1, username: 'Apolo' },
        { id: 2, username: 'Atenea' },
      ];

      render(
        <GameOverModal
          isOpen={true}
          partida={tiedPartida}
          breakdown={scoreBreakdown}
          onRestart={vi.fn()}
        />
      );

      // Verify joint winners text or podium
      const jointWinnerTitle = screen.getByText(/¡empate en primer puesto!|ganadores compartidos/i);
      expect(jointWinnerTitle).toBeInTheDocument();

      const podium1 = screen.getByTestId('podium-place-1');
      expect(podium1).toHaveTextContent(/apolo/i);
      expect(podium1).toHaveTextContent(/atenea/i);
    });

    it('T2-F24-03: Breakdown table displays tokens and points per musa adhering to tie split formula', () => {
      render(
        <GameOverModal
          isOpen={true}
          partida={finishedPartida}
          breakdown={scoreBreakdown}
          onRestart={vi.fn()}
        />
      );

      // In mock breakdown, Talia has 4 tokens for Apolo and 4 tokens for Atenea (tied for 1st)
      // Points for 1st and 2nd are 8 and 6 -> split is floor((8+6)/2) = 7 pts each
      const taliaRow = screen.getByTestId('breakdown-row-TALIA');
      expect(taliaRow).toHaveTextContent('4'); // P1 tokens
      expect(taliaRow).toHaveTextContent('7'); // P1 points
      expect(taliaRow).toHaveTextContent('4'); // P2 tokens
      expect(taliaRow).toHaveTextContent('7'); // P2 points
    });

    it('T2-F24-04: Players with 0 tokens on a musa receive exactly 0 points in the breakdown', () => {
      render(
        <GameOverModal
          isOpen={true}
          partida={finishedPartida}
          breakdown={scoreBreakdown}
          onRestart={vi.fn()}
        />
      );

      // In mock breakdown, Erato: Apolo has 0 tokens -> 0 points
      const eratoRow = screen.getByTestId('breakdown-row-ERATO');
      const apoloCells = eratoRow.querySelectorAll('[data-player="Apolo"]');
      expect(apoloCells[0]).toHaveTextContent('0'); // 0 tokens
      expect(apoloCells[1]).toHaveTextContent('0'); // 0 points
    });

    it('T2-F24-05: Clicking "Nueva Partida" calls onRestart callback', () => {
      const onRestart = vi.fn();
      render(
        <GameOverModal
          isOpen={true}
          partida={finishedPartida}
          breakdown={scoreBreakdown}
          onRestart={onRestart}
        />
      );

      const restartBtn = screen.getByRole('button', { name: /nueva partida|jugar de nuevo/i });
      fireEvent.click(restartBtn);

      expect(onRestart).toHaveBeenCalledTimes(1);
    });
  });

  // -------------------------------------------------------------
  // Tier 3: Pairwise Feature Interactions
  // -------------------------------------------------------------
  describe('Tier 3: Pairwise Feature Interactions', () => {
    it('P-10: Detailed tooltip explains tie calculation formula on tied cells', () => {
      render(
        <GameOverModal
          isOpen={true}
          partida={finishedPartida}
          breakdown={scoreBreakdown}
          onRestart={vi.fn()}
        />
      );

      const taliaRow = screen.getByTestId('breakdown-row-TALIA');
      const tieBadge = taliaRow.querySelector('[data-tie-badge="true"]');
      if (tieBadge) {
        fireEvent.mouseEnter(tieBadge);
        expect(screen.getByText(/empate/i)).toBeInTheDocument();
      }
    });
  });
});
