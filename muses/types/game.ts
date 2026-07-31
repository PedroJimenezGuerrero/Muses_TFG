/**
 * TypeScript domain models for Muses Board Game.
 * Aligned with Spring Boot backend entities.
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

export type TipoInspiracion = 'LADOS' | 'VERTICES';

export type TipoAccion =
  | 'DEVOCION_SOL'
  | 'REVOLUCION_SOL'
  | 'REVOLUCION_LUNA'
  | 'DEVOCION_LUNA';

export interface Token {
  id?: number;
  colocado: boolean;
  jugador?: Jugador;
}

export interface Musa {
  id?: number;
  nombre: TipoMusa;
  tokensColocados: Token[];
}

export interface Tablero {
  id?: number;
  solPos: number; // 0..7 perimeter ring
  lunaPos: number; // 0..7 perimeter ring
  grid: Musa[]; // 9 cells in 3x3 layout
}

export interface CartaBase {
  id?: number;
  nombre?: string;
  descripcion?: string;
  tipoCarta?: 'ACCION' | 'INSPIRACION';
}

export interface CartaAccion extends CartaBase {
  tipoCarta?: 'ACCION';
  tipo: TipoAccion;
}

export interface CartaInspiracion extends CartaBase {
  tipoCarta?: 'INSPIRACION';
  nombreMusa: TipoMusa;
  usada: boolean;
}

export type AnyCard = CartaAccion | CartaInspiracion;

export interface Usuario {
  id?: number;
  username: string;
  nombre?: string;
  email?: string;
}

export interface Jugador {
  id?: number;
  nombre: string;
  numeroJugador: number; // 1-indexed (1..5)
  puntuacionTotal: number;
  cartaInspiracion?: CartaInspiracion;
  tokens?: Token[];
  usuario?: Usuario;
}

export interface Partida {
  id?: number;
  rondaActual: number;
  maxRondas: number;
  duracionTotal?: number;
  fechaInicio?: string;
  fechaFin?: string;
  tablero: Tablero;
  jugadores: Jugador[];
  ganadores?: Usuario[];
  seleccionesRonda?: Record<number, number>; // jugadorId -> cartaId
  version?: number;
}

export type PartidaState = Partida;

/**
 * Static metadata for the 9 Greek Muses.
 */
export interface MusaMetadata {
  nombre: TipoMusa;
  displayName: string;
  domain: string;
  nivel1: number;
  nivel2: number;
  nivel3: number;
  tipoInspiracion: TipoInspiracion;
  symbol: string;
}

export const MUSAS_METADATA: Record<TipoMusa, MusaMetadata> = {
  CLIO: {
    nombre: 'CLIO',
    displayName: 'Clío',
    domain: 'Musa de la Historia',
    nivel1: 7,
    nivel2: 5,
    nivel3: 3,
    tipoInspiracion: 'LADOS',
    symbol: 'Pergamino histórico',
  },
  EUTERPE: {
    nombre: 'EUTERPE',
    displayName: 'Euterpe',
    domain: 'Musa de la Música',
    nivel1: 7,
    nivel2: 6,
    nivel3: 5,
    tipoInspiracion: 'LADOS',
    symbol: 'Flauta doble (Aulós)',
  },
  TALIA: {
    nombre: 'TALIA',
    displayName: 'Talía',
    domain: 'Musa de la Comedia',
    nivel1: 8,
    nivel2: 6,
    nivel3: 4,
    tipoInspiracion: 'LADOS',
    symbol: 'Máscara cómica',
  },
  MELPOMENE: {
    nombre: 'MELPOMENE',
    displayName: 'Melpómene',
    domain: 'Musa de la Tragedia',
    nivel1: 9,
    nivel2: 6,
    nivel3: 3,
    tipoInspiracion: 'LADOS',
    symbol: 'Máscara trágica',
  },
  TERPSICORE: {
    nombre: 'TERPSICORE',
    displayName: 'Terpsícore',
    domain: 'Musa de la Danza',
    nivel1: 5,
    nivel2: 4,
    nivel3: 3,
    tipoInspiracion: 'VERTICES',
    symbol: 'Lira y calzado de danza',
  },
  ERATO: {
    nombre: 'ERATO',
    displayName: 'Érato',
    domain: 'Musa de la Poesía Lírica y Amorosa',
    nivel1: 7,
    nivel2: 4,
    nivel3: 1,
    tipoInspiracion: 'VERTICES',
    symbol: 'Cítara del amor',
  },
  POLIMNIA: {
    nombre: 'POLIMNIA',
    displayName: 'Polimnia',
    domain: 'Musa de los Himnos Sagrados',
    nivel1: 6,
    nivel2: 5,
    nivel3: 4,
    tipoInspiracion: 'VERTICES',
    symbol: 'Velo de meditación y laurel',
  },
  URANIA: {
    nombre: 'URANIA',
    displayName: 'Urania',
    domain: 'Musa de la Astronomía',
    nivel1: 6,
    nivel2: 4,
    nivel3: 2,
    tipoInspiracion: 'VERTICES',
    symbol: 'Esfera celeste y compás',
  },
  CALIOPE: {
    nombre: 'CALIOPE',
    displayName: 'Calíope',
    domain: 'Musa de la Poesía Épica',
    nivel1: 8,
    nivel2: 5,
    nivel3: 2,
    tipoInspiracion: 'LADOS',
    symbol: 'Tablilla encerada y estilo',
  },
};

export const ACCIONES_METADATA: Record<TipoAccion, { nombre: string; prioridad: number; descripcion: string }> = {
  DEVOCION_SOL: {
    nombre: 'Devoción Solar',
    prioridad: 2,
    descripcion: 'Coloca 2 fichas de devoción en la musa iluminada por el Sol.',
  },
  REVOLUCION_SOL: {
    nombre: 'Revolución Solar',
    prioridad: 3,
    descripcion: 'Mueve la musa central a la posición solar y rota 6 musas en sentido horario.',
  },
  REVOLUCION_LUNA: {
    nombre: 'Revolución Lunar',
    prioridad: 4,
    descripcion: 'Mueve la musa central a la posición lunar y rota 6 musas en sentido horario.',
  },
  DEVOCION_LUNA: {
    nombre: 'Devoción Lunar',
    prioridad: 5,
    descripcion: 'Coloca 2 fichas de devoción en la musa iluminada por la Luna.',
  },
};
