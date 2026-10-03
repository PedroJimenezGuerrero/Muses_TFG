import React from 'react';
import { observer } from 'mobx-react-lite';
import { motion, AnimatePresence } from 'motion/react';
import { PlannedAction } from '@/store/GameStore';
import { Layers, Sparkles, Sun, Moon, Orbit, Wand2 } from 'lucide-react';

export interface ActionResolutionStackProps {
  currentAction: PlannedAction | null;
  pendingActions: PlannedAction[];
  className?: string;
}

const PLAYER_THEMES: Record<number, { bg: string; border: string; glow: string; text: string; badge: string }> = {
  1: {
    bg: 'from-amber-950/80 via-zinc-950/80 to-black/80',
    border: 'border-amber-400/80',
    glow: 'shadow-[0_0_35px_rgba(251,191,36,0.35)]',
    text: 'text-amber-200',
    badge: 'bg-amber-500 text-black',
  },
  2: {
    bg: 'from-blue-950/80 via-zinc-950/80 to-black/80',
    border: 'border-blue-400/80',
    glow: 'shadow-[0_0_35px_rgba(96,165,250,0.35)]',
    text: 'text-blue-200',
    badge: 'bg-blue-500 text-white',
  },
  3: {
    bg: 'from-red-950/80 via-zinc-950/80 to-black/80',
    border: 'border-red-400/80',
    glow: 'shadow-[0_0_35px_rgba(248,113,113,0.35)]',
    text: 'text-red-200',
    badge: 'bg-red-500 text-white',
  },
  4: {
    bg: 'from-emerald-950/80 via-zinc-950/80 to-black/80',
    border: 'border-emerald-400/80',
    glow: 'shadow-[0_0_35px_rgba(52,211,153,0.35)]',
    text: 'text-emerald-200',
    badge: 'bg-emerald-500 text-black',
  },
};

export const ActionResolutionStack = observer<ActionResolutionStackProps>(({
  currentAction,
  pendingActions,
  className = '',
}) => {
  if (!currentAction && pendingActions.length === 0) {
    return null;
  }

  const getActionIcon = (tipo: string) => {
    switch (tipo) {
      case 'DEVOCION_SOL':
        return <Sun className="w-7 h-7 text-amber-400 animate-spin-slow" />;
      case 'DEVOCION_LUNA':
        return <Moon className="w-7 h-7 text-indigo-400 drop-shadow-[0_0_10px_rgba(99,102,241,0.8)]" />;
      case 'REVOLUCION_SOL':
        return <Orbit className="w-7 h-7 text-amber-300 animate-spin" />;
      case 'REVOLUCION_LUNA':
        return <Orbit className="w-7 h-7 text-indigo-300 animate-spin" />;
      case 'INSPIRACION':
        return <Wand2 className="w-7 h-7 text-purple-400 animate-pulse" />;
      default:
        return <Sparkles className="w-7 h-7 text-amber-400" />;
    }
  };

  const activeTheme = currentAction
    ? PLAYER_THEMES[currentAction.jugadorNumero] || PLAYER_THEMES[1]
    : PLAYER_THEMES[1];

  return (
    <div
      role="region"
      aria-label="Pila de resolución de acciones"
      data-testid="action-resolution-stack"
      className={`absolute inset-0 z-50 pointer-events-none flex flex-col items-center justify-center p-2 ${className}`}
    >
      {/* Background Dim Vignette over Board Grid (No blur, transparent to see moving tokens/cards) */}
      <div className="absolute inset-0 bg-black/25 rounded-3xl transition-opacity duration-300 pointer-events-none border border-amber-500/20" />

      {/* Center Card Stack Container */}
      <div className="relative z-10 flex flex-col items-center max-w-lg w-full">
        {/* Stack Header Badge */}
        <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-black/80 border border-amber-400/50 text-xs uppercase font-bold tracking-widest text-amber-300 mb-2.5 shadow-xl animate-bounce">
          <Layers className="w-4 h-4 text-amber-400" />
          <span>Pila de Acciones de la Ronda</span>
        </div>

        {/* Top Active Action Card (Hero Card) */}
        <AnimatePresence mode="wait">
          {currentAction && (
            <motion.div
              key={`active-${currentAction.jugadorId}-${currentAction.tipoAccion}-${currentAction.prioridad}`}
              initial={{ scale: 0.8, opacity: 0, y: 25 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.85, opacity: 0, y: -30 }}
              transition={{ type: 'spring', stiffness: 280, damping: 22 }}
              className={`relative w-80 sm:w-[420px] p-5 rounded-3xl bg-gradient-to-b ${activeTheme.bg} border-2 ${activeTheme.border} ${activeTheme.glow} pointer-events-auto z-30 flex flex-col gap-3 shadow-2xl`}
            >
              {/* Card Header: Player Info & Priority Badge */}
              <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-3">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shadow-md ${activeTheme.badge}`}
                  >
                    {currentAction.jugadorNombre.charAt(0).toUpperCase()}
                  </div>
                  <span className={`font-bold text-sm sm:text-base truncate max-w-[200px] ${activeTheme.text}`}>
                    {currentAction.jugadorNombre}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-xs uppercase font-mono font-bold px-3 py-1 rounded-full bg-white/10 text-amber-300 border border-amber-400/40 shadow-sm">
                    Prio {currentAction.prioridad}
                  </span>
                </div>
              </div>

              {/* Action Body: Large Icon & Action Description */}
              <div className="flex items-center gap-4 py-1">
                <div className="w-14 h-14 rounded-2xl bg-black/50 border border-white/15 flex items-center justify-center shrink-0 shadow-inner">
                  {getActionIcon(currentAction.tipoAccion)}
                </div>
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="font-serif font-black text-lg sm:text-xl text-amber-100 truncate">
                    {currentAction.cartaNombre}
                  </span>
                  <span className="text-xs text-amber-300/90 font-medium leading-relaxed mt-0.5">
                    {currentAction.detalle || 'Ejecutando acción de la ronda...'}
                  </span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Stack of Pending Actions Underneath */}
        {pendingActions.length > 0 && (
          <div className="w-full mt-2 flex flex-col items-center gap-1.5 pointer-events-auto">
            {pendingActions.map((act, index) => {
              const theme = PLAYER_THEMES[act.jugadorNumero] || PLAYER_THEMES[1];
              const offsetScale = 1 - (index + 1) * 0.04;
              const opacity = 1 - (index + 1) * 0.15;

              return (
                <motion.div
                  key={`pending-${act.jugadorId}-${act.tipoAccion}-${act.prioridad}-${index}`}
                  layout
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity, y: 0, scale: offsetScale }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ type: 'spring', stiffness: 350, damping: 28 }}
                  className="w-76 sm:w-[390px] px-4 py-2 rounded-2xl bg-zinc-950/80 border border-zinc-700/60 shadow-lg flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${theme.badge}`}
                    >
                      {act.jugadorNombre.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-xs sm:text-sm font-semibold text-zinc-200 truncate max-w-[160px]">
                      {act.jugadorNombre}
                    </span>
                    <span className="text-xs text-zinc-400 truncate">
                      • {act.cartaNombre}
                    </span>
                  </div>

                  <span className="text-xs font-mono font-bold text-amber-300/90 bg-zinc-900 border border-amber-500/20 px-2 py-0.5 rounded-lg shrink-0">
                    Prio {act.prioridad}
                  </span>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
});

export default ActionResolutionStack;
