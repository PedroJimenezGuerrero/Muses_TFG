import React from 'react';
import { observer } from 'mobx-react-lite';
import { Partida, Jugador } from '@/types/game';

export interface StatusPanelProps {
  partida: Partida;
  currentUserId?: number;
  isConnected?: boolean;
  waitingForPlayers?: boolean;
  className?: string;
}

const PLAYER_COLORS: Record<number, { name: string; bg: string; text: string; border: string }> = {
  1: { name: 'gold', bg: 'bg-amber-500/20', text: 'text-amber-400', border: 'border-amber-500/40' },
  2: { name: 'blue', bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/40' },
  3: { name: 'red', bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/40' },
  4: { name: 'green', bg: 'bg-emerald-500/20', text: 'text-emerald-400', border: 'border-emerald-500/40' },
  5: { name: 'purple', bg: 'bg-purple-500/20', text: 'text-purple-400', border: 'border-purple-500/40' },
};

export const StatusPanel = observer<StatusPanelProps>(({
  partida,
  currentUserId,
  isConnected = true,
  waitingForPlayers = false,
  className = '',
}) => {
  const maxRondas = partida.maxRondas || 9;
  const isFinalRound = partida.rondaActual >= maxRondas;

  const getRemainingTokens = (jugador: Jugador): number => {
    if (jugador.tokens && Array.isArray(jugador.tokens)) {
      const hasPlaced = jugador.tokens.some((t) => t.colocado);
      if (hasPlaced) {
        return Math.max(0, jugador.tokens.filter((t) => !t.colocado).length);
      }
      return Math.max(0, jugador.tokens.length);
    }
    return 20;
  };

  return (
    <div
      role="region"
      aria-label="Estado de Partida"
      data-testid="status-panel"
      className={`w-full flex flex-col gap-3 select-none ${className}`}
    >
      {/* Top Header Card: Round & Connection */}
      <div className="p-4 rounded-2xl bg-zinc-950/85 border border-zinc-800/80 backdrop-blur-md shadow-lg flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="font-serif text-lg font-bold tracking-wide text-amber-300 drop-shadow-sm">
            Ronda {partida.rondaActual} de {maxRondas}
          </span>

          {/* Connection Status Badge */}
          <div
            data-testid="connection-status"
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold tracking-wide border ${
              isConnected
                ? 'bg-emerald-950/50 text-emerald-400 border-emerald-700/50'
                : 'bg-red-950/60 text-red-400 border-red-700/50 animate-pulse'
            }`}
          >
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                isConnected ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]' : 'bg-red-400'
              }`}
            />
            <span>{isConnected ? 'Conectado' : 'Reconectando...'}</span>
          </div>
        </div>

        {isFinalRound && (
          <span className="px-3 py-1 rounded-full bg-red-600/90 text-white text-center font-bold text-xs uppercase tracking-wider animate-pulse border border-red-400/50 shadow-[0_0_10px_rgba(220,38,38,0.7)]">
            ¡Última Ronda!
          </span>
        )}

        {/* Turn Status Message */}
        {waitingForPlayers && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-400/30 text-amber-300 text-xs font-medium animate-pulse">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            <span>Esperando elecciones de los jugadores...</span>
          </div>
        )}

        {/* Round Progression Timeline: 9 Steps */}
        <div className="flex items-center justify-between gap-1.5 pt-1">
          {Array.from({ length: maxRondas }, (_, i) => {
            const step = i + 1;
            const isActive = step === partida.rondaActual;
            const isCompleted = step < partida.rondaActual;

            return (
              <div
                key={step}
                data-testid={`round-step-${step}`}
                data-active={isActive ? 'true' : 'false'}
                data-completed={isCompleted ? 'true' : 'false'}
                className="flex-1 flex flex-col items-center gap-1"
              >
                <div
                  className={`w-full rounded-full transition-all duration-300 ${
                    isActive
                      ? 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)] h-2.5'
                      : isCompleted
                      ? 'bg-amber-600/70 h-1.5'
                      : 'bg-zinc-800 h-1.5'
                  }`}
                />
                <span
                  className={`text-[10px] font-mono transition-colors ${
                    isActive
                      ? 'text-amber-300 font-bold'
                      : isCompleted
                      ? 'text-amber-500/70'
                      : 'text-zinc-600'
                  }`}
                >
                  R{step}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Players List Card */}
      <div className="p-4 rounded-2xl bg-zinc-950/85 border border-zinc-800/80 backdrop-blur-md shadow-lg flex flex-col gap-2.5">
        <span className="text-xs uppercase font-bold tracking-wider text-zinc-300 px-1">
          Jugadores en Partida
        </span>

        <div className="flex flex-col gap-2">
          {partida.jugadores.map((jugador) => {
            const jId = jugador.id ?? jugador.numeroJugador ?? 1;
            const pNum = jugador.numeroJugador ?? jugador.id ?? 1;
            const colorConfig = PLAYER_COLORS[pNum] || PLAYER_COLORS[1];
            const remainingTokens = getRemainingTokens(jugador);
            const isExhausted = remainingTokens === 0;
            const isMe = currentUserId !== undefined
              ? (jugador.id === currentUserId || jugador.numeroJugador === currentUserId)
              : (jugador.numeroJugador === 1);

            return (
              <div
                key={jId}
                data-testid={`player-badge-${jId}`}
                data-player-color={colorConfig.name}
                className={`flex items-center justify-between p-2.5 rounded-xl border ${colorConfig.bg} ${colorConfig.border} transition-all`}
              >
                <div className="flex items-center gap-2.5">
                  <span className={`w-3 h-3 rounded-full border ${colorConfig.border} ${colorConfig.text}`} />
                  <span className="font-semibold text-sm text-zinc-100 truncate max-w-[130px]">
                    {jugador.nombre}
                    {isMe && <span className="text-amber-400 font-normal ml-1.5 text-xs">(Tú)</span>}
                  </span>
                </div>

                <div
                  data-testid={`token-reserve-${jId}`}
                  data-reserve-exhausted={isExhausted ? 'true' : undefined}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-sm font-mono font-bold border ${
                    isExhausted
                      ? 'bg-red-950/60 text-red-400 border-red-700/60'
                      : 'bg-zinc-950/70 text-amber-200 border-amber-500/30'
                  }`}
                >
                  <span>{remainingTokens}</span>
                  <span className="text-xs text-zinc-400 font-sans">tk</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
});

export default StatusPanel;
