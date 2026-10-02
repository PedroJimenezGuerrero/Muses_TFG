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

const PLAYER_COLORS: Record<number, { bg: string; border: string; text: string; badge: string }> = {
  1: {
    bg: 'from-amber-950/90 to-zinc-950/95',
    border: 'border-amber-400/60',
    text: 'text-amber-200',
    badge: 'bg-amber-500 text-black',
  },
  2: {
    bg: 'from-blue-950/90 to-zinc-950/95',
    border: 'border-blue-400/60',
    text: 'text-blue-200',
    badge: 'bg-blue-500 text-white',
  },
  3: {
    bg: 'from-red-950/90 to-zinc-950/95',
    border: 'border-red-400/60',
    text: 'text-red-200',
    badge: 'bg-red-500 text-white',
  },
  4: {
    bg: 'from-emerald-950/90 to-zinc-950/95',
    border: 'border-emerald-400/60',
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
        return <Sun className="w-4 h-4 text-amber-400 animate-spin-slow" />;
      case 'DEVOCION_LUNA':
        return <Moon className="w-4 h-4 text-indigo-400" />;
      case 'REVOLUCION_SOL':
        return <Orbit className="w-4 h-4 text-amber-300 animate-spin" />;
      case 'REVOLUCION_LUNA':
        return <Orbit className="w-4 h-4 text-indigo-300 animate-spin" />;
      case 'INSPIRACION':
        return <Wand2 className="w-4 h-4 text-purple-400 animate-pulse" />;
      default:
        return <Sparkles className="w-4 h-4 text-amber-400" />;
    }
  };

  const activeTheme = currentAction
    ? PLAYER_COLORS[currentAction.jugadorNumero] || PLAYER_COLORS[1]
    : PLAYER_COLORS[1];

  return (
    <div
      role="region"
      aria-label="Pila de resolución de acciones"
      data-testid="action-resolution-stack"
      className={`relative flex flex-col items-center select-none pointer-events-none z-50 ${className}`}
    >
      <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/70 border border-amber-500/30 text-[10px] uppercase font-bold tracking-widest text-amber-300 mb-2 backdrop-blur-md shadow-lg">
        <Layers className="w-3.5 h-3.5 text-amber-400" />
        <span>Pila de Acciones</span>
      </div>

      <div className="relative w-72 sm:w-80 flex flex-col items-center">
        {/* Top Active Action Card */}
        <AnimatePresence mode="wait">
          {currentAction && (
            <motion.div
              key={`active-${currentAction.jugadorId}-${currentAction.tipoAccion}-${currentAction.prioridad}`}
              initial={{ scale: 0.8, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.85, opacity: 0, y: -20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className={`relative w-full p-3.5 rounded-2xl bg-gradient-to-b ${activeTheme.bg} border-2 ${activeTheme.border} shadow-[0_0_30px_rgba(251,191,36,0.35)] backdrop-blur-xl pointer-events-auto z-30`}
            >
              {/* Header: Player Info & Priority */}
              <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-2 mb-2">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs shadow ${activeTheme.badge}`}
                  >
                    {currentAction.jugadorNombre.charAt(0).toUpperCase()}
                  </div>
                  <span className={`font-bold text-xs truncate max-w-[140px] ${activeTheme.text}`}>
                    {currentAction.jugadorNombre}
                  </span>
                </div>

                <span className="text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded-full bg-white/10 text-amber-300 border border-white/15">
                  Prio {currentAction.prioridad}
                </span>
              </div>

              {/* Action Body */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-black/50 border border-white/10 flex items-center justify-center shrink-0 shadow-inner">
                  {getActionIcon(currentAction.tipoAccion)}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="font-serif font-bold text-sm text-amber-100 truncate">
                    {currentAction.cartaNombre}
                  </span>
                  <span className="text-[10px] text-amber-400/90 font-medium leading-tight">
                    Ejecutando acción...
                  </span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Stack of Pending Actions Underneath */}
        {pendingActions.length > 0 && (
          <div className="w-full mt-1.5 flex flex-col gap-1.5 pointer-events-auto">
            {pendingActions.slice(0, 3).map((act, index) => {
              const theme = PLAYER_COLORS[act.jugadorNumero] || PLAYER_COLORS[1];
              const offsetScale = 1 - (index + 1) * 0.04;
              const opacity = 1 - (index + 1) * 0.18;

              return (
                <motion.div
                  key={`pending-${act.jugadorId}-${act.tipoAccion}-${act.prioridad}-${index}`}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity, y: 0, scale: offsetScale }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ type: 'spring', stiffness: 350, damping: 28 }}
                  className={`w-full px-3 py-1.5 rounded-xl bg-zinc-950/80 border border-zinc-700/60 backdrop-blur-md shadow-md flex items-center justify-between gap-2`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div
                      className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold ${theme.badge}`}
                    >
                      {act.jugadorNombre.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-[11px] font-semibold text-zinc-300 truncate max-w-[130px]">
                      {act.jugadorNombre}
                    </span>
                    <span className="text-[10px] text-zinc-400 truncate">
                      • {act.cartaNombre}
                    </span>
                  </div>

                  <span className="text-[9px] font-mono text-zinc-400 bg-zinc-800/80 px-1.5 py-0.5 rounded shrink-0">
                    P{act.prioridad}
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
