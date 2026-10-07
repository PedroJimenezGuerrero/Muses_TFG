'use client';

import React, { useEffect, useState } from 'react';
import { observer } from 'mobx-react-lite';
import confetti from 'canvas-confetti';
import { Trophy, Crown, Medal, RotateCcw, LogOut } from 'lucide-react';
import { Partida, TipoMusa } from '@/types/game';
import { ScoreBreakdown } from '@/types/scoring';

export interface GameOverModalProps {
  isOpen: boolean;
  partida: Partida;
  currentUserId?: number;
  breakdown: ScoreBreakdown;
  onRestart?: () => void;
  onExitToLobby?: () => void;
  className?: string;
}

const MUSAS_ORDER: TipoMusa[] = [
  'CLIO',
  'EUTERPE',
  'TALIA',
  'MELPOMENE',
  'TERPSICORE',
  'ERATO',
  'POLIMNIA',
  'URANIA',
  'CALIOPE',
];

export const GameOverModal = observer<GameOverModalProps>(({
  isOpen,
  partida,
  currentUserId,
  breakdown,
  onRestart,
  onExitToLobby,
  className = '',
}) => {
  const [hoveredTieMusa, setHoveredTieMusa] = useState<string | null>(null);

  // Determine winners and rankings
  const jugadores = partida?.jugadores ? [...partida.jugadores] : [];
  jugadores.sort((a, b) => b.puntuacionTotal - a.puntuacionTotal);

  const highestScore = jugadores[0]?.puntuacionTotal ?? 0;
  const winnerJugadores = jugadores.filter((j) => j.puntuacionTotal === highestScore);
  const isJointWinner =
    winnerJugadores.length > 1 || (partida?.ganadores && partida.ganadores.length > 1);

  // Check if viewing user is among the winners
  const viewingUserIsWinner = winnerJugadores.some((w) => {
    if (currentUserId !== undefined) {
      return w.id === currentUserId || w.numeroJugador === currentUserId;
    }
    return w.numeroJugador === 1;
  });

  useEffect(() => {
    if (isOpen && viewingUserIsWinner) {
      try {
        const testCanvas = typeof document !== 'undefined' ? document.createElement('canvas') : null;
        if (testCanvas && typeof testCanvas.getContext === 'function' && testCanvas.getContext('2d')) {
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#F59E0B', '#FCD34D', '#6366F1', '#A855F7', '#EC4899'],
          });
        }
      } catch {
        // Fallback for non-browser/test environments
      }
    }
  }, [isOpen, viewingUserIsWinner]);

  if (!isOpen) return null;

  // Group players by podium place using standard sports ranking rules (1-2-3 / 1-1-3 / 1-2-2 / 1-1-1)
  let currentRank = 1;
  const rankMap = new Map<number, typeof jugadores>();
  let i = 0;
  while (i < jugadores.length) {
    const score = jugadores[i].puntuacionTotal;
    const tiedGroup = jugadores.filter((j) => j.puntuacionTotal === score);
    rankMap.set(currentRank, tiedGroup);
    currentRank += tiedGroup.length;
    i += tiedGroup.length;
  }

  const firstPlace = rankMap.get(1) || [];
  const secondPlace = rankMap.get(2) || [];
  const thirdPlace = rankMap.get(3) || [];

  // Determine header title
  const headerTitle = isJointWinner
    ? '¡Empate en primer puesto!'
    : viewingUserIsWinner
    ? '¡Victoria!'
    : 'Partida Finalizada';

  const headerSubtitle = isJointWinner
    ? '¡Múltiples dioses comparten el favor supremo de las Musas!'
    : viewingUserIsWinner
    ? '¡Has conseguido el favor supremo de las Musas!'
    : 'Las 9 Musas han consagrado sus favores tras 9 rondas';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Fin de Partida"
      data-testid="game-over-modal"
      className={`fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto ${className}`}
    >
      <div className="relative w-full max-w-4xl bg-gradient-to-b from-zinc-900 via-zinc-950 to-black border border-amber-600/40 rounded-3xl p-4 sm:p-6 shadow-2xl text-amber-50 flex flex-col gap-3.5 max-h-[96vh] overflow-y-auto">
        {/* Header */}
        <div className="text-center space-y-0.5 shrink-0">
          <div className="inline-flex items-center justify-center p-2 rounded-full bg-amber-500/10 border border-amber-400/30 text-amber-400 mb-1">
            <Trophy className="w-6 h-6 sm:w-7 sm:h-7 animate-bounce" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-serif font-black tracking-wide bg-gradient-to-r from-amber-200 via-amber-400 to-amber-500 bg-clip-text text-transparent">
            {headerTitle}
          </h2>
          <p className="text-xs text-zinc-400">
            {headerSubtitle}
          </p>
        </div>

        {/* Victory Podium */}
        <div
          data-testid="victory-podium"
          className="grid grid-cols-3 items-end justify-center gap-2 sm:gap-3 px-2 sm:px-4 shrink-0 my-1"
        >
          {/* 2nd Place */}
          <div
            data-testid="podium-place-2"
            className="flex flex-col items-center justify-end text-center"
          >
            <Medal className="w-5 h-5 text-slate-300 mb-0.5" />
            <div className="font-serif font-bold text-xs sm:text-sm text-slate-200 truncate max-w-full">
              {secondPlace.length > 0 ? secondPlace.map((j) => j.nombre).join(' & ') : '-'}
            </div>
            <div className="text-[10px] sm:text-xs text-slate-400 mb-0.5">
              {secondPlace[0] ? `${secondPlace[0].puntuacionTotal} pts` : ''}
            </div>
            <div className="w-full h-12 sm:h-16 rounded-t-xl bg-gradient-to-t from-slate-800 to-slate-600/80 border-t-2 border-slate-300 flex items-center justify-center font-black text-lg sm:text-2xl text-slate-300 shadow-md">
              2
            </div>
          </div>

          {/* 1st Place */}
          <div
            data-testid="podium-place-1"
            className="flex flex-col items-center justify-end text-center z-10"
          >
            <Crown className="w-6 h-6 text-amber-400 mb-0.5 animate-pulse" />
            <div className="font-serif font-extrabold text-xs sm:text-base text-amber-300 truncate max-w-full">
              {firstPlace.length > 0 ? firstPlace.map((j) => j.nombre).join(' & ') : '-'}
            </div>
            <div className="text-[11px] sm:text-xs font-semibold text-amber-400/90 mb-0.5">
              {firstPlace[0] ? `${firstPlace[0].puntuacionTotal} pts` : ''}
            </div>
            <div className="w-full h-16 sm:h-22 rounded-t-xl bg-gradient-to-t from-amber-700 via-amber-500 to-amber-400 border-t-4 border-amber-200 flex items-center justify-center font-black text-xl sm:text-3xl text-amber-950 shadow-xl">
              1
            </div>
          </div>

          {/* 3rd Place */}
          <div
            data-testid="podium-place-3"
            className="flex flex-col items-center justify-end text-center"
          >
            <Medal className="w-4 h-4 text-amber-700 mb-0.5" />
            <div className="font-serif font-bold text-xs sm:text-sm text-amber-600/90 truncate max-w-full">
              {thirdPlace.length > 0 ? thirdPlace.map((j) => j.nombre).join(' & ') : '-'}
            </div>
            <div className="text-[10px] sm:text-xs text-amber-700/80 mb-0.5">
              {thirdPlace[0] ? `${thirdPlace[0].puntuacionTotal} pts` : ''}
            </div>
            <div className="w-full h-9 sm:h-12 rounded-t-xl bg-gradient-to-t from-amber-950 to-amber-800/70 border-t-2 border-amber-700 flex items-center justify-center font-black text-base sm:text-xl text-amber-600 shadow-sm">
              3
            </div>
          </div>
        </div>

        {/* 9xN Breakdown Table */}
        <div className="space-y-1.5 flex-1 min-h-0">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-amber-400/80">
              Desglose de Puntuación por Musa
            </h3>
            {hoveredTieMusa && (
              <span className="text-[11px] text-amber-300 animate-fadeIn font-mono">
                Empate resuelto: puntos repartidos según reglas
              </span>
            )}
          </div>

          <div className="overflow-x-auto rounded-xl border border-white/10 bg-zinc-950/60 shadow-inner">
            <table
              role="table"
              aria-label="Desglose de puntuación"
              data-testid="podium-table"
              className="w-full text-left text-xs"
            >
              <thead className="bg-zinc-900/80 border-b border-white/10 text-zinc-400 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-1.5 px-2.5 font-semibold">Musa</th>
                  {jugadores.map((jugador) => (
                    <th key={jugador.id} colSpan={2} className="py-1.5 px-2 text-center font-semibold text-amber-200">
                      {jugador.nombre}
                    </th>
                  ))}
                  <th className="py-1.5 px-2 text-center font-semibold">Resolución</th>
                </tr>
                <tr className="border-b border-white/5 text-[9px] text-zinc-500">
                  <th className="py-0.5 px-2.5"></th>
                  {jugadores.map((jugador) => (
                    <React.Fragment key={`sub-${jugador.id}`}>
                      <th className="py-0.5 px-1.5 text-center">Tokens</th>
                      <th className="py-0.5 px-1.5 text-center text-amber-400">Puntos</th>
                    </React.Fragment>
                  ))}
                  <th className="py-0.5 px-2"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {MUSAS_ORDER.map((musa) => {
                  const rawMatrix = (breakdown as any)?.matrix || breakdown || {};
                  const musaBreakdown = rawMatrix?.[musa] ?? {};
                  // Detect tie across players
                  const playerTokens = jugadores.map((j) => {
                    const item =
                      musaBreakdown[j.id ?? ''] ??
                      musaBreakdown[String(j.id)] ??
                      musaBreakdown[j.nombre] ??
                      {};
                    return item.tokens ?? 0;
                  });
                  const maxTokens = Math.max(...playerTokens, 0);
                  const isTied =
                    maxTokens > 0 &&
                    playerTokens.filter((count) => count === maxTokens).length > 1;

                  return (
                    <tr
                      key={musa}
                      data-testid={`breakdown-row-${musa}`}
                      className="hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="py-1 px-2.5 font-serif font-bold text-amber-100 flex items-center gap-1">
                        <span>{musa}</span>
                      </td>

                      {jugadores.map((jugador) => {
                        const item =
                          musaBreakdown[jugador.id ?? ''] ??
                          musaBreakdown[String(jugador.id)] ??
                          musaBreakdown[jugador.nombre] ??
                          { tokens: 0, points: 0 };
                        const pts = Number.isNaN(item.points) || item.points === undefined ? 0 : item.points;
                        return (
                          <React.Fragment key={`cell-${musa}-${jugador.id}`}>
                            <td
                              data-player={jugador.nombre}
                              className="py-1 px-1.5 text-center font-mono text-zinc-300"
                            >
                              {item.tokens ?? 0}
                            </td>
                            <td
                              data-player={jugador.nombre}
                              className="py-1 px-1.5 text-center font-mono font-bold text-amber-400"
                            >
                              {pts}
                            </td>
                          </React.Fragment>
                        );
                      })}

                      <td className="py-1 px-2 text-center">
                        {isTied ? (
                          <span
                            data-tie-badge="true"
                            onMouseEnter={() => setHoveredTieMusa(musa)}
                            onMouseLeave={() => setHoveredTieMusa(null)}
                            className="inline-block px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-purple-500/20 text-purple-300 border border-purple-400/40 cursor-help transition-all hover:bg-purple-500/30"
                            title="Empate resuelto: división proporcional"
                          >
                            =
                          </span>
                        ) : (
                          <span className="text-[10px] text-zinc-600">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="border-t-2 border-amber-500/30 bg-zinc-900/90 font-bold">
                <tr data-testid="breakdown-total-row">
                  <td className="py-2 px-2.5 uppercase text-[11px] tracking-wider text-amber-300">
                    Total
                  </td>
                  {jugadores.map((jugador) => (
                    <React.Fragment key={`tot-${jugador.id}`}>
                      <td className="py-2 px-1.5 text-center text-zinc-400 text-[11px] font-mono">
                        —
                      </td>
                      <td className="py-2 px-1.5 text-center font-mono text-sm font-extrabold text-amber-300">
                        {jugador.puntuacionTotal}
                      </td>
                    </React.Fragment>
                  ))}
                  <td className="py-2 px-2"></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Action Buttons: Volver al Lobby / Nueva Partida (always visible, no scroll required) */}
        <div className="flex flex-row items-center justify-center gap-3 pt-1 shrink-0">
          {onExitToLobby && (
            <button
              type="button"
              data-testid="exit-lobby-btn"
              onClick={onExitToLobby}
              aria-label="Salir al Lobby"
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 hover:border-zinc-500 text-zinc-200 font-semibold text-xs sm:text-sm shadow-md transition-all cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Volver al Lobby</span>
            </button>
          )}

          {onRestart && (
            <button
              type="button"
              data-testid="restart-game-btn"
              onClick={onRestart}
              aria-label="Nueva Partida"
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-amber-950 font-bold text-xs sm:text-sm shadow-lg shadow-amber-500/20 hover:scale-105 active:scale-95 transition-all cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Nueva Partida</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
});

export default GameOverModal;
