'use client';

import React, { useState } from 'react';
import { observer } from 'mobx-react-lite';
import { gameStore } from '@/store';
import { Users, Bot, PlusCircle, LogIn, Play, Copy, Check } from 'lucide-react';

export const LobbyView = observer(() => {
  const store = gameStore;
  const [activeTab, setActiveTab] = useState<'BOT' | 'CREAR' | 'UNIRSE'>('BOT');
  const [maxJugadores, setMaxJugadores] = useState<number>(3);
  const [codigoInput, setCodigoInput] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  const handleCopyCode = (codigo: string) => {
    navigator.clipboard.writeText(codigo);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Si ya estamos en una sala creada/unida
  if (store.sala) {
    const isAnfitrion = store.sala.anfitrion?.id === store.jugadorActualId || true;

    return (
      <div className="w-full max-w-xl mx-auto p-6 bg-zinc-900/90 border border-amber-500/30 rounded-3xl shadow-2xl backdrop-blur-xl flex flex-col items-center gap-6">
        <div className="text-center">
          <span className="text-xs uppercase tracking-widest text-amber-400 font-semibold">
            Sala de Espera
          </span>
          <h2 className="text-3xl font-serif font-bold text-amber-100 mt-1">
            {store.sala.codigo}
          </h2>
          <button
            type="button"
            onClick={() => handleCopyCode(store.sala?.codigo || '')}
            className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs bg-zinc-800 border border-zinc-700 hover:border-amber-400 text-zinc-300 transition-all"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-amber-400" />}
            {copied ? '¡Código copiado!' : 'Copiar código para amigos'}
          </button>
        </div>

        {/* Lista de Jugadores */}
        <div className="w-full space-y-3">
          <div className="flex justify-between text-xs text-zinc-400 font-medium px-2">
            <span>Jugadores ({store.sala.jugadores.length} / {store.sala.maxJugadores})</span>
            <span>Estado: Esperando...</span>
          </div>

          <div className="space-y-2">
            {store.sala.jugadores.map((jugador, idx) => (
              <div
                key={jugador.id || idx}
                className="flex items-center justify-between p-3.5 rounded-2xl bg-zinc-950/80 border border-zinc-800"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-600 to-amber-400 flex items-center justify-center text-xs font-bold text-black shadow-md">
                    {idx + 1}
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-zinc-200">
                      {jugador.nombre}
                    </span>
                    {idx === 0 && (
                      <span className="ml-2 text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        Anfitrión
                      </span>
                    )}
                  </div>
                </div>
                <span className="text-xs text-emerald-400 font-medium flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Listo
                </span>
              </div>
            ))}

            {/* Espacios vacíos */}
            {Array.from({ length: Math.max(0, store.sala.maxJugadores - store.sala.jugadores.length) }).map((_, i) => (
              <div
                key={`empty-${i}`}
                className="flex items-center justify-between p-3 rounded-2xl border border-dashed border-zinc-800 text-zinc-600 text-xs px-4"
              >
                <span>Esperando jugador {store.sala!.jugadores.length + i + 1}...</span>
                <Users className="w-4 h-4 text-zinc-700" />
              </div>
            ))}
          </div>
        </div>

        {/* Acciones de la Sala */}
        <div className="w-full flex flex-col gap-3 pt-2">
          {isAnfitrion && (
            <button
              type="button"
              onClick={() => store.iniciarPartidaDesdeSala()}
              disabled={store.sala.jugadores.length < 2}
              className="w-full py-3.5 px-6 rounded-2xl font-bold text-sm tracking-wide bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 text-zinc-950 hover:brightness-110 active:scale-[0.99] transition-all shadow-lg shadow-amber-500/20 disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center gap-2"
            >
              <Play className="w-4 h-4 fill-current" />
              {store.sala.jugadores.length < 2
                ? 'Se necesitan mínimo 2 jugadores'
                : 'Comenzar Partida'}
            </button>
          )}

          <button
            type="button"
            onClick={() => store.abandonarSala()}
            className="w-full py-2.5 rounded-xl text-xs font-semibold text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60 transition-all"
          >
            Salir de la sala
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-xl mx-auto p-6 bg-zinc-900/90 border border-zinc-800 rounded-3xl shadow-2xl backdrop-blur-xl flex flex-col items-center gap-6">
      <div className="text-center">
        <span className="text-xs uppercase tracking-widest text-amber-400 font-semibold">
          Lobby Principal
        </span>
        <h2 className="text-2xl font-serif font-bold text-amber-100 mt-1">
          Elige Modo de Juego
        </h2>
        <p className="text-xs text-zinc-400 mt-1 max-w-sm">
          Juega una partida rápida contra la IA o invita a tus amigos a una sala privada.
        </p>
      </div>

      {/* Tabs Selector */}
      <div className="grid grid-cols-3 gap-1.5 p-1.5 bg-zinc-950/80 rounded-2xl border border-zinc-800 w-full">
        <button
          type="button"
          onClick={() => setActiveTab('BOT')}
          className={`py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
            activeTab === 'BOT'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Bot className="w-4 h-4" />
          Contra Bots
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('CREAR')}
          className={`py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
            activeTab === 'CREAR'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <PlusCircle className="w-4 h-4" />
          Crear Sala
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('UNIRSE')}
          className={`py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
            activeTab === 'UNIRSE'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <LogIn className="w-4 h-4" />
          Unirse
        </button>
      </div>

      {/* Tab Content */}
      <div className="w-full">
        {activeTab === 'BOT' && (
          <div className="flex flex-col gap-4 text-center">
            <div className="p-4 rounded-2xl bg-zinc-950/50 border border-zinc-800 text-left">
              <span className="text-xs font-bold text-amber-300 uppercase tracking-wider block mb-1">
                Partida en Solitario
              </span>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Jugarás como Apolo contra 2 adversarios controlados por la heurística voraz del servidor (Atenea y Hermes).
              </p>
            </div>

            <button
              type="button"
              onClick={() => store.iniciarPartidaContraBots()}
              className="w-full py-3.5 px-6 rounded-2xl font-bold text-sm tracking-wide bg-gradient-to-r from-amber-500 to-amber-600 text-zinc-950 hover:brightness-110 active:scale-[0.99] transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2"
            >
              <Play className="w-4 h-4 fill-current" />
              Iniciar Partida Rápida
            </button>
          </div>
        )}

        {activeTab === 'CREAR' && (
          <div className="flex flex-col gap-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-300 block">
                Número de Jugadores (incluyéndote):
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[2, 3, 4, 5].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setMaxJugadores(num)}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                      maxJugadores === num
                        ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-md'
                        : 'bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                    }`}
                  >
                    {num} Jugadores
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={() => store.crearSala(maxJugadores)}
              className="w-full py-3.5 px-6 rounded-2xl font-bold text-sm tracking-wide bg-gradient-to-r from-amber-500 to-amber-600 text-zinc-950 hover:brightness-110 active:scale-[0.99] transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2"
            >
              <PlusCircle className="w-4 h-4" />
              Generar Sala y Código
            </button>
          </div>
        )}

        {activeTab === 'UNIRSE' && (
          <div className="flex flex-col gap-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-300 block">
                Introduce el Código de Sala:
              </label>
              <input
                type="text"
                placeholder="MUS-XXXX"
                value={codigoInput}
                onChange={(e) => setCodigoInput(e.target.value.toUpperCase())}
                maxLength={8}
                className="w-full px-4 py-3 rounded-2xl bg-zinc-950 border border-zinc-700 focus:border-amber-400 focus:outline-none text-center font-mono text-lg tracking-widest text-amber-200 placeholder:text-zinc-600"
              />
            </div>

            <button
              type="button"
              disabled={!codigoInput.trim()}
              onClick={() => store.unirseASala(codigoInput.trim())}
              className="w-full py-3.5 px-6 rounded-2xl font-bold text-sm tracking-wide bg-gradient-to-r from-amber-500 to-amber-600 text-zinc-950 hover:brightness-110 active:scale-[0.99] transition-all shadow-lg shadow-amber-500/20 disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center gap-2"
            >
              <LogIn className="w-4 h-4" />
              Unirse a la Sala
            </button>
          </div>
        )}
      </div>
    </div>
  );
});

export default LobbyView;
