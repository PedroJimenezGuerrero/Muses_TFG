import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { createMockJugador, createMockPartida } from '../fixtures/mockGameState';

import StatusPanel from '@/components/game/StatusPanel';

describe('StatusPanel Component (F23: Game Status, Round HUD & Token Reserves)', () => {
  const defaultPartida = createMockPartida(1, 9);

  // -------------------------------------------------------------
  // Tier 1: Render & Static Semantics (>= 5 tests)
  // -------------------------------------------------------------
  describe('Tier 1: Render & Static Semantics', () => {
    it('T1-F23-01: Renders status panel container with role="region" and accessible label', () => {
      render(
        <StatusPanel
          partida={defaultPartida}
          isConnected={true}
          waitingForPlayers={false}
        />
      );

      const statusRegion = screen.getByRole('region', { name: /estado de partida/i });
      expect(statusRegion).toBeInTheDocument();
    });

    it('T1-F23-02: Displays current round text indicator (e.g. "Ronda 1 de 9")', () => {
      render(
        <StatusPanel
          partida={defaultPartida}
          isConnected={true}
          waitingForPlayers={false}
        />
      );

      expect(screen.getByText(/ronda 1 de 9/i)).toBeInTheDocument();
    });

    it('T1-F23-03: Renders 9 visual round progression nodes in the timeline', () => {
      render(
        <StatusPanel
          partida={defaultPartida}
          isConnected={true}
          waitingForPlayers={false}
        />
      );

      const roundNodes = screen.getAllByTestId(/^round-step-/);
      expect(roundNodes).toHaveLength(9);
      expect(roundNodes[0]).toHaveAttribute('data-active', 'true');
      expect(roundNodes[1]).toHaveAttribute('data-active', 'false');
    });

    it('T1-F23-04: Displays player devotion token reserves for each player', () => {
      render(
        <StatusPanel
          partida={defaultPartida}
          isConnected={true}
          waitingForPlayers={false}
        />
      );

      // 2 players in defaultPartida: Apolo and Atenea
      expect(screen.getByText(/apolo/i)).toBeInTheDocument();
      expect(screen.getByText(/atenea/i)).toBeInTheDocument();
      const reserves = screen.getAllByTestId(/^token-reserve-/);
      expect(reserves).toHaveLength(2);
      expect(reserves[0]).toHaveTextContent('20');
      expect(reserves[1]).toHaveTextContent('20');
    });

    it('T1-F23-05: Displays active connection status indicator', () => {
      render(
        <StatusPanel
          partida={defaultPartida}
          isConnected={true}
          waitingForPlayers={false}
        />
      );

      const statusBadge = screen.getByTestId('connection-status');
      expect(statusBadge).toHaveTextContent(/conectado/i);
    });
  });

  // -------------------------------------------------------------
  // Tier 2: Dynamic State Transitions & Boundary Conditions (>= 5 tests)
  // -------------------------------------------------------------
  describe('Tier 2: Dynamic Interaction, State Transitions & Boundary Conditions', () => {
    it('T2-F23-01: Dynamically increments round counter and advances active step on state update', () => {
      const { rerender } = render(
        <StatusPanel
          partida={defaultPartida}
          isConnected={true}
          waitingForPlayers={false}
        />
      );

      expect(screen.getByText(/ronda 1 de 9/i)).toBeInTheDocument();

      // Advance to round 5
      const partidaRound5 = createMockPartida(5, 9);
      rerender(
        <StatusPanel
          partida={partidaRound5}
          isConnected={true}
          waitingForPlayers={false}
        />
      );

      expect(screen.getByText(/ronda 5 de 9/i)).toBeInTheDocument();
      expect(screen.getByTestId('round-step-5')).toHaveAttribute('data-active', 'true');
    });

    it('T2-F23-02: Decrements player token reserves in real time when tokens are placed', () => {
      const updatedPartida = createMockPartida(1, 9);
      // P1 has placed 4 tokens, 16 remaining
      updatedPartida.jugadores[0] = createMockJugador(1, 'Apolo', 1, 16);

      render(
        <StatusPanel
          partida={updatedPartida}
          isConnected={true}
          waitingForPlayers={false}
        />
      );

      const p1Reserve = screen.getByTestId('token-reserve-1');
      expect(p1Reserve).toHaveTextContent('16');
    });

    it('T2-F23-03: Displays "Esperando jugadores..." turn status banner when selections are pending', () => {
      render(
        <StatusPanel
          partida={defaultPartida}
          isConnected={true}
          waitingForPlayers={true}
        />
      );

      expect(screen.getByText(/esperando elecciones de los jugadores/i)).toBeInTheDocument();
    });

    it('T2-F23-04: Boundary condition: Token reserve reaches 0 without displaying negative numbers', () => {
      const exhaustedPartida = createMockPartida(8, 9);
      exhaustedPartida.jugadores[0] = createMockJugador(1, 'Apolo', 1, 0);

      render(
        <StatusPanel
          partida={exhaustedPartida}
          isConnected={true}
          waitingForPlayers={false}
        />
      );

      const p1Reserve = screen.getByTestId('token-reserve-1');
      expect(p1Reserve).toHaveTextContent('0');
      expect(p1Reserve).toHaveAttribute('data-reserve-exhausted', 'true');
    });

    it('T2-F23-05: Displays prominent "¡Última Ronda!" banner when rondaActual === 9', () => {
      const finalRoundPartida = createMockPartida(9, 9);

      render(
        <StatusPanel
          partida={finalRoundPartida}
          isConnected={true}
          waitingForPlayers={false}
        />
      );

      expect(screen.getByText(/¡última ronda!/i)).toBeInTheDocument();
    });

    it('T2-F23-06: Displays "Reconectando..." warning badge when isConnected is false', () => {
      render(
        <StatusPanel
          partida={defaultPartida}
          isConnected={false}
          waitingForPlayers={false}
        />
      );

      const statusBadge = screen.getByTestId('connection-status');
      expect(statusBadge).toHaveTextContent(/reconectando/i);
    });
  });

  // -------------------------------------------------------------
  // Tier 3: Pairwise Feature Interactions
  // -------------------------------------------------------------
  describe('Tier 3: Pairwise Feature Interactions', () => {
    it('P-05: Player token reserve color theme matches player token styling on board', () => {
      render(
        <StatusPanel
          partida={defaultPartida}
          isConnected={true}
          waitingForPlayers={false}
        />
      );

      // Player 1 color class or data attribute
      const p1Badge = screen.getByTestId('player-badge-1');
      expect(p1Badge).toHaveAttribute('data-player-color', 'gold');

      // Player 2 color class or data attribute
      const p2Badge = screen.getByTestId('player-badge-2');
      expect(p2Badge).toHaveAttribute('data-player-color', 'blue');
    });
  });
});
