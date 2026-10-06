/**
 * Authoritative Mock Domain Data for Muses Frontend & E2E Testing
 * Grounded in backend domain models (Tablero, Musa, Jugador, Token, Carta).
 */

export type TipoMusa =
  | 'CLIO'
  | 'EUTERPE'
  | 'TALIA'
  | 'MELPOMENE'
  | 'TERPSICORE'
  | 'ERATO'
  | 'POLIMNIA'
  | 'URANIA'
  | 'CALIOPE';

export type TipoCarta =
  | 'DEVOCION_SOL'
  | 'DEVOCION_LUNA'
  | 'REVOLUCION_SOL'
  | 'REVOLUCION_LUNA'
  | 'INSPIRACION';

export interface Token {
  id: number;
  colocado: boolean;
  jugadorId: number;
}

export interface Musa {
  id: number;
  nombre: TipoMusa;
  tokensColocados: Token[];
  nivel1: number;
  nivel2: number;
  nivel3: number;
}

export interface Tablero {
  id: number;
  solPos: number; // 0 to 7
  lunaPos: number; // (solPos + 4) % 8
  grid: Musa[]; // exactly 9 musas in row-major order
}

export interface CartaBase {
  id: number;
  tipoCarta: TipoCarta;
  prioridad: number;
  nombre: string;
}

export interface CartaAccion extends CartaBase {
  tipoCarta: 'DEVOCION_SOL' | 'DEVOCION_LUNA' | 'REVOLUCION_SOL' | 'REVOLUCION_LUNA';
}

export interface CartaInspiracion extends CartaBase {
  tipoCarta: 'INSPIRACION';
  tipoMusa: TipoMusa;
  nombreMusa?: TipoMusa;
  orientacion: 'LADOS' | 'VERTICES';
  usada: boolean;
}

export interface Jugador {
  id: number;
  nombre: string;
  numeroJugador: number;
  puntuacionTotal: number;
  tokens: Token[];
  cartaInspiracion: CartaInspiracion;
}

export interface Partida {
  id: number;
  rondaActual: number;
  maxRondas: number;
  duracionTotal?: number;
  tablero: Tablero;
  jugadores: Jugador[];
  ganadores: { id: number; username: string }[];
  seleccionesRonda?: Record<number, number>;
}

export interface ScoreBreakdownItem {
  tokens: number;
  points: number;
}

export type ScoreBreakdown = Record<TipoMusa, Record<string, ScoreBreakdownItem>>;

export const MUSA_POINT_TIERS: Record<TipoMusa, { nivel1: number; nivel2: number; nivel3: number; orientacion: 'LADOS' | 'VERTICES' }> = {
  CLIO: { nivel1: 7, nivel2: 5, nivel3: 3, orientacion: 'LADOS' },
  EUTERPE: { nivel1: 7, nivel2: 6, nivel3: 5, orientacion: 'LADOS' },
  TALIA: { nivel1: 8, nivel2: 6, nivel3: 4, orientacion: 'LADOS' },
  MELPOMENE: { nivel1: 9, nivel2: 6, nivel3: 3, orientacion: 'LADOS' },
  TERPSICORE: { nivel1: 5, nivel2: 4, nivel3: 3, orientacion: 'VERTICES' },
  ERATO: { nivel1: 7, nivel2: 4, nivel3: 1, orientacion: 'VERTICES' },
  POLIMNIA: { nivel1: 6, nivel2: 5, nivel3: 4, orientacion: 'VERTICES' },
  URANIA: { nivel1: 6, nivel2: 4, nivel3: 2, orientacion: 'VERTICES' },
  CALIOPE: { nivel1: 8, nivel2: 5, nivel3: 2, orientacion: 'LADOS' },
};

export const createMockTablero = (overrides?: Partial<Tablero>): Tablero => {
  const defaultMusas: TipoMusa[] = [
    'CLIO', 'EUTERPE', 'TALIA',
    'MELPOMENE', 'TERPSICORE', 'ERATO',
    'POLIMNIA', 'URANIA', 'CALIOPE',
  ];

  const grid: Musa[] = defaultMusas.map((nombre, index) => ({
    id: index + 1,
    nombre,
    tokensColocados: [],
    ...MUSA_POINT_TIERS[nombre],
  }));

  return {
    id: 1,
    solPos: 0,
    lunaPos: 4,
    grid,
    ...overrides,
  };
};

export const createMockPlayerHand = (solPos = 0, unusedInspirationMusa: TipoMusa = 'TERPSICORE') => {
  const commonCards: CartaAccion[] = [
    { id: 101, tipoCarta: 'DEVOCION_SOL', prioridad: 2, nombre: 'Devoción Solar' },
    { id: 102, tipoCarta: 'DEVOCION_LUNA', prioridad: 5, nombre: 'Devoción Lunar' },
    { id: 103, tipoCarta: 'REVOLUCION_SOL', prioridad: 3, nombre: 'Revolución Solar' },
    { id: 104, tipoCarta: 'REVOLUCION_LUNA', prioridad: 4, nombre: 'Revolución Lunar' },
  ];

  const inspirationCard: CartaInspiracion = {
    id: 105,
    tipoCarta: 'INSPIRACION',
    prioridad: 1,
    nombre: `Inspiración de ${unusedInspirationMusa}`,
    tipoMusa: unusedInspirationMusa,
    nombreMusa: unusedInspirationMusa,
    orientacion: MUSA_POINT_TIERS[unusedInspirationMusa].orientacion,
    usada: false,
  };

  return {
    commonCards,
    inspirationCard,
    allCards: [...commonCards, inspirationCard],
  };
};

export const createMockJugador = (id = 1, nombre = 'Jugador 1', num = 1, tokensRemaining = 20): Jugador => {
  const tokens: Token[] = Array.from({ length: tokensRemaining }, (_, i) => ({
    id: id * 100 + i,
    colocado: false,
    jugadorId: id,
  }));

  const { inspirationCard } = createMockPlayerHand(0, num === 1 ? 'TERPSICORE' : 'TALIA');

  return {
    id,
    nombre,
    numeroJugador: num,
    puntuacionTotal: 0,
    tokens,
    cartaInspiracion: inspirationCard,
  };
};

export const createMockPartida = (rondaActual = 1, maxRondas = 9): Partida => {
  const j1 = createMockJugador(1, 'Apolo', 1, 20);
  const j2 = createMockJugador(2, 'Atenea', 2, 20);

  return {
    id: 10,
    rondaActual,
    maxRondas,
    tablero: createMockTablero({ solPos: (rondaActual - 1) % 8, lunaPos: (rondaActual + 3) % 8 }),
    jugadores: [j1, j2],
    ganadores: [],
  };
};

export const createMockScoreBreakdown = (): ScoreBreakdown => ({
  CLIO: { Apolo: { tokens: 3, points: 7 }, Atenea: { tokens: 1, points: 5 } },
  EUTERPE: { Apolo: { tokens: 2, points: 6 }, Atenea: { tokens: 4, points: 7 } },
  TALIA: { Apolo: { tokens: 4, points: 7 }, Atenea: { tokens: 4, points: 7 } }, // Tie for 1st
  MELPOMENE: { Apolo: { tokens: 5, points: 9 }, Atenea: { tokens: 2, points: 6 } },
  TERPSICORE: { Apolo: { tokens: 1, points: 4 }, Atenea: { tokens: 3, points: 5 } },
  ERATO: { Apolo: { tokens: 0, points: 0 }, Atenea: { tokens: 2, points: 7 } },
  POLIMNIA: { Apolo: { tokens: 2, points: 6 }, Atenea: { tokens: 0, points: 0 } },
  URANIA: { Apolo: { tokens: 3, points: 6 }, Atenea: { tokens: 1, points: 4 } },
  CALIOPE: { Apolo: { tokens: 1, points: 5 }, Atenea: { tokens: 2, points: 8 } },
});
