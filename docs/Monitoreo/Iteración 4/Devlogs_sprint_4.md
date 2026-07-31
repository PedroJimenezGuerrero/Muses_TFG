# Devlogs Sprint 4

## Devlog 1: 18/05/2026

- Se ha definido la arquitectura del frontend para la Iteración 4. El proyecto usa Next.js 16, React 19, TypeScript y Tailwind CSS v4.
- Se ha decidido usar MobX (`mobx` + `mobx-react-lite`) como gestor de estado global para eliminar el prop-drilling existente en `page.tsx`. Se descartó Redux por su boilerplate excesivo y Context API por el coste de re-renders.
- Se ha planificado la estructura de carpetas: `store/` para el `GameStore`, `hooks/` para el hook `useGameStore`, y `components/game/` para los componentes de presentación.

## Devlog 2: 19/05/2026

- Se ha implementado `GameStore` usando `makeAutoObservable`. El store centraliza: `tablero`, `partida`, `cards`, `selectedCard`, `hoveredCard`, `isSubmitting`, `isConnected`, `notification` e `isGameOver`.
- Las acciones del store son: `initGame()`, `resetGame()`, `selectCard(card)`, `hoverCard(card)`, `setNotification(msg)`, `setConnected(val)` y `executeAction(card?)`.
- Se ha usado Antigravity (Claude Sonnet 4.6) para revisar la lógica de `executeAction`, que migra la lógica previa de `handleConfirmAction` de `page.tsx` al store:

  > migra la lógica de handleConfirmAction de page.tsx a un método executeAction en el GameStore de MobX manteniendo exactamente el mismo comportamiento

## Devlog 3: 21/05/2026

- Se han implementado los componentes `Board` y `AstroOrbit`. El tablero renderiza una cuadrícula 3×3 de musas usando el array `tablero.grid`.
- `AstroOrbit` coloca los marcadores de Sol y Luna en 8 posiciones del anillo exterior del tablero mediante cálculo de ángulos.
- La función `getCellHighlightInfo` en `Board` determina qué celdas resaltar según el tipo de carta activa (`hoveredCard ?? selectedCard`): tipos `sun`, `moon`, `inspiration` y `revolution`.

## Devlog 4: 22/05/2026

- Se han implementado `PlayerHand`, `ActionCard` e `InspirationCard`. `PlayerHand` recibe la lista de cartas del store y gestiona la selección y el hover.
- Se ha añadido el botón de confirmación en `PlayerHand` que dispara `store.executeAction(selectedCard)` al hacer clic.
- Se ha usado Antigravity para generar los tests de `PlayerHand`:

  > genera tests unitarios con @testing-library/react para PlayerHand cubriendo selección de carta, hover y confirmación, mockeando gameStore

## Devlog 5: 25/05/2026

- Se ha implementado `StatusPanel` con tres áreas: barra de progreso de las 9 rondas, reserva de tokens por jugador e indicador de conexión.
- La comprobación de conexión con el backend se hace mediante `fetch` al endpoint `/api/v1/status` al inicializar la página.
- Se ha ajustado el color de los jugadores para soportar hasta 5 jugadores con colores diferenciados (gold, blue, red, green, purple).

## Devlog 6: 26/05/2026

- Se ha implementado `GameOverModal` con clasificación ordenada por puntuación, tabla de breakdown por musa y efecto de confeti usando `canvas-confetti`.
- El modal muestra trofeos (🏆, 👑, 🥇) según la posición de cada jugador y permite reiniciar la partida llamando a `store.resetGame()`.
- Se ha corregido el import de `ScoreBreakdown` que estaba apuntando a `@/types/game` en vez de `@/types/scoring`.

## Devlog 7: 28/05/2026

- Se ha migrado `app/page.tsx` de 355 líneas (con `useState` y prop-drilling) a ~80 líneas usando `observer` y `useGameStore`. Toda la lógica de estado quedó en el `GameStore`.
- Se han envuelto todos los componentes de juego con `observer` de `mobx-react-lite`: `Board`, `AstroOrbit`, `PlayerHand`, `StatusPanel`, `GameOverModal`, `MusaCard`, `ActionCard`, `InspirationCard` y `DevotionToken`.
- Se ha creado el hook `useGameStore` que devuelve la instancia singleton del store.

## Devlog 8: 02/06/2026

- Se han ejecutado los 110 tests de Vitest: todos pasan correctamente.
- Los tests de integración que modifican el store directamente generan warnings de MobX strict-mode (`changing observable values without using an action`), pero no afectan a los resultados de los tests porque las comprobaciones sobre el DOM son correctas.
- Se ha verificado que la suite completa de 8 archivos de test y 110 tests individuales pasa sin fallos.

## Devlog 9: 03/06/2026

- Se han revisado los atributos de accesibilidad en todos los componentes: `role="grid"` en el tablero, `aria-label` en cada región, `data-testid` en elementos interactivos y `aria-hidden` en imágenes decorativas.
- Se ha comprobado que el botón de confirmación usa `disabled` correctamente cuando no hay carta seleccionada o la acción está en curso.
- Se ha ajustado la animación de `animate-pulse` en el indicador de conexión para que solo aparezca cuando el estado es "Reconectando".
