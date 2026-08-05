'use client';

import React, { useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { gameStore } from '@/store';
import { AnyCard } from '@/types/game';
import { Board } from '@/components/game/Board';
import { StatusPanel } from '@/components/game/StatusPanel';
import { PlayerHand } from '@/components/game/PlayerHand';
import { LobbyView } from '@/components/game/LobbyView';
import { GameOverModal } from '@/components/game/GameOverModal';

const GamePage = observer(() => {
  const store = gameStore;

  useEffect(() => {
    const checkBackend = async () => {
      try {
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || '/api/v1';
        const response = await fetch(`${backendUrl}/status`);
        store.setConnected(response.ok);
      } catch {
        store.setConnected(false);
      }
    };
    checkBackend();
  }, [store]);

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

          {store.enPartida && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => store.abandonarSala()}
                className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-zinc-900/80 border border-zinc-700 hover:border-amber-400/50 hover:bg-zinc-800 transition-all text-zinc-300"
              >
                Volver al Lobby
              </button>
              <button
                type="button"
                onClick={() => store.resetGame()}
                className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-amber-500/20 border border-amber-500/40 hover:bg-amber-500/30 transition-all text-amber-200"
              >
                Reiniciar Partida
              </button>
            </div>
          )}
        </div>

        {store.enPartida && store.partida && (
          <StatusPanel
            partida={store.partida}
            isConnected={store.isConnected}
            waitingForPlayers={store.isSubmitting}
          />
        )}

        {store.notification && (
          <div className="px-4 py-2 rounded-2xl bg-amber-500/20 border border-amber-400/40 text-amber-200 text-xs sm:text-sm font-medium animate-bounce shadow-lg">
            {store.notification}
          </div>
        )}
      </header>

      {/* Main Area: Lobby or Board */}
      <main className="flex-1 flex items-center justify-center my-4 sm:my-6 w-full">
        {!store.enPartida ? (
          <LobbyView />
        ) : store.tablero ? (
          <Board
            tablero={store.tablero}
            hoveredCard={store.hoveredCard}
            selectedCard={store.selectedCard}
          />
        ) : null}
      </main>

      {/* Bottom Fixed Hand Deck Area (Only in game) */}
      {store.enPartida && store.tablero && (
        <footer className="w-full max-w-5xl mx-auto">
          <PlayerHand
            cards={store.cards}
            solPos={store.tablero.solPos}
            selectedCard={store.selectedCard}
            onSelectCard={(card: AnyCard) => store.selectCard(card)}
            onHoverCard={(card: AnyCard | null) => store.hoverCard(card)}
            onConfirm={(card?: AnyCard) => store.executeAction(card)}
            isSubmitting={store.isSubmitting}
          />
        </footer>
      )}

      {/* Game Over Modal */}
      {store.enPartida && store.isGameOver && store.partida && (
        <GameOverModal
          isOpen={store.isGameOver}
          partida={store.partida}
          onPlayAgain={() => store.resetGame()}
          onClose={() => store.abandonarSala()}
        />
      )}
    </div>
  );
});

export default GamePage;
