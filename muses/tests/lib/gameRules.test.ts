import { describe, it, expect } from 'vitest';
import {
  mapAstroToGrid,
  getOppositeAstroPos,
  advanceAstros,
  applyRevolution,
  canPlayInspirationCard,
  getInspirationTargetCells,
  getAffectedMusasForAction,
  REVOLUTION_CYCLES,
} from '@/lib/gameRules';

describe('Game Rules Utilities', () => {
  it('maps all 8 perimeter astro orbit positions to the correct 3x3 grid cells', () => {
    expect(mapAstroToGrid(0)).toBe(0);
    expect(mapAstroToGrid(1)).toBe(1);
    expect(mapAstroToGrid(2)).toBe(2);
    expect(mapAstroToGrid(3)).toBe(5);
    expect(mapAstroToGrid(4)).toBe(8);
    expect(mapAstroToGrid(5)).toBe(7);
    expect(mapAstroToGrid(6)).toBe(6);
    expect(mapAstroToGrid(7)).toBe(3);
  });

  it('guarantees diametrically opposite astro position', () => {
    for (let pos = 0; pos < 8; pos++) {
      const opp = getOppositeAstroPos(pos);
      expect((pos + 4) % 8).toBe(opp);
      expect(getOppositeAstroPos(opp)).toBe(pos);
    }
  });

  it('advances astros 1 step clockwise maintaining opposition', () => {
    const { solPos, lunaPos } = advanceAstros(0, 4);
    expect(solPos).toBe(1);
    expect(lunaPos).toBe(5);

    const wrap = advanceAstros(7, 3);
    expect(wrap.solPos).toBe(0);
    expect(wrap.lunaPos).toBe(4);
  });

  it('rotates 6-cell closed cycle during revolution and keeps 3 stationary', () => {
    // Initial identity grid [0, 1, 2, 3, 4, 5, 6, 7, 8]
    const grid = [0, 1, 2, 3, 4, 5, 6, 7, 8];
    // Pos 1 (Top-Mid): cycle [4, 1, 2, 5, 8, 7] -> stationary are [0, 3, 6] (left column)
    const rotated = applyRevolution(grid, 1);

    expect(rotated[0]).toBe(0); // stationary
    expect(rotated[3]).toBe(3); // stationary
    expect(rotated[6]).toBe(6); // stationary

    // 4 moved to 1
    expect(rotated[1]).toBe(4);
    // 1 moved to 2
    expect(rotated[2]).toBe(1);
    // 2 moved to 5
    expect(rotated[5]).toBe(2);
    // 5 moved to 8
    expect(rotated[8]).toBe(5);
    // 8 moved to 7
    expect(rotated[7]).toBe(8);
    // 7 moved to 4
    expect(rotated[4]).toBe(7);
  });

  it('validates inspiration card playability based on Sun orientation', () => {
    // VERTICES card: valid only on 0, 2, 4, 6
    expect(canPlayInspirationCard('VERTICES', 0, false).canPlay).toBe(true);
    expect(canPlayInspirationCard('VERTICES', 2, false).canPlay).toBe(true);
    expect(canPlayInspirationCard('VERTICES', 1, false).canPlay).toBe(false);

    // LADOS card: valid only on 1, 3, 5, 7
    expect(canPlayInspirationCard('LADOS', 1, false).canPlay).toBe(true);
    expect(canPlayInspirationCard('LADOS', 3, false).canPlay).toBe(true);
    expect(canPlayInspirationCard('LADOS', 0, false).canPlay).toBe(false);

    // Already used card
    expect(canPlayInspirationCard('LADOS', 1, true).canPlay).toBe(false);
  });

  it('calculates inspiration targets matching official rules', () => {
    // Clio (Lados): sol=1 -> 5, sol=3 -> 7, sol=5 -> 3, sol=7 -> 1
    expect(getInspirationTargetCells('CLIO', 1)).toEqual([5]);
    expect(getInspirationTargetCells('CLIO', 3)).toEqual([7]);
    expect(getInspirationTargetCells('CLIO', 0)).toEqual([]); // Invalid sun pos

    // Caliope (Lados): sol in {1,5} -> [6, 2]; sol in {3,7} -> [0, 8]
    expect(getInspirationTargetCells('CALIOPE', 1)).toEqual([6, 2]);
    expect(getInspirationTargetCells('CALIOPE', 3)).toEqual([0, 8]);

    // Erato (Vertices): sol=0 -> 6, sol=2 -> 0, sol=4 -> 2, sol=6 -> 8
    expect(getInspirationTargetCells('ERATO', 0)).toEqual([6]);
    expect(getInspirationTargetCells('ERATO', 2)).toEqual([0]);
  });

  it('returns affected musas for Devocion and Revolucion actions', () => {
    const devSol = getAffectedMusasForAction('DEVOCION_SOL', 0, 4);
    expect(devSol.primaryTarget).toBe(0);
    expect(devSol.tokensToAdd).toBe(2);

    const devLuna = getAffectedMusasForAction('DEVOCION_LUNA', 0, 4);
    expect(devLuna.primaryTarget).toBe(8); // mapAstroToGrid(4) = 8
    expect(devLuna.tokensToAdd).toBe(2);

    const revSol = getAffectedMusasForAction('REVOLUCION_SOL', 0, 4);
    expect(revSol.primaryTarget).toBe(4); // Center receives token
    expect(revSol.affectedIndices).toEqual(REVOLUTION_CYCLES[0]);
    expect(revSol.tokensToAdd).toBe(1);
  });
});
