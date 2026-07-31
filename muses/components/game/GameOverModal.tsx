'use client';

import React, { useEffect, useState } from 'react';
import { observer } from 'mobx-react-lite';
import confetti from 'canvas-confetti';
import { Trophy, Crown, Medal, RotateCcw } from 'lucide-react';
import { Partida, TipoMusa } from '@/types/game';
import { ScoreBreakdown } from '@/types/scoring';

export interface GameOverModalProps {
  isOpen: boolean;
  partida: Partida;
  breakdown: ScoreBreakdown;
  onRestart: () => void;
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
  breakdown,
  onRestart,
  className = '',
}) => {
  const [hoveredTieMusa, setHoveredTieMusa] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      try {
        const testCanvas = typeof document !== 'undefined' ? document.createElement('canvas') : null;
        if (testCanvas && typeof testCanvas.getContext === 'function' && testCanvas.getContext('2d')) {
          confetti({
            particleCount: 90,
            spread: 80,
            origin: { y: 0.6 },
            colors: ['#F59E0B', '#FCD34D', '#6366F1', '#A855F7', '#EC4899'],
          });
        }
      } catch {
        // Fallback for non-browser/test environments
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Determine winners and rankings
  const jugadores = partida?.jugadores ? [...partida.jugadores] : [];
  jugadores.sort((a, b) => b.puntuacionTotal - a.puntuacionTotal);

  const highestScore = jugadores[0]?.puntuacionTotal ?? 0;
  const winnerJugadores = jugadores.filter((j) => j.puntuacionTotal === highestScore);
  const isJointWinner =
    winnerJugadores.length > 1 || (partida?.ganadores && partida.ganadores.length > 1);

  // Group players by podium place
  const firstPlace = isJointWinner
    ? winnerJugadores
    : jugadores.slice(0, 1);
  const secondPlace = isJointWinner
    ? []
    : jugadores.length > 1
    ? [jugadores[1]]
    : [];
  const thirdPlace = isJointWinner
    ? []
    : jugadores.length > 2
    ? [jugadores[2]]
    : [];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Fin de Partida"
      data-testid="game-over-modal"
      className={`fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md overflow-y-auto ${className}`}
    >
      <div className="relative w-full max-w-4xl bg-gradient-to-b from-zinc-900 via-zinc-950 to-black border border-amber-600/40 rounded-3xl p-5 sm:p-8 shadow-2xl text-amber-50 flex flex-col gap-6 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="text-center space-y-1">
          <div className="inline-flex items-center justify-center p-3 rounded-full bg-amber-500/10 border border-amber-400/30 text-amber-400 mb-2">
            <Trophy className="w-8 h-8 sm:w-10 sm:h-10 animate-bounce" />
          </div>
          <h2 className="text-2xl sm:text-4xl font-serif font-black tracking-wide bg-gradient-to-r from-amber-200 via-amber-400 to-amber-500 bg-clip-text text-transparent">
            {isJointWinner ? '¡Empate en primer puesto!' : '¡Victoria Divina!'}
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400">
            Las 9 Musas han consagrado sus favores tras 9 rondas de devoción y revolución
          </p>
        </div>

        {/* Victory Podium */}
        <div
          data-testid="victory-podium"
          className="grid grid-cols-3 items-end justify-center gap-2 sm:gap-4 my-2 px-2 sm:px-6"
        >
          {/* 2nd Place */}
          <div
            data-testid="podium-place-2"
            className="flex flex-col items-center justify-end text-center"
          >
            <Medal className="w-6 h-6 text-slate-300 mb-1" />
            <div className="font-serif font-bold text-xs sm:text-base text-slate-200 truncate max-w-full">
              {secondPlace.map((j) => j.nombre).join(' & ') || (isJointWinner ? '-' : 'Atenea')}
            </div>
            <div className="text-[11px] sm:text-xs text-slate-400 mb-1">
              {secondPlace[0] ? `${secondPlace[0].puntuacionTotal} pts` : ''}
            </div>
            <div className="w-full h-20 sm:h-28 rounded-t-2xl bg-gradient-to-t from-slate-800 to-slate-600/80 border-t-2 border-slate-300 flex items-center justify-center font-black text-xl sm:text-3xl text-slate-300 shadow-lg">
              2
            </div>
          </div>

          {/* 1st Place */}
          <div
            data-testid="podium-place-1"
            className="flex flex-col items-center justify-end text-center z-10"
          >
            <Crown className="w-8 h-8 text-amber-400 mb-1 animate-pulse" />
            <div className="font-serif font-extrabold text-sm sm:text-lg text-amber-300 truncate max-w-full">
              {firstPlace.map((j) => j.nombre).join(' & ') || 'Apolo'}
            </div>
            <div className="text-xs sm:text-sm font-semibold text-amber-400/90 mb-1">
              {firstPlace[0] ? `${firstPlace[0].puntuacionTotal} pts` : ''}
            </div>
            <div className="w-full h-28 sm:h-36 rounded-t-2xl bg-gradient-to-t from-amber-700 via-amber-500 to-amber-400 border-t-4 border-amber-200 flex items-center justify-center font-black text-2xl sm:text-4xl text-amber-950 shadow-2xl">
              1
            </div>
          </div>

          {/* 3rd Place */}
          <div
            data-testid="podium-place-3"
            className="flex flex-col items-center justify-end text-center"
          >
            <Medal className="w-5 h-5 text-amber-700 mb-1" />
            <div className="font-serif font-bold text-xs sm:text-base text-amber-600/90 truncate max-w-full">
              {thirdPlace.map((j) => j.nombre).join(' & ') || '-'}
            </div>
            <div className="text-[11px] sm:text-xs text-amber-700/80 mb-1">
              {thirdPlace[0] ? `${thirdPlace[0].puntuacionTotal} pts` : ''}
            </div>
            <div className="w-full h-14 sm:h-20 rounded-t-2xl bg-gradient-to-t from-amber-950 to-amber-800/70 border-t-2 border-amber-700 flex items-center justify-center font-black text-lg sm:text-2xl text-amber-600 shadow-md">
              3
            </div>
          </div>
        </div>

        {/* 9xN Breakdown Table */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-amber-400/80">
              Desglose de Puntuación por Musa
            </h3>
            {hoveredTieMusa && (
              <span className="text-xs text-amber-300 animate-fadeIn font-mono">
                Empate resuelto: puntos repartidos según reglas de cálculo
              </span>
            )}
          </div>

          <div className="overflow-x-auto rounded-2xl border border-white/10 bg-zinc-950/60 shadow-inner">
            <table
              role="table"
              aria-label="Desglose de puntuación"
              data-testid="podium-table"
              className="w-full text-left text-xs sm:text-sm"
            >
              <thead className="bg-zinc-900/80 border-b border-white/10 text-zinc-400 uppercase text-[10px] sm:text-xs tracking-wider">
                <tr>
                  <th className="py-2.5 px-3 font-semibold">Musa</th>
                  {jugadores.map((jugador) => (
                    <th key={jugador.id} colSpan={2} className="py-2.5 px-3 text-center font-semibold text-amber-200">
                      {jugador.nombre}
                    </th>
                  ))}
                  <th className="py-2.5 px-3 text-center font-semibold">Resolución</th>
                </tr>
                <tr className="border-b border-white/5 text-[9px] sm:text-[10px] text-zinc-500">
                  <th className="py-1 px-3"></th>
                  {jugadores.map((jugador) => (
                    <React.Fragment key={`sub-${jugador.id}`}>
                      <th className="py-1 px-2 text-center">Tokens</th>
                      <th className="py-1 px-2 text-center text-amber-400">Puntos</th>
                    </React.Fragment>
                  ))}
                  <th className="py-1 px-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {MUSAS_ORDER.map((musa) => {
                  const musaBreakdown = breakdown?.[musa] ?? {};
                  // Detect tie across players
                  const playerTokens = jugadores.map((j) => musaBreakdown[j.nombre]?.tokens ?? 0);
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
                      <td className="py-2 px-3 font-serif font-bold text-amber-100 flex items-center gap-1.5">
                        <span>{musa}</span>
                      </td>

                      {jugadores.map((jugador) => {
                        const item = musaBreakdown[jugador.nombre] ?? { tokens: 0, points: 0 };
                        return (
                          <React.Fragment key={`cell-${musa}-${jugador.id}`}>
                            <td
                              data-player={jugador.nombre}
                              className="py-2 px-2 text-center font-mono text-zinc-300"
                            >
                              {item.tokens}
                            </td>
                            <td
                              data-player={jugador.nombre}
                              className="py-2 px-2 text-center font-mono font-bold text-amber-400"
                            >
                              {item.points}
                            </td>
                          </React.Fragment>
                        );
                      })}

                      <td className="py-2 px-3 text-center">
                        {isTied ? (
                          <span
                            data-tie-badge="true"
                            onMouseEnter={() => setHoveredTieMusa(musa)}
                            onMouseLeave={() => setHoveredTieMusa(null)}
                            className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-400/40 cursor-help transition-all hover:bg-purple-500/30"
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
                  <td className="py-3 px-3 uppercase text-xs tracking-wider text-amber-300">
                    Total
                  </td>
                  {jugadores.map((jugador) => (
                    <React.Fragment key={`tot-${jugador.id}`}>
                      <td className="py-3 px-2 text-center text-zinc-400 text-xs font-mono">
                        —
                      </td>
                      <td className="py-3 px-2 text-center font-mono text-base font-extrabold text-amber-300">
                        {jugador.puntuacionTotal}
                      </td>
                    </React.Fragment>
                  ))}
                  <td className="py-3 px-3"></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Restart Action Button */}
        <div className="flex items-center justify-center pt-2">
          <button
            type="button"
            data-testid="restart-game-btn"
            onClick={onRestart}
            aria-label="Nueva Partida"
            className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-amber-950 font-bold text-sm sm:text-base shadow-xl shadow-amber-500/20 hover:scale-105 active:scale-95 transition-all cursor-pointer"
          >
            <RotateCcw className="w-5 h-5" />
            <span>Nueva Partida</span>
          </button>
        </div>
      </div>
    </div>
  );
});

export default GameOverModal;
