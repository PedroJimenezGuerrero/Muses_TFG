'use client';

import React, { useState, useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { gameStore } from '@/store';
import {
  Trophy,
  Award,
  Flame,
  LogOut,
  X,
  User,
  Settings,
  BarChart3,
  Clock,
  Sparkles,
  Layers,
  Percent,
  Lock,
  Mail,
  Trash2,
  Check,
  AlertCircle,
  ShieldCheck,
} from 'lucide-react';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProfileModal = observer(({ isOpen, onClose }: ProfileModalProps) => {
  const store = gameStore;
  const [activeTab, setActiveTab] = useState<'stats' | 'edit'>('stats');

  // Estado del formulario de edición de perfil
  const [usernameInput, setUsernameInput] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [confirmPasswordInput, setConfirmPasswordInput] = useState('');
  const [editError, setEditError] = useState<string | null>(null);
  const [editSuccess, setEditSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (isOpen) {
      store.cargarPerfil();
      if (store.usuario) {
        setUsernameInput(store.usuario.username || '');
        setEmailInput(store.usuario.email || '');
      }
      setPasswordInput('');
      setConfirmPasswordInput('');
      setEditError(null);
      setEditSuccess(null);
      setShowDeleteConfirm(false);
    }
  }, [isOpen, store]);

  if (!isOpen) return null;

  const user = store.usuario;
  const username = user?.username || 'Invitado';
  const isGuest = store.isInvitado;
  const stats = user?.estadisticas || {
    partidasJugadas: 0,
    victorias: 0,
    derrotas: 0,
    puntuacionTotal: 0,
    tokensColocados: 0,
    cartasUtilizadas: 0,
    tiempoTotalJuego: 0,
  };

  const partidas = stats.partidasJugadas || 0;
  const victorias = stats.victorias || 0;
  const derrotas = stats.derrotas || 0;
  const puntosTotales = stats.puntuacionTotal || 0;
  const winRate = partidas > 0 ? Math.round((victorias / partidas) * 100) : 0;
  const puntosMedios = partidas > 0 ? (puntosTotales / partidas).toFixed(1) : '0';
  const tiempoMinutos = stats.tiempoTotalJuego || 0;
  const tiempoFormateado =
    tiempoMinutos >= 60
      ? `${Math.floor(tiempoMinutos / 60)}h ${tiempoMinutos % 60}m`
      : `${tiempoMinutos} min`;

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditError(null);
    setEditSuccess(null);

    if (!usernameInput.trim()) {
      setEditError('El nombre de usuario no puede estar vacío');
      return;
    }

    if (passwordInput && passwordInput !== confirmPasswordInput) {
      setEditError('Las contraseñas no coinciden');
      return;
    }

    setIsSubmitting(true);
    const updatePayload: { username?: string; email?: string; password?: string } = {
      username: usernameInput.trim(),
    };
    if (emailInput.trim()) updatePayload.email = emailInput.trim();
    if (passwordInput.trim()) updatePayload.password = passwordInput.trim();

    const ok = await store.actualizarPerfil(updatePayload);
    setIsSubmitting(false);

    if (ok) {
      setEditSuccess('Perfil actualizado correctamente');
      setPasswordInput('');
      setConfirmPasswordInput('');
    } else {
      setEditError('No se pudo actualizar el perfil');
    }
  };

  const handleDeleteAccount = async () => {
    setIsSubmitting(true);
    const ok = await store.eliminarCuenta();
    setIsSubmitting(false);
    if (ok) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg p-6 bg-zinc-900/95 border border-amber-500/40 rounded-3xl shadow-2xl backdrop-blur-2xl text-amber-50 flex flex-col gap-5 max-h-[90vh] overflow-y-auto">
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
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-600 via-amber-400 to-amber-200 flex items-center justify-center text-zinc-950 font-bold text-xl shadow-lg shadow-amber-500/30 shrink-0">
            {username.charAt(0).toUpperCase()}
          </div>
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-xl font-serif font-bold text-amber-100 truncate">
                {username}
              </h3>
              {isGuest ? (
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700">
                  Invitado
                </span>
              ) : (
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  Registrado
                </span>
              )}
            </div>
            {user?.email && (
              <span className="text-xs text-zinc-400 font-mono mt-0.5 truncate">{user.email}</span>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex rounded-xl bg-zinc-950/80 p-1 border border-zinc-800">
          <button
            type="button"
            onClick={() => setActiveTab('stats')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'stats'
                ? 'bg-amber-500/20 text-amber-300 shadow-sm border border-amber-500/30'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            Estadísticas
          </button>
          {!isGuest && (
            <button
              type="button"
              onClick={() => setActiveTab('edit')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'edit'
                  ? 'bg-amber-500/20 text-amber-300 shadow-sm border border-amber-500/30'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Settings className="w-4 h-4" />
              Editar Perfil
            </button>
          )}
        </div>

        {/* Pestaña Estadísticas */}
        {activeTab === 'stats' && (
          <div className="flex flex-col gap-4">
            {isGuest && (
              <div className="p-3 rounded-xl bg-amber-950/20 border border-amber-500/30 text-xs text-amber-200/80 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>
                  Estás jugando como <strong>invitado</strong>. Crea una cuenta para acumular y guardar victorias y puntuaciones.
                </span>
              </div>
            )}

            {/* Grid 4 columnas principales */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="p-3 rounded-2xl bg-zinc-950/80 border border-zinc-800 flex flex-col items-center justify-center text-center">
                <Trophy className="w-5 h-5 text-amber-400 mb-1" />
                <span className="text-xl font-bold text-amber-200">{victorias}</span>
                <span className="text-[10px] uppercase tracking-wider text-zinc-400">Victorias</span>
              </div>

              <div className="p-3 rounded-2xl bg-zinc-950/80 border border-zinc-800 flex flex-col items-center justify-center text-center">
                <Flame className="w-5 h-5 text-indigo-400 mb-1" />
                <span className="text-xl font-bold text-indigo-200">{partidas}</span>
                <span className="text-[10px] uppercase tracking-wider text-zinc-400">Partidas</span>
              </div>

              <div className="p-3 rounded-2xl bg-zinc-950/80 border border-zinc-800 flex flex-col items-center justify-center text-center">
                <ShieldCheck className="w-5 h-5 text-rose-400 mb-1" />
                <span className="text-xl font-bold text-rose-200">{derrotas}</span>
                <span className="text-[10px] uppercase tracking-wider text-zinc-400">Derrotas</span>
              </div>

              <div className="p-3 rounded-2xl bg-zinc-950/80 border border-zinc-800 flex flex-col items-center justify-center text-center">
                <Percent className="w-5 h-5 text-cyan-400 mb-1" />
                <span className="text-xl font-bold text-cyan-200">{winRate}%</span>
                <span className="text-[10px] uppercase tracking-wider text-zinc-400">Victoria</span>
              </div>
            </div>

            {/* Grid Detalles */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="p-3 rounded-2xl bg-zinc-950/80 border border-zinc-800 flex items-center gap-3">
                <Award className="w-6 h-6 text-emerald-400 shrink-0" />
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-emerald-200">{puntosTotales} pts</span>
                  <span className="text-[10px] uppercase tracking-wider text-zinc-400">Puntos Totales</span>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-zinc-950/80 border border-zinc-800 flex items-center gap-3">
                <Sparkles className="w-6 h-6 text-teal-400 shrink-0" />
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-teal-200">{puntosMedios} pts</span>
                  <span className="text-[10px] uppercase tracking-wider text-zinc-400">Media / Partida</span>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-zinc-950/80 border border-zinc-800 flex items-center gap-3">
                <Layers className="w-6 h-6 text-orange-400 shrink-0" />
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-orange-200">{stats.tokensColocados || 0}</span>
                  <span className="text-[10px] uppercase tracking-wider text-zinc-400">Tokens Colocados</span>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-zinc-950/80 border border-zinc-800 flex items-center gap-3">
                <Clock className="w-6 h-6 text-blue-400 shrink-0" />
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-blue-200">{tiempoFormateado}</span>
                  <span className="text-[10px] uppercase tracking-wider text-zinc-400">Tiempo Jugado</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Pestaña Editar Perfil */}
        {activeTab === 'edit' && !isGuest && (
          <form onSubmit={handleUpdateProfile} className="flex flex-col gap-3.5">
            {editError && (
              <div className="p-3 rounded-xl bg-red-950/30 border border-red-800/50 text-xs text-red-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                <span>{editError}</span>
              </div>
            )}
            {editSuccess && (
              <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-800/50 text-xs text-emerald-300 flex items-center gap-2">
                <Check className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>{editSuccess}</span>
              </div>
            )}

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-amber-400" />
                Nombre de Usuario
              </label>
              <input
                type="text"
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-zinc-950/90 border border-zinc-800 text-sm text-amber-50 focus:outline-none focus:border-amber-500/70 transition-all font-mono"
                placeholder="Nombre de usuario"
                required
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-amber-400" />
                Correo Electrónico
              </label>
              <input
                type="email"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-zinc-950/90 border border-zinc-800 text-sm text-amber-50 focus:outline-none focus:border-amber-500/70 transition-all font-mono"
                placeholder="correo@ejemplo.com"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-amber-400" />
                  Nueva Contraseña
                </label>
                <input
                  type="password"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-zinc-950/90 border border-zinc-800 text-sm text-amber-50 focus:outline-none focus:border-amber-500/70 transition-all"
                  placeholder="••••••••"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-amber-400" />
                  Confirmar Contraseña
                </label>
                <input
                  type="password"
                  value={confirmPasswordInput}
                  onChange={(e) => setConfirmPasswordInput(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-zinc-950/90 border border-zinc-800 text-sm text-amber-50 focus:outline-none focus:border-amber-500/70 transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-1 w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-amber-500/20 border border-amber-500/50 text-amber-300 hover:bg-amber-500/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              Guardar Cambios
            </button>

            {/* Zona de Peligro */}
            <div className="mt-2 pt-3 border-t border-zinc-800 flex flex-col gap-2">
              <span className="text-[11px] font-semibold text-red-400/90 uppercase tracking-wider">
                Zona de Peligro
              </span>
              {!showDeleteConfirm ? (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="py-2 px-3 rounded-xl text-xs text-zinc-400 hover:text-red-300 hover:bg-red-950/30 border border-transparent hover:border-red-900/40 transition-all flex items-center justify-start gap-2"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Eliminar mi cuenta definitivamente
                </button>
              ) : (
                <div className="p-3 rounded-xl bg-red-950/40 border border-red-800/60 flex flex-col gap-2">
                  <span className="text-xs text-red-200">
                    ¿Estás seguro? Esta acción borrará todas tus estadísticas y partidas de forma permanente.
                  </span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={handleDeleteAccount}
                      className="flex-1 py-1.5 px-3 rounded-lg text-xs font-bold bg-red-600 hover:bg-red-500 text-white transition-all disabled:opacity-50"
                    >
                      Sí, Eliminar Cuenta
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowDeleteConfirm(false)}
                      className="py-1.5 px-3 rounded-lg text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-all"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
            </div>
          </form>
        )}

        {/* Cerrar Sesión */}
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

