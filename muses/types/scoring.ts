/**
 * Scoring Breakdown Types for Feature F24: Game-Over Summary Modal & Victory Podium.
 */

import { TipoMusa } from './game';

export interface PlayerScoreEntry {
  jugadorId: number;
  nombreJugador: string;
  numeroJugador: number;
  tokensColocados: number;
  puntosObtenidos: number;
  rangoMusa?: 1 | 2 | 3 | null; // 1st, 2nd, 3rd place on this specific muse
  empateInfo?: string; // Optional explanation (e.g. "Empate 1º puesto: ⌊(8+6)/2⌋ = 7 pts")
}

export interface MuseScoreRow {
  musa: TipoMusa;
  displayName: string;
  puntuacionPorJugador: Record<number, PlayerScoreEntry>; // Keyed by jugadorId
}

export interface PlayerTotalScore {
  jugadorId: number;
  nombreJugador: string;
  numeroJugador: number;
  totalTokensColocados: number;
  totalPuntos: number;
  posicionPodio: number; // 1, 2, 3...
  esGanador: boolean;
}

export interface ScoreBreakdownItem {
  tokens: number;
  points: number;
}

export type ScoreBreakdownMap = Record<TipoMusa, Record<string, ScoreBreakdownItem>>;

export interface ScoreBreakdown {
  partidaId?: number;
  filas?: MuseScoreRow[];
  totalesPorJugador?: PlayerTotalScore[];
  ganadores?: PlayerTotalScore[];
  matrix?: ScoreBreakdownMap;
  totals?: { jugadorId: number; nombre: string; puntos: number }[];
  winners?: string[];
  [key: string]: any;
}

