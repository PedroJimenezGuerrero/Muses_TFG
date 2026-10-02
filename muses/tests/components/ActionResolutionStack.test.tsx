import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ActionResolutionStack } from '@/components/game/ActionResolutionStack';
import { PlannedAction } from '@/store/GameStore';

describe('ActionResolutionStack Component', () => {
  it('renders null when there are no current or pending actions', () => {
    const { container } = render(
      <ActionResolutionStack currentAction={null} pendingActions={[]} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders current active action with player name, card title and priority', () => {
    const currentAction: PlannedAction = {
      jugador: { id: 1, nombre: 'Apolo (Tú)', numeroJugador: 1, puntuacionTotal: 0 },
      jugadorId: 1,
      jugadorNumero: 1,
      jugadorNombre: 'Apolo (Tú)',
      cartaNombre: 'Devoción Solar',
      tipoAccion: 'DEVOCION_SOL',
      prioridad: 2,
    };

    render(
      <ActionResolutionStack currentAction={currentAction} pendingActions={[]} />
    );

    expect(screen.getByTestId('action-resolution-stack')).toBeInTheDocument();
    expect(screen.getByText('Apolo (Tú)')).toBeInTheDocument();
    expect(screen.getByText('Devoción Solar')).toBeInTheDocument();
    expect(screen.getByText(/Prio 2/i)).toBeInTheDocument();
  });

  it('renders pending actions stacked beneath the active action', () => {
    const currentAction: PlannedAction = {
      jugador: { id: 1, nombre: 'Apolo', numeroJugador: 1, puntuacionTotal: 0 },
      jugadorId: 1,
      jugadorNumero: 1,
      jugadorNombre: 'Apolo',
      cartaNombre: 'Devoción Solar',
      tipoAccion: 'DEVOCION_SOL',
      prioridad: 2,
    };

    const pendingActions: PlannedAction[] = [
      {
        jugador: { id: 2, nombre: 'Atenea', numeroJugador: 2, puntuacionTotal: 0 },
        jugadorId: 2,
        jugadorNumero: 2,
        jugadorNombre: 'Atenea',
        cartaNombre: 'Revolución Solar',
        tipoAccion: 'REVOLUCION_SOL',
        prioridad: 3,
      },
      {
        jugador: { id: 3, nombre: 'Hermes', numeroJugador: 3, puntuacionTotal: 0 },
        jugadorId: 3,
        jugadorNumero: 3,
        jugadorNombre: 'Hermes',
        cartaNombre: 'Devoción Lunar',
        tipoAccion: 'DEVOCION_LUNA',
        prioridad: 5,
      },
    ];

    render(
      <ActionResolutionStack currentAction={currentAction} pendingActions={pendingActions} />
    );

    expect(screen.getByText('Apolo')).toBeInTheDocument();
    expect(screen.getByText('Atenea')).toBeInTheDocument();
    expect(screen.getByText('Hermes')).toBeInTheDocument();
    expect(screen.getByText(/• Revolución Solar/i)).toBeInTheDocument();
    expect(screen.getByText(/• Devoción Lunar/i)).toBeInTheDocument();
  });
});
