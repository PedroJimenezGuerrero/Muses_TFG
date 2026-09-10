'use client';

import React from 'react';
import { observer } from 'mobx-react-lite';
import { gameStore } from '@/store';
import { Trophy, Award, Flame, LogOut, X, User } from 'lucide-react';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProfileModal = observer(({ isOpen, onClose }: ProfileModalProps) => {
  const store = gameStore;

  if (!isOpen) return null;

  const user = store.usuario;
  const username = user?.username || 'Invitado';
  const isGuest = store.isInvitado;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md p-6 bg-zinc-900/95 border border-amber-500/40 rounded-3xl shadow-2xl backdrop-blur-2xl text-amber-50 flex flex-col gap-6">
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        {/* User Header */}
        <div className="flex items-center gap-4 pt-2">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-600 via-amber-400 to-amber-200 flex items-center justify-center text-zinc-950 font-bold text-xl shadow-lg shadow-amber-500/30">
            {username.charAt(0).toUpperCase()}
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-serif font-bold text-amber-100">
                {username}
              </h3>
              {isGuest ? (
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700">
                  Invitado
                </span>
              ) : (
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  Registrado
                </span>
              )}
            </div>
            {user?.email && (
              <span className="text-xs text-zinc-400 font-mono mt-0.5">{user.email}</span>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3.5 rounded-2xl bg-zinc-950/80 border border-zinc-800 flex flex-col items-center justify-center text-center">
            <Trophy className="w-5 h-5 text-amber-400 mb-1" />
            <span className="text-lg font-bold text-amber-200">0</span>
            <span className="text-[10px] uppercase tracking-wider text-zinc-400">Victorias</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-zinc-950/80 border border-zinc-800 flex flex-col items-center justify-center text-center">
            <Flame className="w-5 h-5 text-indigo-400 mb-1" />
            <span className="text-lg font-bold text-indigo-200">0</span>
            <span className="text-[10px] uppercase tracking-wider text-zinc-400">Partidas</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-zinc-950/80 border border-zinc-800 flex flex-col items-center justify-center text-center">
            <Award className="w-5 h-5 text-emerald-400 mb-1" />
            <span className="text-lg font-bold text-emerald-200">0 pts</span>
            <span className="text-[10px] uppercase tracking-wider text-zinc-400">Puntos</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2 pt-2 border-t border-zinc-800">
          <button
            type="button"
            onClick={() => {
              store.logoutUsuario();
              onClose();
            }}
            className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold bg-red-950/40 border border-red-800/40 text-red-300 hover:bg-red-900/50 transition-all flex items-center justify-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            Cerrar Sesión
          </button>
        </div>
      </div>
    </div>
  );
});

export default ProfileModal;
