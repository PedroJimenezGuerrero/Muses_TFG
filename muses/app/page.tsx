'use client';

import React, { useState, useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { gameStore } from '@/store';
import { AnyCard } from '@/types/game';
import { Board } from '@/components/game/Board';
import { StatusPanel } from '@/components/game/StatusPanel';
import { PlayerHand } from '@/components/game/PlayerHand';
import { ActionResolutionStack } from '@/components/game/ActionResolutionStack';
import { LobbyView } from '@/components/game/LobbyView';
import { GameOverModal } from '@/components/game/GameOverModal';
import { AuthModal, ProfileModal } from '@/components/auth';
import { useGameSocket } from '@/hooks/useGameSocket';
import { Sparkles, RotateCcw, LogOut, History, User, ShieldCheck } from 'lucide-react';

const GamePage = observer(() => {
  const store = gameStore;
  const [authOpen, setAuthOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Connect STOMP socket hook
  useGameSocket();

  useEffect(() => {
    const checkBackend = async () => {
      try {
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080/api/v1';
        const response = await fetch(`${backendUrl}/status`);
        store.setConnected(response.ok);
      } catch {
        store.setConnected(false);
      }
    };
    checkBackend();
  }, [store]);

  return (
    <div className="h-screen w-screen bg-radial from-slate-950 via-zinc-950 to-black text-amber-50 font-sans flex flex-col justify-between overflow-hidden select-none">
      {/* Top Floating Mini Header */}
      <header className="w-full flex items-center justify-between px-4 py-2.5 z-30 bg-black/40 backdrop-blur-md border-b border-white/5">
        <div className="flex items-center gap-2.5">
          <span className="text-2xl font-serif font-black tracking-widest bg-gradient-to-r from-amber-200 via-amber-400 to-amber-500 bg-clip-text text-transparent">
            MUSES
          </span>
        </div>

        {store.notification && (
          <div className="px-3.5 py-1 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-200 text-xs font-medium animate-bounce shadow-lg">
            {store.notification}
          </div>
        )}

        <div className="flex items-center gap-2">
          {/* User Profile / Auth Button */}
          {mounted && store.usuario ? (
            <button
              type="button"
              onClick={() => setProfileOpen(true)}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-zinc-900 border border-amber-500/30 hover:border-amber-400 text-amber-200 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <div className="w-4 h-4 rounded-full bg-amber-500 text-black flex items-center justify-center text-[10px] font-bold">
                {store.usuario.username.charAt(0).toUpperCase()}
              </div>
              <span className="max-w-[100px] truncate">{store.usuario.username}</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setAuthOpen(true)}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-amber-500/20 border border-amber-500/40 hover:bg-amber-500/30 text-amber-300 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <User className="w-3.5 h-3.5" />
              <span>Acceder</span>
            </button>
          )}

          {store.enPartida && (
            <>
              <button
                type="button"
                aria-label="Reiniciar Partida"
                onClick={() => store.resetGame()}
                title="Reiniciar Partida"
                className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-zinc-900 border border-zinc-700 hover:border-amber-400 text-zinc-300 hover:text-amber-200 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Reiniciar</span>
              </button>
              <button
                type="button"
                onClick={() => store.abandonarSala()}
                title="Salir al Lobby"
                className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-red-950/40 border border-red-800/50 hover:bg-red-900/50 text-red-300 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Lobby</span>
              </button>
            </>
          )}
        </div>
      </header>

      {/* Main Play Area — Side-by-Side Screen Layout (No Scroll) */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 flex items-center justify-center relative">
        {!store.enPartida ? (
          <LobbyView />
        ) : (
          <div className="w-full h-full flex flex-col lg:flex-row items-center justify-center gap-6 lg:gap-8 pt-4 pb-28">
            {/* Left Side: Game HUD & Players Status */}
            {store.partida && (
              <aside className="w-full lg:w-64 max-w-xs shrink-0 flex flex-col gap-3 z-20">
                <StatusPanel
                  partida={store.partida}
                  currentUserId={store.jugadorActualId}
                  isConnected={store.isConnected}
                  waitingForPlayers={store.isSubmitting}
                />
              </aside>
            )}

            {/* Center Arena: 3x3 Board with Orbit and Action Resolution Stack */}
            {store.tablero && (
              <section className="flex-1 flex flex-col items-center justify-center relative z-10">
                <Board
                  tablero={store.tablero}
                  hoveredCard={store.hoveredCard}
                  selectedCard={store.selectedCard}
                  activeMusaIndex={store.activeMusaIndex}
                  revolutionAnimating={store.revolutionAnimating}
                >
                  <ActionResolutionStack
                    currentAction={store.currentExecutingAction}
                    pendingActions={store.pendingActions}
                  />
                </Board>
              </section>
            )}

            {/* Right Side Info: Action Resolution Log & Guide */}
            <aside className="hidden xl:flex w-80 max-w-sm shrink-0 flex-col gap-3.5 z-20">
              {/* Turn Action Resolution Log */}
              {store.actionLogs.length > 0 && (
                <div className="p-4 rounded-2xl bg-zinc-950/90 border border-amber-500/30 backdrop-blur-md shadow-lg flex flex-col gap-3 animate-in fade-in slide-in-from-right-3 duration-300">
                  <span className="text-sm uppercase font-bold tracking-wider text-amber-400 flex items-center gap-2 border-b border-amber-500/20 pb-2">
                    <History className="w-4 h-4" />
                    Resolución de la Ronda
                  </span>
                  <div className="space-y-2.5">
                    {store.actionLogs.map((log, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-xl bg-zinc-900/90 border border-zinc-800 text-sm flex flex-col gap-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-amber-200 text-sm">{log.jugadorNombre}</span>
                          <span className="text-xs uppercase px-2.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono font-semibold">
                            {log.cartaNombre}
                          </span>
                        </div>
                        <span className="text-zinc-200 text-sm leading-snug">{log.detalle}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="p-4 rounded-2xl bg-zinc-950/90 border border-zinc-800/80 backdrop-blur-md shadow-lg flex flex-col gap-3 text-sm">
                <span className="text-sm uppercase font-bold tracking-wider text-amber-400/90 flex items-center gap-2 border-b border-zinc-800/80 pb-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  Guía Rápida
                </span>
                <p className="text-zinc-200 leading-relaxed text-sm">
                  Pasa el ratón sobre cualquier musa para consultar sus puntos o sobre tus cartas para ver sus efectos.
                </p>
                <div className="border-t border-zinc-800/80 pt-3 space-y-2 text-sm text-zinc-200">
                  <div className="flex items-center gap-2.5">
                    <span className="w-3 h-3 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)] shrink-0" />
                    <span className="font-medium">Sol: Coloca 2 tokens o rota</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span className="w-3 h-3 rounded-full bg-indigo-400 shadow-[0_0_8px_rgba(99,102,241,0.8)] shrink-0" />
                    <span className="font-medium">Luna: Coloca 2 tokens o rota</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span className="w-3 h-3 rounded-full bg-purple-400 shadow-[0_0_8px_rgba(192,132,252,0.8)] shrink-0" />
                    <span className="font-medium">Inspiración: 1 token geométrico</span>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        )}
      </main>

      {/* Bottom Fixed Hand Deck Area */}
      {store.enPartida && store.tablero && (
        <PlayerHand
          cards={store.cards}
          solPos={store.tablero.solPos}
          selectedCard={store.selectedCard}
          onSelectCard={(card: AnyCard) => store.selectCard(card)}
          onHoverCard={(card: AnyCard | null) => store.hoverCard(card)}
          onConfirm={(card?: AnyCard) => store.executeAction(card)}
          isSubmitting={store.isSubmitting}
        />
      )}

      {/* Auth & Profile Modals */}
      <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} />
      <ProfileModal isOpen={profileOpen} onClose={() => setProfileOpen(false)} />

      {/* Game Over Modal */}
      {store.enPartida && store.isGameOver && store.partida && (
        <GameOverModal
          isOpen={store.isGameOver}
          partida={store.partida}
          breakdown={store.scoreBreakdown || { filas: [], totalesPorJugador: [], ganadores: [] }}
          onRestart={() => store.resetGame()}
          onExitToLobby={() => store.abandonarSala()}
        />
      )}
    </div>
  );
});

export default GamePage;
