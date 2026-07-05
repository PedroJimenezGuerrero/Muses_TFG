"use client";

import React, { useState, useEffect } from "react";
import {
  Tablero,
  Partida,
  Jugador,
  TipoMusa,
  AnyCard,
  CartaAccion,
  CartaInspiracion,
  MUSAS_METADATA,
} from "@/types/game";
import {
  mapAstroToGrid,
  advanceAstros,
  applyRevolution,
  getInspirationTargetCells,
} from "@/lib/gameRules";
import { Board } from "@/components/game/Board";
import { StatusPanel } from "@/components/game/StatusPanel";
import { PlayerHand } from "@/components/game/PlayerHand";

const INITIAL_MUSAS: TipoMusa[] = [
  "CLIO",
  "EUTERPE",
  "TALIA",
  "MELPOMENE",
  "TERPSICORE",
  "ERATO",
  "POLIMNIA",
  "URANIA",
  "CALIOPE",
];

function createInitialGameState(): {
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
    nombre: "Apolo",
    numeroJugador: 1,
    puntuacionTotal: 0,
    tokens: Array.from({ length: 20 }, (_, idx) => ({
      id: 100 + idx,
      colocado: false,
      jugador: { id: 1, nombre: "Apolo", numeroJugador: 1, puntuacionTotal: 0 },
    })),
  };

  const jugador2: Jugador = {
    id: 2,
    nombre: "Atenea",
    numeroJugador: 2,
    puntuacionTotal: 0,
    tokens: Array.from({ length: 20 }, (_, idx) => ({
      id: 200 + idx,
      colocado: false,
      jugador: { id: 2, nombre: "Atenea", numeroJugador: 2, puntuacionTotal: 0 },
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
    { id: 101, tipo: "DEVOCION_SOL", tipoCarta: "ACCION", nombre: "Devoción Solar" },
    { id: 102, tipo: "DEVOCION_LUNA", tipoCarta: "ACCION", nombre: "Devoción Lunar" },
    { id: 103, tipo: "REVOLUCION_SOL", tipoCarta: "ACCION", nombre: "Revolución Solar" },
    { id: 104, tipo: "REVOLUCION_LUNA", tipoCarta: "ACCION", nombre: "Revolución Lunar" },
  ];

  const inspirationCard: CartaInspiracion = {
    id: 105,
    tipoCarta: "INSPIRACION",
    nombreMusa: "TERPSICORE",
    usada: false,
    nombre: "Inspiración de Terpsícore",
  };

  return {
    tablero: initialTablero,
    partida: initialPartida,
    cards: [...commonActions, inspirationCard],
  };
}

export default function GamePage() {
  const [gameState, setGameState] = useState(createInitialGameState);
  const [selectedCard, setSelectedCard] = useState<AnyCard | null>(null);
  const [hoveredCard, setHoveredCard] = useState<AnyCard | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isConnected, setIsConnected] = useState<boolean>(true);
  const [notification, setNotification] = useState<string | null>(null);

  // Check backend heartbeat
  useEffect(() => {
    const checkBackend = async () => {
      try {
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "/api/v1";
        const response = await fetch(`${backendUrl}/status`);
        if (response.ok) {
          setIsConnected(true);
        } else {
          setIsConnected(false);
        }
      } catch {
        setIsConnected(false);
      }
    };
    checkBackend();
  }, []);

  const handleSelectCard = (card: AnyCard) => {
    setSelectedCard((prev) => (prev?.id === card.id ? null : card));
  };

  const handleConfirmAction = async (cardToPlay?: AnyCard) => {
    const card = cardToPlay || selectedCard;
    if (!card || isSubmitting) return;

    setIsSubmitting(true);
    setNotification(`Ejecutando ${card.nombre || "Acción"}...`);

    // Simulate action execution with authentic game rules
    setTimeout(() => {
      setGameState((prevState) => {
        const currentTablero = prevState.tablero;
        const currentPartida = prevState.partida;
        const currentCards = [...prevState.cards];
        const activePlayer = currentPartida.jugadores[0]; // Active player: Apolo

        let updatedGrid = [...currentTablero.grid];
        let tokensToDeduct = 0;

        const cardType = (card as any).tipo || (card as any).tipoCarta;

        if (cardType === "DEVOCION_SOL") {
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
        } else if (cardType === "DEVOCION_LUNA") {
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
        } else if (cardType === "REVOLUCION_SOL") {
          tokensToDeduct = 1;
          const newToken = {
            id: Date.now(),
            colocado: true,
            jugador: activePlayer,
            jugadorId: activePlayer.id,
          };
          // Add 1 token to center cell (4) before revolving
          updatedGrid = updatedGrid.map((m, idx) =>
            idx === 4 ? { ...m, tokensColocados: [...m.tokensColocados, newToken] } : m
          );
          // Apply 6-cell clockwise rotation
          updatedGrid = applyRevolution(updatedGrid, currentTablero.solPos);
        } else if (cardType === "REVOLUCION_LUNA") {
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
        } else if (cardType === "INSPIRACION" || (card as any).tipoMusa || (card as any).nombreMusa) {
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

          // Mark inspiration card as used
          const cardIdx = currentCards.findIndex((c) => c.id === card.id);
          if (cardIdx !== -1) {
            currentCards[cardIdx] = { ...currentCards[cardIdx], usada: true } as CartaInspiracion;
          }
        }

        // Advance astros clockwise
        const { solPos: nextSol, lunaPos: nextLuna } = advanceAstros(
          currentTablero.solPos,
          currentTablero.lunaPos
        );

        // Update player token reserve
        const updatedJugadores = currentPartida.jugadores.map((j, i) => {
          if (i === 0 && j.tokens) {
            return {
              ...j,
              tokens: j.tokens.slice(tokensToDeduct),
            };
          }
          return j;
        });

        const nextRound = Math.min(currentPartida.rondaActual + 1, currentPartida.maxRondas);

        const newTablero: Tablero = {
          ...currentTablero,
          solPos: nextSol,
          lunaPos: nextLuna,
          grid: updatedGrid,
        };

        const newPartida: Partida = {
          ...currentPartida,
          rondaActual: nextRound,
          tablero: newTablero,
          jugadores: updatedJugadores,
        };

        return {
          tablero: newTablero,
          partida: newPartida,
          cards: currentCards,
        };
      });

      setSelectedCard(null);
      setHoveredCard(null);
      setIsSubmitting(false);
      setNotification("¡Acción resuelta con éxito! Astros han avanzado.");
      setTimeout(() => setNotification(null), 3000);
    }, 600);
  };

  const handleResetGame = () => {
    setGameState(createInitialGameState());
    setSelectedCard(null);
    setHoveredCard(null);
    setIsSubmitting(false);
    setNotification("Partida reiniciada.");
    setTimeout(() => setNotification(null), 2500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-zinc-950 to-black text-amber-50 font-sans flex flex-col justify-between p-3 sm:p-6 overflow-x-hidden">
      {/* Top Status & HUD Area */}
      <header className="w-full flex flex-col items-center gap-4 max-w-5xl mx-auto">
        <div className="flex items-center justify-between w-full px-2">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-serif font-extrabold tracking-wider bg-gradient-to-r from-amber-200 via-amber-400 to-amber-500 bg-clip-text text-transparent">
              MUSES
            </span>
            <span className="text-xs uppercase tracking-widest text-amber-500/70 border-l border-amber-600/40 pl-2">
              Juego de Tablero
            </span>
          </div>

          <button
            type="button"
            onClick={handleResetGame}
            className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-zinc-900/80 border border-zinc-700 hover:border-amber-400/50 hover:bg-zinc-800 transition-all text-zinc-300"
          >
            Reiniciar Partida
          </button>
        </div>

        <StatusPanel
          partida={gameState.partida}
          isConnected={isConnected}
          waitingForPlayers={isSubmitting}
        />

        {notification && (
          <div className="px-4 py-2 rounded-2xl bg-amber-500/20 border border-amber-400/40 text-amber-200 text-xs sm:text-sm font-medium animate-bounce shadow-lg">
            {notification}
          </div>
        )}
      </header>

      {/* Main Board Arena Area */}
      <main className="flex-1 flex items-center justify-center my-4 sm:my-6">
        <Board
          tablero={gameState.tablero}
          hoveredCard={hoveredCard}
          selectedCard={selectedCard}
        />
      </main>

      {/* Bottom Fixed Hand Deck Area */}
      <footer className="w-full max-w-5xl mx-auto">
        <PlayerHand
          cards={gameState.cards}
          solPos={gameState.tablero.solPos}
          selectedCard={selectedCard}
          onSelectCard={handleSelectCard}
          onHoverCard={setHoveredCard}
          onConfirm={handleConfirmAction}
          isSubmitting={isSubmitting}
        />
      </footer>
    </div>
  );
}
