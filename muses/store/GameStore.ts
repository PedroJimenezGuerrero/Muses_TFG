import { makeAutoObservable } from 'mobx';
import {
  Tablero,
  Partida,
  Jugador,
  TipoMusa,
  AnyCard,
  CartaAccion,
  CartaInspiracion,
  MUSAS_METADATA,
} from '@/types/game';
import {
  mapAstroToGrid,
  advanceAstros,
  applyRevolution,
  getInspirationTargetCells,
} from '@/lib/gameRules';

const INITIAL_MUSAS: TipoMusa[] = [
  'CLIO',
  'EUTERPE',
  'TALIA',
  'MELPOMENE',
  'TERPSICORE',
  'ERATO',
  'POLIMNIA',
  'URANIA',
  'CALIOPE',
];

function buildInitialState(): {
  tablero: Tablero;
  partida: Partida;
  cards: (CartaAccion | CartaInspiracion)[];
} {
  const grid = INITIAL_MUSAS.map((nombre, i) => ({
    id: i + 1,
    nombre,
    tokensColocados: [],
  }));

  const initialTablero: Tablero = {
    id: 1,
    solPos: 0,
    lunaPos: 4,
    grid,
  };

  const jugador1: Jugador = {
    id: 1,
    nombre: 'Apolo',
    numeroJugador: 1,
    puntuacionTotal: 0,
    tokens: Array.from({ length: 20 }, (_, idx) => ({
      id: 100 + idx,
      colocado: false,
      jugador: { id: 1, nombre: 'Apolo', numeroJugador: 1, puntuacionTotal: 0 },
    })),
  };

  const jugador2: Jugador = {
    id: 2,
    nombre: 'Atenea',
    numeroJugador: 2,
    puntuacionTotal: 0,
    tokens: Array.from({ length: 20 }, (_, idx) => ({
      id: 200 + idx,
      colocado: false,
      jugador: { id: 2, nombre: 'Atenea', numeroJugador: 2, puntuacionTotal: 0 },
    })),
  };

  const initialPartida: Partida = {
    id: 1,
    rondaActual: 1,
    maxRondas: 9,
    tablero: initialTablero,
    jugadores: [jugador1, jugador2],
    ganadores: [],
  };

  const commonActions: CartaAccion[] = [
    { id: 101, tipo: 'DEVOCION_SOL', tipoCarta: 'ACCION', nombre: 'Devoción Solar' },
    { id: 102, tipo: 'DEVOCION_LUNA', tipoCarta: 'ACCION', nombre: 'Devoción Lunar' },
    { id: 103, tipo: 'REVOLUCION_SOL', tipoCarta: 'ACCION', nombre: 'Revolución Solar' },
    { id: 104, tipo: 'REVOLUCION_LUNA', tipoCarta: 'ACCION', nombre: 'Revolución Lunar' },
  ];

  const inspirationCard: CartaInspiracion = {
    id: 105,
    tipoCarta: 'INSPIRACION',
    nombreMusa: 'TERPSICORE',
    usada: false,
    nombre: 'Inspiración de Terpsícore',
  };

  return {
    tablero: initialTablero,
    partida: initialPartida,
    cards: [...commonActions, inspirationCard],
  };
}

export class GameStore {
  tablero: Tablero | null = null;
  partida: Partida | null = null;
  cards: (CartaAccion | CartaInspiracion)[] = [];
  selectedCard: AnyCard | null = null;
  hoveredCard: AnyCard | null = null;
  isSubmitting: boolean = false;
  isConnected: boolean = true;
  notification: string | null = null;
  isGameOver: boolean = false;

  constructor() {
    makeAutoObservable(this);
  }

  // ─── Actions ────────────────────────────────────────────────────────────────

  initGame() {
    const state = buildInitialState();
    this.tablero = state.tablero;
    this.partida = state.partida;
    this.cards = state.cards;
    this.selectedCard = null;
    this.hoveredCard = null;
    this.isSubmitting = false;
    this.isGameOver = false;
    this.notification = null;
  }

  resetGame() {
    this.initGame();
    this.setNotification('Partida reiniciada.');
    setTimeout(() => this.setNotification(null), 2500);
  }

  selectCard(card: AnyCard | null) {
    if (card === null) {
      this.selectedCard = null;
      return;
    }
    this.selectedCard = this.selectedCard?.id === card.id ? null : card;
  }

  hoverCard(card: AnyCard | null) {
    this.hoveredCard = card;
  }

  setNotification(msg: string | null) {
    this.notification = msg;
  }

  setConnected(val: boolean) {
    this.isConnected = val;
  }

  executeAction(cardToPlay?: AnyCard) {
    const card = cardToPlay || this.selectedCard;
    if (!card || this.isSubmitting || !this.tablero || !this.partida) return;

    this.isSubmitting = true;
    this.setNotification(`Ejecutando ${card.nombre || 'Acción'}...`);

    setTimeout(() => {
      if (!this.tablero || !this.partida) return;

      const currentTablero = this.tablero;
      const currentPartida = this.partida;
      const currentCards = [...this.cards];
      const activePlayer = currentPartida.jugadores[0]; // Active player: Apolo

      let updatedGrid = [...currentTablero.grid];
      let tokensToDeduct = 0;

      const cardType = (card as any).tipo || (card as any).tipoCarta;

      if (cardType === 'DEVOCION_SOL') {
        const targetIndex = mapAstroToGrid(currentTablero.solPos);
        tokensToDeduct = 2;
        const newTokens = Array.from({ length: 2 }, (_, i) => ({
          id: Date.now() + i,
          colocado: true,
          jugador: activePlayer,
          jugadorId: activePlayer.id,
        }));
        updatedGrid = updatedGrid.map((m, idx) =>
          idx === targetIndex
            ? { ...m, tokensColocados: [...m.tokensColocados, ...newTokens] }
            : m
        );
      } else if (cardType === 'DEVOCION_LUNA') {
        const targetIndex = mapAstroToGrid(currentTablero.lunaPos);
        tokensToDeduct = 2;
        const newTokens = Array.from({ length: 2 }, (_, i) => ({
          id: Date.now() + i,
          colocado: true,
          jugador: activePlayer,
          jugadorId: activePlayer.id,
        }));
        updatedGrid = updatedGrid.map((m, idx) =>
          idx === targetIndex
            ? { ...m, tokensColocados: [...m.tokensColocados, ...newTokens] }
            : m
        );
      } else if (cardType === 'REVOLUCION_SOL') {
        tokensToDeduct = 1;
        const newToken = {
          id: Date.now(),
          colocado: true,
          jugador: activePlayer,
          jugadorId: activePlayer.id,
        };
        updatedGrid = updatedGrid.map((m, idx) =>
          idx === 4 ? { ...m, tokensColocados: [...m.tokensColocados, newToken] } : m
        );
        updatedGrid = applyRevolution(updatedGrid, currentTablero.solPos);
      } else if (cardType === 'REVOLUCION_LUNA') {
        tokensToDeduct = 1;
        const newToken = {
          id: Date.now(),
          colocado: true,
          jugador: activePlayer,
          jugadorId: activePlayer.id,
        };
        updatedGrid = updatedGrid.map((m, idx) =>
          idx === 4 ? { ...m, tokensColocados: [...m.tokensColocados, newToken] } : m
        );
        updatedGrid = applyRevolution(updatedGrid, currentTablero.lunaPos);
      } else if (
        cardType === 'INSPIRACION' ||
        (card as any).tipoMusa ||
        (card as any).nombreMusa
      ) {
        const musaName = ((card as any).tipoMusa || (card as any).nombreMusa) as TipoMusa;
        const targetCells = getInspirationTargetCells(musaName, currentTablero.solPos);
        tokensToDeduct = targetCells.length * 2;
        targetCells.forEach((targetIndex) => {
          const newTokens = Array.from({ length: 2 }, (_, i) => ({
            id: Date.now() + targetIndex * 10 + i,
            colocado: true,
            jugador: activePlayer,
            jugadorId: activePlayer.id,
          }));
          updatedGrid = updatedGrid.map((m, idx) =>
            idx === targetIndex
              ? { ...m, tokensColocados: [...m.tokensColocados, ...newTokens] }
              : m
          );
        });

        const cardIdx = currentCards.findIndex((c) => c.id === card.id);
        if (cardIdx !== -1) {
          currentCards[cardIdx] = { ...currentCards[cardIdx], usada: true } as CartaInspiracion;
        }
      }

      const { solPos: nextSol, lunaPos: nextLuna } = advanceAstros(
        currentTablero.solPos,
        currentTablero.lunaPos
      );

      const updatedJugadores = currentPartida.jugadores.map((j, i) => {
        if (i === 0 && j.tokens) {
          return { ...j, tokens: j.tokens.slice(tokensToDeduct) };
        }
        return j;
      });

      const nextRound = Math.min(currentPartida.rondaActual + 1, currentPartida.maxRondas);

      this.tablero = {
        ...currentTablero,
        solPos: nextSol,
        lunaPos: nextLuna,
        grid: updatedGrid,
      };

      this.partida = {
        ...currentPartida,
        rondaActual: nextRound,
        tablero: this.tablero,
        jugadores: updatedJugadores,
      };

      this.cards = currentCards;
      this.selectedCard = null;
      this.hoveredCard = null;
      this.isSubmitting = false;
      this.setNotification('¡Acción resuelta con éxito! Astros han avanzado.');
      setTimeout(() => this.setNotification(null), 3000);
    }, 600);
  }
}

export const gameStore = new GameStore();
