/**
 * Preload all static game assets (card artwork, muse portraits, celestial astros)
 * so that board transitions and card flips render instantly without network latency.
 */

const GAME_ASSETS = [
  '/assets/astros/sol.png',
  '/assets/astros/luna.png',
  '/assets/cards/devocion_sol.png',
  '/assets/cards/devocion_luna.png',
  '/assets/cards/revolucion_sol.png',
  '/assets/cards/revolucion_luna.png',
  '/assets/cards/inspiracion_clio.png',
  '/assets/cards/inspiracion_euterpe.png',
  '/assets/cards/inspiracion_talia.png',
  '/assets/cards/inspiracion_melpomene.png',
  '/assets/cards/inspiracion_terpsicore.png',
  '/assets/cards/inspiracion_erato.png',
  '/assets/cards/inspiracion_polimnia.png',
  '/assets/cards/inspiracion_urania.png',
  '/assets/cards/inspiracion_caliope.png',
  '/assets/musas/clio.png',
  '/assets/musas/euterpe.png',
  '/assets/musas/talia.png',
  '/assets/musas/melpomene.png',
  '/assets/musas/terpsicore.png',
  '/assets/musas/erato.png',
  '/assets/musas/polimnia.png',
  '/assets/musas/urania.png',
  '/assets/musas/caliope.png',
];

let preloaded = false;

export function preloadGameAssets() {
  if (typeof window === 'undefined' || preloaded) return;
  preloaded = true;

  GAME_ASSETS.forEach((src) => {
    const img = new Image();
    img.src = src;
  });
}
