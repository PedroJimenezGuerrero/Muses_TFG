'use client';

import React, { useState } from 'react';
import { observer } from 'mobx-react-lite';
import { gameStore } from '@/store';
import { Shield, UserPlus, LogIn, User, Sparkles, X } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal = observer(({ isOpen, onClose }: AuthModalProps) => {
  const store = gameStore;
  const [tab, setTab] = useState<'LOGIN' | 'REGISTER' | 'GUEST'>('LOGIN');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [guestName, setGuestName] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!username.trim()) {
      setErrorMsg('Por favor introduce tu nombre de usuario.');
      return;
    }
    setLoading(true);
    try {
      await store.loginUsuario(username.trim(), password);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al iniciar sesión.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!username.trim() || !email.trim() || !password.trim()) {
      setErrorMsg('Todos los campos son obligatorios.');
      return;
    }
    setLoading(true);
    try {
      await store.registrarUsuario(username.trim(), email.trim(), password);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al registrar usuario.');
    } finally {
      setLoading(false);
    }
  };

  const handleGuest = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    const name = guestName.trim() || `Invitado_${Math.floor(Math.random() * 900 + 100)}`;
    store.loginInvitado(name);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md p-6 bg-zinc-900/95 border border-amber-500/40 rounded-3xl shadow-2xl backdrop-blur-2xl text-amber-50 flex flex-col gap-5">
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title */}
        <div className="text-center pt-2">
          <div className="inline-flex p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 mb-2">
            <Shield className="w-7 h-7" />
          </div>
          <h3 className="text-2xl font-serif font-bold text-amber-100">
            Identificación de Jugador
          </h3>
          <p className="text-xs text-zinc-400 mt-1">
            Guarda tus estadísticas, sube al Olimpo y juega salas online.
          </p>
        </div>

        {/* Mode Selector */}
        <div className="grid grid-cols-3 gap-1 p-1 bg-zinc-950/80 rounded-2xl border border-zinc-800 text-xs font-semibold">
          <button
            type="button"
            onClick={() => { setTab('LOGIN'); setErrorMsg(null); }}
            className={`py-2 px-3 rounded-xl transition-all ${
              tab === 'LOGIN'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Iniciar Sesión
          </button>
          <button
            type="button"
            onClick={() => { setTab('REGISTER'); setErrorMsg(null); }}
            className={`py-2 px-3 rounded-xl transition-all ${
              tab === 'REGISTER'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Registrarse
          </button>
          <button
            type="button"
            onClick={() => { setTab('GUEST'); setErrorMsg(null); }}
            className={`py-2 px-3 rounded-xl transition-all ${
              tab === 'GUEST'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Invitado
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-red-950/50 border border-red-500/40 text-red-300 text-xs text-center font-medium">
            {errorMsg}
          </div>
        )}

        {/* Forms */}
        {tab === 'LOGIN' && (
          <form onSubmit={handleLogin} className="flex flex-col gap-3">
            <div>
              <label className="text-xs font-medium text-zinc-300 block mb-1">Nombre de usuario</label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Ej. Apolo"
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-700 text-amber-100 placeholder:text-zinc-600 focus:border-amber-400 focus:outline-none text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-zinc-300 block mb-1">Contraseña</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-700 text-amber-100 placeholder:text-zinc-600 focus:border-amber-400 focus:outline-none text-sm"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full py-3 px-4 rounded-xl font-bold text-sm bg-gradient-to-r from-amber-500 to-amber-600 text-zinc-950 hover:brightness-110 active:scale-[0.99] transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2"
            >
              <LogIn className="w-4 h-4" />
              {loading ? 'Accediendo...' : 'Entrar a Muses'}
            </button>
          </form>
        )}

        {tab === 'REGISTER' && (
          <form onSubmit={handleRegister} className="flex flex-col gap-3">
            <div>
              <label className="text-xs font-medium text-zinc-300 block mb-1">Nombre de usuario</label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Ej. Dioniso"
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-700 text-amber-100 placeholder:text-zinc-600 focus:border-amber-400 focus:outline-none text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-zinc-300 block mb-1">Correo electrónico</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="usuario@olimpo.com"
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-700 text-amber-100 placeholder:text-zinc-600 focus:border-amber-400 focus:outline-none text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-zinc-300 block mb-1">Contraseña</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-700 text-amber-100 placeholder:text-zinc-600 focus:border-amber-400 focus:outline-none text-sm"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full py-3 px-4 rounded-xl font-bold text-sm bg-gradient-to-r from-amber-500 to-amber-600 text-zinc-950 hover:brightness-110 active:scale-[0.99] transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2"
            >
              <UserPlus className="w-4 h-4" />
              {loading ? 'Creando cuenta...' : 'Crear Cuenta'}
            </button>
          </form>
        )}

        {tab === 'GUEST' && (
          <form onSubmit={handleGuest} className="flex flex-col gap-3">
            <div className="p-3.5 rounded-xl bg-zinc-950/50 border border-zinc-800 text-xs text-zinc-400 leading-relaxed">
              Jugar como invitado te permite participar inmediatamente en salas y partidas contra bots, sin necesidad de contraseña.
            </div>
            <div>
              <label className="text-xs font-medium text-zinc-300 block mb-1">Apodo de Invitado (Opcional)</label>
              <input
                type="text"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                placeholder="Ej. Filósofo_42"
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-700 text-amber-100 placeholder:text-zinc-600 focus:border-amber-400 focus:outline-none text-sm"
              />
            </div>
            <button
              type="submit"
              className="mt-2 w-full py-3 px-4 rounded-xl font-bold text-sm bg-gradient-to-r from-amber-500 to-amber-600 text-zinc-950 hover:brightness-110 active:scale-[0.99] transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              Continuar como Invitado
            </button>
          </form>
        )}
      </div>
    </div>
  );
});

export default AuthModal;
