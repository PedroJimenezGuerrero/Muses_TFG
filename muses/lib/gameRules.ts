/**
 * Core Game Rules & Geometry Utilities for Muses Board Game.
 * Aligned strictly with Reglas.pdf and Spring Boot backend logic.
 */

import { TipoAccion, TipoInspiracion, TipoMusa } from '@/types/game';

/**
 * 8-Position Perimeter Orbit:
 *   Pos 0 (Top-Left)    Pos 1 (Top-Mid)    Pos 2 (Top-Right)
 *   Pos 7 (Mid-Left)                       Pos 3 (Mid-Right)
 *   Pos 6 (Bot-Left)    Pos 5 (Bot-Mid)    Pos 4 (Bot-Right)
 *
 * 3x3 Board Grid (Row-Major):
 *   Cell 0 (0,0)  Cell 1 (0,1)  Cell 2 (0,2)
 *   Cell 3 (1,0)  Cell 4 (1,1)  Cell 5 (1,2) [Cell 4 = Center]
 *   Cell 6 (2,0)  Cell 7 (2,1)  Cell 8 (2,2)
 */

/**
 * Maps an astro orbit perimeter position (0-7) to adjacent 3x3 grid index (0-8).
 */
export function mapAstroToGrid(astroPos: number): number {
  switch (((astroPos % 8) + 8) % 8) {
    case 0:
      return 0; // Top-Left Vertex
    case 1:
      return 1; // Top Side
    case 2:
      return 2; // Top-Right Vertex
    case 3:
      return 5; // Right Side
    case 4:
      return 8; // Bottom-Right Vertex
    case 5:
      return 7; // Bottom Side
    case 6:
      return 6; // Bottom-Left Vertex
    case 7:
      return 3; // Left Side
    default:
      throw new Error(`Invalid astro position: ${astroPos}`);
  }
}

/**
 * Computes the diametrically opposite astro position in the 8-slot ring.
 */
export function getOppositeAstroPos(pos: number): number {
  return (pos + 4) % 8;
}

/**
 * Clockwise step for Sun and Moon at end of round.
 */
export function advanceAstros(solPos: number, lunaPos: number): { solPos: number; lunaPos: number } {
  const nextSol = (solPos + 1) % 8;
  const nextLuna = (nextSol + 4) % 8;
  return { solPos: nextSol, lunaPos: nextLuna };
}

/**
 * Revolution 6-cell clockwise cycles for each astro position (0-7).
 * Format: [start at center 4, moves to target astro, ..., returns to 4].
 */
export const REVOLUTION_CYCLES: Record<number, number[]> = {
  0: [4, 0, 1, 2, 5, 8], // Diagonal dominant upper
  1: [4, 1, 2, 5, 8, 7], // Vertical right
  2: [4, 2, 5, 8, 7, 6], // Diagonal secondary lower
  3: [4, 5, 8, 7, 6, 3], // Horizontal lower (cells: 4, 5, 8, 7, 6, 3)
  4: [4, 8, 7, 6, 3, 0], // Diagonal dominant lower
  5: [4, 7, 6, 3, 0, 1], // Vertical left
  6: [4, 6, 3, 0, 1, 2], // Diagonal secondary upper
  7: [4, 3, 0, 1, 2, 5], // Horizontal upper (cells: 4, 3, 0, 1, 2, 5)
};

/**
 * The 3 cells that remain stationary during revolution around each astro position.
 */
export const REVOLUTION_STATIONARY: Record<number, number[]> = {
  0: [3, 6, 7],
  1: [0, 3, 6],
  2: [0, 1, 3],
  3: [0, 1, 2],
  4: [1, 2, 5],
  5: [2, 5, 8],
  6: [5, 7, 8],
  7: [6, 7, 8],
};

/**
 * Pure function applying 6-muse clockwise rotation to a 9-element grid.
 */
export function applyRevolution<T>(grid: T[], astroPos: number): T[] {
  if (grid.length !== 9) throw new Error('Grid must contain exactly 9 cells.');
  const newGrid = [...grid];
  const cycle = REVOLUTION_CYCLES[astroPos];
  if (!cycle) throw new Error(`Invalid astro position: ${astroPos}`);

  // In clockwise rotation: cycle[0] -> cycle[1], cycle[1] -> cycle[2], ... cycle[last] -> cycle[0]
  const temp = grid[cycle[cycle.length - 1]];
  for (let i = cycle.length - 1; i > 0; i--) {
    newGrid[cycle[i]] = grid[cycle[i - 1]];
  }
  newGrid[cycle[0]] = temp;

  return newGrid;
}

/**
 * Returns grid cell indices targeted by an inspiration card given the current Sun position.
 * Returns empty array if Sun orientation is invalid for this muse.
 */
export function getInspirationTargetCells(musa: TipoMusa, solPos: number): number[] {
  const normSol = ((solPos % 8) + 8) % 8;
  switch (musa) {
    case 'CLIO': // LADOS (1, 3, 5, 7)
      if (normSol === 1) return [5];
      if (normSol === 3) return [7];
      if (normSol === 5) return [3];
      if (normSol === 7) return [1];
      return [];

    case 'CALIOPE': // LADOS (1, 3, 5, 7)
      if (normSol === 1 || normSol === 5) return [6, 2];
      if (normSol === 3 || normSol === 7) return [0, 8];
      return [];

    case 'ERATO': // VERTICES (0, 2, 4, 6)
      if (normSol === 0) return [6];
      if (normSol === 2) return [0];
      if (normSol === 4) return [2];
      if (normSol === 6) return [8];
      return [];

    case 'EUTERPE': // LADOS (1, 3, 5, 7)
      if (normSol === 1) return [8];
      if (normSol === 3) return [6];
      if (normSol === 5) return [0];
      if (normSol === 7) return [2];
      return [];

    case 'MELPOMENE': // LADOS (1, 3, 5, 7)
      if (normSol === 1) return [3];
      if (normSol === 3) return [1];
      if (normSol === 5) return [5];
      if (normSol === 7) return [7];
      return [];

    case 'POLIMNIA': // VERTICES (0, 2, 4, 6)
      if (normSol === 0) return [2];
      if (normSol === 2) return [8];
      if (normSol === 4) return [6];
      if (normSol === 6) return [0];
      return [];

    case 'TALIA': // LADOS (1, 3, 5, 7)
      if (normSol === 1) return [0];
      if (normSol === 3) return [2];
      if (normSol === 5) return [8];
      if (normSol === 7) return [6];
      return [];

    case 'TERPSICORE': // VERTICES (0, 2, 4, 6)
      if (normSol === 0) return [5];
      if (normSol === 2) return [7];
      if (normSol === 4) return [3];
      if (normSol === 6) return [1];
      return [];

    case 'URANIA': // VERTICES (0, 2, 4, 6)
      if (normSol === 0) return [3];
      if (normSol === 2) return [1];
      if (normSol === 4) return [5];
      if (normSol === 6) return [7];
      return [];

    default:
      return [];
  }
}

/**
 * Validates whether an inspiration card can be played in current board state.
 */
export function canPlayInspirationCard(
  tipoInspiracion: TipoInspiracion,
  solPos: number,
  usada: boolean
): { canPlay: boolean; reason?: string } {
  if (usada) {
    return { canPlay: false, reason: 'Esta carta de inspiración ya ha sido usada en esta partida.' };
  }
  const isVertices = solPos % 2 === 0;
  if (tipoInspiracion === 'VERTICES' && !isVertices) {
    return { canPlay: false, reason: 'Requiere que el Sol esté en un vértice (posiciones 0, 2, 4, 6).' };
  }
  if (tipoInspiracion === 'LADOS' && isVertices) {
    return { canPlay: false, reason: 'Requiere que el Sol esté en un lado (posiciones 1, 3, 5, 7).' };
  }
  return { canPlay: true };
}

/**
 * Calculates affected musa cell indices when previewing / executing an action.
 */
export function getAffectedMusasForAction(
  accion: TipoAccion,
  solPos: number,
  lunaPos: number
): {
  primaryTarget: number;
  affectedIndices: number[];
  cycleIndices?: number[];
  tokensToAdd: number;
} {
  switch (accion) {
    case 'DEVOCION_SOL': {
      const target = mapAstroToGrid(solPos);
      return {
        primaryTarget: target,
        affectedIndices: [target],
        tokensToAdd: 2,
      };
    }
    case 'DEVOCION_LUNA': {
      const target = mapAstroToGrid(lunaPos);
      return {
        primaryTarget: target,
        affectedIndices: [target],
        tokensToAdd: 2,
      };
    }
    case 'REVOLUCION_SOL': {
      const target = mapAstroToGrid(solPos);
      const cycle = REVOLUTION_CYCLES[solPos];
      return {
        primaryTarget: 4, // Center muse receives token and moves to target
        affectedIndices: cycle,
        cycleIndices: cycle,
        tokensToAdd: 1,
      };
    }
    case 'REVOLUCION_LUNA': {
      const target = mapAstroToGrid(lunaPos);
      const cycle = REVOLUTION_CYCLES[lunaPos];
      return {
        primaryTarget: 4, // Center muse receives token and moves to target
        affectedIndices: cycle,
        cycleIndices: cycle,
        tokensToAdd: 1,
      };
    }
  }
}
