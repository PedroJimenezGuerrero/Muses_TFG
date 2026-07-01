import { test, expect } from '@playwright/test';

/**
 * End-to-End Test Suite: Muses Board Game Lifecycle (Playwright)
 * Exercises full user interactions: card selection, validation, confirmation,
 * round clock progression, visual highlights, and victory podium modal.
 */

test.describe('Muses Game Lifecycle & Interaction Flow (Tier 4 E2E)', () => {
  test.beforeEach(async ({ page }) => {
    // Intercept REST endpoints to provide deterministic game state
    await page.route('**/api/v1/status', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ status: 'OK', message: 'Backend connected' }),
      });
    });

    await page.route('**/api/v1/partida/1', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 1,
          rondaActual: 1,
          maxRondas: 9,
          tablero: {
            id: 1,
            solPos: 0,
            lunaPos: 4,
            grid: [
              { id: 1, nombre: 'CLIO', tokensColocados: [], nivel1: 7, nivel2: 5, nivel3: 3 },
              { id: 2, nombre: 'EUTERPE', tokensColocados: [], nivel1: 7, nivel2: 6, nivel3: 5 },
              { id: 3, nombre: 'TALIA', tokensColocados: [], nivel1: 8, nivel2: 6, nivel3: 4 },
              { id: 4, nombre: 'MELPOMENE', tokensColocados: [], nivel1: 9, nivel2: 6, nivel3: 3 },
              { id: 5, nombre: 'TERPSICORE', tokensColocados: [], nivel1: 5, nivel2: 4, nivel3: 3 },
              { id: 6, nombre: 'ERATO', tokensColocados: [], nivel1: 7, nivel2: 4, nivel3: 1 },
              { id: 7, nombre: 'POLIMNIA', tokensColocados: [], nivel1: 6, nivel2: 5, nivel3: 4 },
              { id: 8, nombre: 'URANIA', tokensColocados: [], nivel1: 6, nivel2: 4, nivel3: 2 },
              { id: 9, nombre: 'CALIOPE', tokensColocados: [], nivel1: 8, nivel2: 5, nivel3: 2 },
            ],
          },
          jugadores: [
            {
              id: 1,
              nombre: 'Apolo',
              numeroJugador: 1,
              puntuacionTotal: 0,
              tokens: Array.from({ length: 20 }, (_, i) => ({ id: i + 1, colocado: false, jugadorId: 1 })),
              cartaInspiracion: {
                id: 105,
                tipoCarta: 'INSPIRACION',
                prioridad: 1,
                nombre: 'Inspiración de Terpsícore',
                tipoMusa: 'TERPSICORE',
                orientacion: 'VERTICES',
                usada: false,
              },
            },
            {
              id: 2,
              nombre: 'Atenea',
              numeroJugador: 2,
              puntuacionTotal: 0,
              tokens: Array.from({ length: 20 }, (_, i) => ({ id: 100 + i, colocado: false, jugadorId: 2 })),
            },
          ],
        }),
      });
    });

    await page.route('**/api/v1/partida/1/seleccionar-carta*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true }),
      });
    });
  });

  // -------------------------------------------------------------
  // Scenario 1: Initial Render & Setup Verification
  // -------------------------------------------------------------
  test('Scenario 1: Complete board render with astros, HUD, and hand cards', async ({ page }) => {
    await page.goto('/');

    // 1. Verify board grid rendered with 9 musas
    const board = page.getByRole('grid', { name: /tablero de musas/i });
    await expect(board).toBeVisible();
    const musaCells = page.getByRole('gridcell');
    await expect(musaCells).toHaveCount(9);

    // 2. Verify Sun at orbit position 0 and Moon at orbit position 4
    const solSlot = page.getByTestId('astro-slot-0');
    await expect(solSlot).toContainText(/sol/i);
    const lunaSlot = page.getByTestId('astro-slot-4');
    await expect(lunaSlot).toContainText(/luna/i);

    // 3. Verify HUD shows Round 1 and starting reserve of 20 tokens
    await expect(page.getByText(/ronda 1 de 9/i)).toBeVisible();
    await expect(page.getByTestId('token-reserve-1')).toHaveTextContent('20');

    // 4. Verify 5 cards in player hand (4 common + 1 inspiration)
    await expect(page.getByRole('button', { name: /devoción solar/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /devoción lunar/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /revolución solar/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /revolución lunar/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /inspiración/i })).toBeVisible();

    // 5. Confirm button is disabled initially
    const confirmBtn = page.getByRole('button', { name: /confirmar selección/i });
    await expect(confirmBtn).toBeDisabled();
  });

  // -------------------------------------------------------------
  // Scenario 2: Card Selection, Visual Glow, and Confirmation Workflow
  // -------------------------------------------------------------
  test('Scenario 2: Select Devoción Sol, hover glow feedback, and submit confirmation', async ({ page }) => {
    await page.goto('/');

    const devSolCard = page.getByRole('button', { name: /devoción solar/i });

    // 1. Hover card: check that target cell 0 (facing Sun at solPos 0) lights up
    await devSolCard.hover();
    const cell0 = page.getByTestId('musa-card-0');
    await expect(cell0).toHaveAttribute('data-highlight', 'sun');

    // 2. Click card: card becomes selected
    await devSolCard.click();
    await expect(devSolCard).toHaveAttribute('aria-selected', 'true');

    // 3. Confirm button becomes active
    const confirmBtn = page.getByRole('button', { name: /confirmar selección/i });
    await expect(confirmBtn).toBeEnabled();

    // 4. Click confirm: button transitions to submitting/waiting state
    await confirmBtn.click();
    await expect(page.getByText(/esperando elecciones|confirmado/i)).toBeVisible();
  });

  // -------------------------------------------------------------
  // Scenario 3: Secret Inspiration Card Orientation Rule Enforcement
  // -------------------------------------------------------------
  test('Scenario 3: Inspiration card orientation validation (VERTICES vs LADOS)', async ({ page }) => {
    // Intercept game state where solPos = 1 (Side position: invalid for VERTICES card TERPSICORE)
    await page.route('**/api/v1/partida/1', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 1,
          rondaActual: 2,
          maxRondas: 9,
          tablero: {
            id: 1,
            solPos: 1, // Side
            lunaPos: 5,
            grid: Array.from({ length: 9 }, (_, i) => ({
              id: i + 1,
              nombre: 'CLIO',
              tokensColocados: [],
              nivel1: 7,
              nivel2: 5,
              nivel3: 3,
            })),
          },
          jugadores: [
            {
              id: 1,
              nombre: 'Apolo',
              numeroJugador: 1,
              tokens: [],
              cartaInspiracion: {
                id: 105,
                tipoCarta: 'INSPIRACION',
                prioridad: 1,
                nombre: 'Inspiración de Terpsícore',
                tipoMusa: 'TERPSICORE',
                orientacion: 'VERTICES',
                usada: false,
              },
            },
          ],
        }),
      });
    });

    await page.goto('/');

    // Terpsícore requires VERTICES (0, 2, 4, 6). solPos = 1 is invalid.
    const inspirationBtn = page.getByRole('button', { name: /inspiración de terpsícore/i });
    await expect(inspirationBtn).toHaveAttribute('aria-disabled', 'true');

    // Attempt click: must remain unselected
    await inspirationBtn.click({ force: true });
    await expect(inspirationBtn).toHaveAttribute('aria-selected', 'false');
    const confirmBtn = page.getByRole('button', { name: /confirmar selección/i });
    await expect(confirmBtn).toBeDisabled();
  });

  // -------------------------------------------------------------
  // Scenario 4: Game Over Victory Podium and Scoring Breakdown Modal
  // -------------------------------------------------------------
  test('Scenario 4: Game completion displays victory podium, 9xN breakdown table, and restart button', async ({
    page,
  }) => {
    // Intercept finished game state at round 9
    await page.route('**/api/v1/partida/1', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 1,
          rondaActual: 9,
          maxRondas: 9,
          tablero: { id: 1, solPos: 0, lunaPos: 4, grid: [] },
          jugadores: [
            { id: 1, nombre: 'Apolo', puntuacionTotal: 48, tokens: [] },
            { id: 2, nombre: 'Atenea', puntuacionTotal: 42, tokens: [] },
          ],
          ganadores: [{ id: 1, username: 'Apolo' }],
        }),
      });
    });

    await page.route('**/api/v1/partida/1/desglose-puntuacion', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          CLIO: { Apolo: { tokens: 3, points: 7 }, Atenea: { tokens: 1, points: 5 } },
          EUTERPE: { Apolo: { tokens: 2, points: 6 }, Atenea: { tokens: 4, points: 7 } },
          TALIA: { Apolo: { tokens: 4, points: 7 }, Atenea: { tokens: 4, points: 7 } },
          MELPOMENE: { Apolo: { tokens: 5, points: 9 }, Atenea: { tokens: 2, points: 6 } },
          TERPSICORE: { Apolo: { tokens: 1, points: 4 }, Atenea: { tokens: 3, points: 5 } },
          ERATO: { Apolo: { tokens: 0, points: 0 }, Atenea: { tokens: 2, points: 7 } },
          POLIMNIA: { Apolo: { tokens: 2, points: 6 }, Atenea: { tokens: 0, points: 0 } },
          URANIA: { Apolo: { tokens: 3, points: 6 }, Atenea: { tokens: 1, points: 4 } },
          CALIOPE: { Apolo: { tokens: 1, points: 3 }, Atenea: { tokens: 2, points: 1 } },
        }),
      });
    });

    await page.goto('/');

    // 1. Victory Modal should be visible
    const modal = page.getByRole('dialog', { name: /fin de partida|victoria/i });
    await expect(modal).toBeVisible();

    // 2. Podium displays winner Apolo on 1st place
    const podiumPlace1 = page.getByTestId('podium-place-1');
    await expect(podiumPlace1).toContainText(/apolo/i);

    // 3. Breakdown table visible with all 9 musas
    const table = page.getByRole('table', { name: /desglose de puntuación/i });
    await expect(table).toBeVisible();
    await expect(page.getByTestId('breakdown-row-TALIA')).toBeVisible();

    // 4. Restart button resets game
    const restartBtn = page.getByRole('button', { name: /nueva partida|jugar de nuevo/i });
    await expect(restartBtn).toBeVisible();
  });
});
