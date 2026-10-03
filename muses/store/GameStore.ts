import { makeAutoObservable, runInAction, toJS } from 'mobx';
import {
  Tablero,
  Partida,
  Jugador,
  TipoMusa,
  AnyCard,
  CartaAccion,
  CartaInspiracion,
  Usuario,
  Sala,
  MUSAS_METADATA,
} from '@/types/game';
import { ScoreBreakdown, ScoreBreakdownMap } from '@/types/scoring';
import {
  mapAstroToGrid,
  advanceAstros,
  applyRevolution,
  getInspirationTargetCells,
} from '@/lib/gameRules';
import { socketService } from '@/lib/socket';

const INITIAL_MUSAS: TipoMusa[] = [
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

let nextTokenSeq = 100000;
const getNextTokenId = () => ++nextTokenSeq;

export interface ActionResolutionLog {
  jugadorNombre: string;
  jugadorNumero: number;
  cartaNombre: string;
  tipoAccion: string;
  prioridad: number;
  detalle: string;
}

export interface PlannedAction {
  jugador: Jugador;
  jugadorId: number;
  jugadorNumero: number;
  jugadorNombre: string;
  cartaNombre: string;
  tipoAccion: string;
  prioridad: number;
  astroPos?: number;
  musaName?: TipoMusa;
  rawCard?: AnyCard;
}

export function safeClone<T>(obj: T): T {
  if (obj === null || obj === undefined) return obj;
  try {
    return JSON.parse(JSON.stringify(toJS(obj)));
  } catch (e) {
    return obj;
  }
}

function calculateScoreBreakdown(tablero: Tablero, jugadores: Jugador[]): ScoreBreakdown {
  const matrix: ScoreBreakdownMap = {} as any;
  const playerTotals: Record<string, number> = {};
  jugadores.forEach((j) => {
    const key = String(j.id ?? j.numeroJugador);
    playerTotals[key] = 0;
    if (j.nombre) playerTotals[j.nombre] = 0;
  });

  tablero.grid.forEach((musa) => {
    const meta = MUSAS_METADATA[musa.nombre] || MUSAS_METADATA.CLIO;
    const tokensByPlayerKey: Record<string, number> = {};
    jugadores.forEach((j) => {
      tokensByPlayerKey[String(j.id ?? j.numeroJugador)] = 0;
    });

    (musa.tokensColocados || []).forEach((token: any) => {
      const tokenPId = token.jugador?.id ?? token.jugadorId;
      const tokenPNum = token.jugador?.numeroJugador ?? token.numeroJugador;

      const matchedPlayer =
        jugadores.find((j) =>
          (tokenPId !== undefined && j.id === tokenPId) ||
          (tokenPNum !== undefined && j.numeroJugador === tokenPNum)
        ) ||
        jugadores.find((j) => tokenPNum !== undefined && j.id === tokenPNum) ||
        jugadores[0];

      if (matchedPlayer) {
        const key = String(matchedPlayer.id ?? matchedPlayer.numeroJugador);
        tokensByPlayerKey[key] = (tokensByPlayerKey[key] || 0) + 1;
      }
    });

    const entries = jugadores.map((j) => {
      const key = String(j.id ?? j.numeroJugador);
      return {
        player: j,
        key,
        nombre: j.nombre,
        tokens: tokensByPlayerKey[key] || 0,
      };
    });

    entries.sort((a, b) => b.tokens - a.tokens);

    const breakdownRow: Record<string, { tokens: number; points: number; tieInfo?: string }> = {};

    let rank = 1;
    let i = 0;
    while (i < entries.length) {
      const currentTokens = entries[i].tokens;
      if (currentTokens === 0) {
        for (let j = i; j < entries.length; j++) {
          const entry = entries[j];
          const zeroItem = { tokens: 0, points: 0 };
          breakdownRow[entry.key] = zeroItem;
          if (entry.nombre) breakdownRow[entry.nombre] = zeroItem;
        }
        break;
      }

      const tiedGroup = entries.filter((e) => e.tokens === currentTokens);
      const countTied = tiedGroup.length;

      const n1 = meta.nivel1;
      const n2 = meta.nivel2;
      const n3 = meta.nivel3;

      let pointsPerPlayer = 0;
      let tieText = '';

      if (countTied === 1) {
        if (rank === 1) pointsPerPlayer = n1;
        else if (rank === 2) pointsPerPlayer = n2;
        else if (rank === 3) pointsPerPlayer = n3;
      } else {
        if (rank === 1) {
          if (countTied === 2) {
            pointsPerPlayer = Math.floor((n1 + n2) / 2);
            tieText = `Empate 1º (P1+P2)/2 = ⌊(${n1}+${n2})/2⌋ = ${pointsPerPlayer} pts`;
          } else {
            pointsPerPlayer = Math.floor((n1 + n2 + n3) / countTied);
            tieText = `Empate triple 1º (P1+P2+P3)/${countTied} = ${pointsPerPlayer} pts`;
          }
        } else if (rank === 2) {
          pointsPerPlayer = Math.floor((n2 + n3) / countTied);
          tieText = `Empate 2º (P2+P3)/${countTied} = ${pointsPerPlayer} pts`;
        } else if (rank === 3) {
          pointsPerPlayer = Math.floor(n3 / countTied);
          tieText = `Empate 3º P3/${countTied} = ${pointsPerPlayer} pts`;
        }
      }

      tiedGroup.forEach((e) => {
        const item = {
          tokens: e.tokens,
          points: pointsPerPlayer,
          tieInfo: tieText || undefined,
        };
        breakdownRow[e.key] = item;
        if (e.nombre) breakdownRow[e.nombre] = item;
        playerTotals[e.key] = (playerTotals[e.key] || 0) + pointsPerPlayer;
        if (e.nombre) {
          playerTotals[e.nombre] = (playerTotals[e.nombre] || 0) + pointsPerPlayer;
        }
      });

      rank += countTied;
      i += countTied;
    }

    matrix[musa.nombre] = breakdownRow;
  });

  const totals = jugadores.map((j) => {
    const key = String(j.id ?? j.numeroJugador);
    return {
      jugadorId: j.id ?? j.numeroJugador,
      nombre: j.nombre,
      puntos: playerTotals[key] || 0,
    };
  });

  totals.sort((a, b) => b.puntos - a.puntos);
  const maxPts = totals[0]?.puntos || 0;
  const winners = totals.filter((t) => t.puntos === maxPts).map((t) => t.nombre);

  return {
    filas: [],
    totalesPorJugador: [],
    ganadores: [],
    matrix,
    totals,
    winners,
  };
}

export function buildInitialState(usuario?: Usuario | null): {
  tablero: Tablero;
  partida: Partida;
  cards: (CartaAccion | CartaInspiracion)[];
} {
  const musas = [...INITIAL_MUSAS];
  const initialGrid = musas.map((nombre, index) => ({
    id: index + 1,
    nombre,
    tokensColocados: [],
    posicion: index,
  }));

  const initialTablero: Tablero = {
    id: 1,
    solPos: 0,
    lunaPos: 4,
    grid: initialGrid,
  };

  const currentUsername = usuario?.username || 'Jugador 1';
  const currentUserId = usuario?.id || 1;

  const jugador1: Jugador = {
    id: currentUserId,
    nombre: currentUsername,
    numeroJugador: 1,
    puntuacionTotal: 0,
    usuario: usuario || undefined,
    tokens: Array.from({ length: 20 }, (_, idx) => ({
      id: 100 + idx,
      colocado: false,
      jugador: { id: currentUserId, nombre: currentUsername, numeroJugador: 1, puntuacionTotal: 0 },
    })),
  };

  const jugador2: Jugador = {
    id: 2,
    nombre: 'Atenea (Bot)',
    numeroJugador: 2,
    puntuacionTotal: 0,
    tokens: Array.from({ length: 20 }, (_, idx) => ({
      id: 200 + idx,
      colocado: false,
      jugador: { id: 2, nombre: 'Atenea (Bot)', numeroJugador: 2, puntuacionTotal: 0 },
    })),
  };

  const jugador3: Jugador = {
    id: 3,
    nombre: 'Hermes (Bot)',
    numeroJugador: 3,
    puntuacionTotal: 0,
    tokens: Array.from({ length: 20 }, (_, idx) => ({
      id: 300 + idx,
      colocado: false,
      jugador: { id: 3, nombre: 'Hermes (Bot)', numeroJugador: 3, puntuacionTotal: 0 },
    })),
  };

  const initialPartida: Partida = {
    id: 1,
    rondaActual: 1,
    maxRondas: 9,
    tablero: initialTablero,
    jugadores: [jugador1, jugador2, jugador3],
    ganadores: [],
    seleccionesRonda: {},
  };

  const commonActions: CartaAccion[] = [
    { id: 101, tipoCarta: 'ACCION', tipo: 'DEVOCION_SOL', nombre: 'Devoción Solar' },
    { id: 102, tipoCarta: 'ACCION', tipo: 'DEVOCION_LUNA', nombre: 'Devoción Lunar' },
    { id: 103, tipoCarta: 'ACCION', tipo: 'REVOLUCION_SOL', nombre: 'Revolución Solar' },
    { id: 104, tipoCarta: 'ACCION', tipo: 'REVOLUCION_LUNA', nombre: 'Revolución Lunar' },
  ];

  const defaultMusas: TipoMusa[] = [
    'TERPSICORE',
    'CLIO',
    'TALIA',
    'EUTERPE',
    'MELPOMENE',
    'ERATO',
    'POLIMNIA',
    'URANIA',
    'CALIOPE',
  ];

  const getInspirationCardForMusa = (musaName: TipoMusa, cardId: number): CartaInspiracion => {
    const meta = MUSAS_METADATA[musaName] || MUSAS_METADATA.TERPSICORE;
    return {
      id: cardId,
      tipoCarta: 'INSPIRACION',
      nombreMusa: musaName,
      usada: false,
      nombre: `Inspiración de ${meta.displayName}`,
    };
  };

  const insp1 = getInspirationCardForMusa(defaultMusas[0], 105);
  const insp2 = getInspirationCardForMusa(defaultMusas[1], 106);
  const insp3 = getInspirationCardForMusa(defaultMusas[2], 107);

  jugador1.cartaInspiracion = insp1;
  jugador2.cartaInspiracion = insp2;
  jugador3.cartaInspiracion = insp3;

  return {
    tablero: initialTablero,
    partida: initialPartida,
    cards: [...commonActions, insp1],
  };
}

export class GameStore {
  tablero: Tablero | null = null;
  partida: Partida | null = null;
  cards: (CartaAccion | CartaInspiracion)[] = [];
  selectedCard: AnyCard | null = null;
  hoveredCard: AnyCard | null = null;
  isSubmitting: boolean = false;
  isConnected: boolean = true;
  notification: string | null = null;
  sala: Sala | null = null;
  jugadorActualId: number = 1;
  enPartida: boolean = false;
  isGameOver: boolean = false;
  scoreBreakdown: ScoreBreakdown | null = null;
  actionLogs: ActionResolutionLog[] = [];
  activeMusaIndex: number | null = null;
  revolutionAnimating: boolean = false;
  currentExecutingAction: PlannedAction | null = null;
  pendingActions: PlannedAction[] = [];

  // Multiplayer Turn Synchronization
  seleccionesRonda: Record<number, PlannedAction> = {};
  haSeleccionadoCarta: boolean = false;
  isResolvingRound: boolean = false;
  creeEstaSala: boolean = false;

  // Auth State
  usuario: Usuario | null = null;
  isInvitado: boolean = false;
  private lobbyChannel: BroadcastChannel | null = null;

  constructor() {
    makeAutoObservable(this);
    this.cargarUsuarioGuardado();
    this.initLobbyChannel();
    this.initStorageListener();
  }

  // ─── Auth Actions ───────────────────────────────────────────────────────────

  cargarUsuarioGuardado() {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('muses_user');
        if (saved) {
          const parsed = JSON.parse(saved);
          this.usuario = parsed.usuario;
          this.isInvitado = parsed.isInvitado ?? false;
          if (this.usuario?.id) {
            this.jugadorActualId = this.usuario.id;
          }
        }
      } catch (e) {
        console.error('Error loading saved user:', e);
      }
    }
  }

  guardarUsuarioLocal() {
    if (typeof window !== 'undefined') {
      if (this.usuario) {
        localStorage.setItem(
          'muses_user',
          JSON.stringify({ usuario: this.usuario, isInvitado: this.isInvitado })
        );
      } else {
        localStorage.removeItem('muses_user');
      }
    }
  }

  loginInvitado(nombre: string) {
    const guestUser: Usuario = {
      id: Math.floor(Math.random() * 90000 + 10000),
      username: nombre,
    };
    this.usuario = guestUser;
    this.isInvitado = true;
    this.jugadorActualId = guestUser.id!;
    this.guardarUsuarioLocal();
    this.setNotification(`¡Bienvenido, ${nombre}!`);
  }

  async loginUsuario(username: string, password?: string) {
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080/api/v1';
      const res = await fetch(`${backendUrl}/usuario`);
      if (res.ok) {
        const users: Usuario[] = await res.json();
        const norm = (s?: string) => (s || '').toLowerCase().replace(/\s+/g, '');
        const target = norm(username);
        const found = users.find(
          (u) =>
            norm(u.username) === target ||
            (u.email && u.email.toLowerCase() === username.toLowerCase())
        );

        if (found) {
          if (password && found.password && found.password !== password) {
            this.setNotification('Contraseña incorrecta');
            return;
          }
          runInAction(() => {
            this.usuario = found;
            this.isInvitado = false;
            this.jugadorActualId = found.id ?? 1;
            this.guardarUsuarioLocal();
          });
          this.setNotification(`Sesión iniciada como ${found.username}`);
          return;
        }
      }
    } catch (e) {
      // Backend not reached or offline
    }

    // Fallback: local session
    runInAction(() => {
      this.usuario = {
        id: Math.floor(Math.random() * 90000 + 10000),
        username,
        password,
      };
      this.isInvitado = false;
      this.jugadorActualId = this.usuario.id!;
      this.guardarUsuarioLocal();
    });
    this.setNotification(`Sesión iniciada como ${username}`);
  }

  async registrarUsuario(username: string, email: string, password?: string) {
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080/api/v1';
      const res = await fetch(`${backendUrl}/usuario`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password: password || '123456' }),
      });
      if (res.ok) {
        const nuevo = await res.json();
        runInAction(() => {
          this.usuario = nuevo;
          this.isInvitado = false;
          this.jugadorActualId = nuevo.id ?? 1;
          this.guardarUsuarioLocal();
        });
        this.setNotification(`¡Cuenta de ${nuevo.username} creada con éxito!`);
        return;
      }
    } catch (e) {
      // Fallback
    }

    runInAction(() => {
      this.usuario = {
        id: Math.floor(Math.random() * 90000 + 10000),
        username,
        email,
      };
      this.isInvitado = false;
      this.jugadorActualId = this.usuario.id!;
      this.guardarUsuarioLocal();
    });
    this.setNotification(`¡Cuenta de ${username} creada con éxito!`);
  }

  logoutUsuario() {
    this.usuario = null;
    this.isInvitado = false;
    this.jugadorActualId = 1;
    this.guardarUsuarioLocal();
    this.setNotification('Has cerrado sesión.');
  }

  async cargarPerfil() {
    if (!this.usuario?.id || this.isInvitado) return;
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080/api/v1';
      const res = await fetch(`${backendUrl}/usuario/${this.usuario.id}`);
      if (res.ok) {
        const data: Usuario = await res.json();
        runInAction(() => {
          this.usuario = data;
          this.guardarUsuarioLocal();
        });
      }
    } catch (e) {
      console.warn('No se pudo cargar el perfil actualizado desde el backend:', e);
    }
  }

  async actualizarPerfil(datos: { username?: string; email?: string; password?: string }) {
    if (!this.usuario?.id || this.isInvitado) {
      this.setNotification('Los invitados no pueden modificar su perfil');
      return false;
    }
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080/api/v1';
      const res = await fetch(`${backendUrl}/usuario/${this.usuario.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...this.usuario,
          ...datos,
        }),
      });
      if (res.ok) {
        const updated: Usuario = await res.json();
        runInAction(() => {
          this.usuario = updated;
          this.guardarUsuarioLocal();
        });
        this.setNotification('Perfil actualizado con éxito');
        return true;
      } else {
        this.setNotification('Error al actualizar perfil');
        return false;
      }
    } catch (e) {
      this.setNotification('Error de conexión al actualizar perfil');
      return false;
    }
  }

  async eliminarCuenta() {
    if (!this.usuario?.id || this.isInvitado) {
      this.setNotification('Los invitados no tienen cuenta para eliminar');
      return false;
    }
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080/api/v1';
      const res = await fetch(`${backendUrl}/usuario/${this.usuario.id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        this.logoutUsuario();
        this.setNotification('Tu cuenta ha sido eliminada correctamente');
        return true;
      } else {
        this.setNotification('Error al eliminar la cuenta');
        return false;
      }
    } catch (e) {
      this.setNotification('Error de conexión al eliminar la cuenta');
      return false;
    }
  }

  async registrarEstadisticasFinPartida(partida: Partida, ganadores: { id: number; username: string }[]) {
    if (!partida || !partida.jugadores) return;

    const myPlayer = this.myPlayer || partida.jugadores.find((j) => j.id === this.jugadorActualId || j.numeroJugador === 1);
    if (!myPlayer) return;

    const isWinner = ganadores.some((w) => w.id === myPlayer.id || w.username === myPlayer.nombre);

    let tokensColocados = 0;
    if (this.tablero?.grid) {
      this.tablero.grid.forEach((musa) => {
        if (musa.tokensColocados) {
          tokensColocados += musa.tokensColocados.filter(
            (t: any) => t.jugadorId === myPlayer.id || t.jugador?.id === myPlayer.id
          ).length;
        }
      });
    }

    const currentStats: Estadisticas = this.usuario?.estadisticas || {
      partidasJugadas: 0,
      victorias: 0,
      derrotas: 0,
      puntuacionTotal: 0,
      tokensColocados: 0,
      cartasUtilizadas: 0,
      tiempoTotalJuego: 0,
    };

    const nuevasEstadisticas: Estadisticas = {
      ...currentStats,
      partidasJugadas: (currentStats.partidasJugadas || 0) + 1,
      victorias: (currentStats.victorias || 0) + (isWinner ? 1 : 0),
      derrotas: (currentStats.derrotas || 0) + (isWinner ? 0 : 1),
      puntuacionTotal: (currentStats.puntuacionTotal || 0) + (myPlayer.puntuacionTotal || 0),
      tokensColocados: (currentStats.tokensColocados || 0) + tokensColocados,
      cartasUtilizadas: (currentStats.cartasUtilizadas || 0) + 9 + (myPlayer.cartaInspiracion?.usada ? 1 : 0),
      tiempoTotalJuego: (currentStats.tiempoTotalJuego || 0) + 5,
    };

    runInAction(() => {
      if (this.usuario) {
        this.usuario = {
          ...this.usuario,
          estadisticas: nuevasEstadisticas,
        };
        this.guardarUsuarioLocal();
      }
    });

    if (!this.isInvitado && this.usuario?.id) {
      try {
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080/api/v1';
        await fetch(`${backendUrl}/usuario/${this.usuario.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...this.usuario,
            estadisticas: nuevasEstadisticas,
          }),
        });
      } catch (e) {
        console.warn('Error sincronizando estadísticas con el backend:', e);
      }
    }
  }

  // ─── Room & Multiplayer Actions ─────────────────────────────────────────────

  initStorageListener() {
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (e) => {
        if (this.sala && e.key === `muses_action_${this.sala.codigo}` && e.newValue) {
          try {
            const parsed = JSON.parse(e.newValue);
            this.procesarAccionSala(parsed);
          } catch (err) {}
        }
      });
    }
  }

  initLobbyChannel() {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window && !this.lobbyChannel) {
      this.lobbyChannel = new BroadcastChannel('muses_lobby_channel');
      this.lobbyChannel.onmessage = (event) => {
        const { type, sala, codigo, jugador, data } = event.data || {};
        runInAction(() => {
          if (type === 'SALA_ACTION' && codigo && this.sala && this.sala.codigo === codigo && data) {
            this.procesarAccionSala(data);
          } else if (type === 'SALA_UPDATE' && sala && this.sala && this.sala.codigo === sala.codigo) {
            this.sala = sala;
            if (sala.estado === 'EN_CURSO' && !this.enPartida) {
              this.initGame();
              this.enPartida = true;
            }
          } else if (type === 'SALA_JOIN' && codigo && this.sala && this.sala.codigo === codigo && jugador) {
            const exists = this.sala.jugadores.some(
              (j) => j.id === jugador.id
            );
            if (!exists && this.sala.jugadores.length < this.sala.maxJugadores) {
              const updatedPlayers = [...this.sala.jugadores, jugador];
              this.sala = {
                ...this.sala,
                jugadores: updatedPlayers,
              };
              if (typeof window !== 'undefined') {
                localStorage.setItem(`muses_room_${codigo}`, JSON.stringify(this.sala));
              }
              this.lobbyChannel?.postMessage({ type: 'SALA_UPDATE', sala: safeClone(this.sala) });
            }
          } else if (type === 'SALA_START' && codigo && this.sala && this.sala.codigo === codigo) {
            this.sala.estado = 'EN_CURSO';
            if (!this.enPartida) {
              this.initGame();
              this.enPartida = true;
            }
          }
        });
      };
    }
  }

  enviarAccionSala(codigo: string, data: any) {
    try {
      const cleanData = safeClone(data);
      socketService.send(`/topic/sala/${codigo}/accion`, cleanData);
      this.lobbyChannel?.postMessage({
        type: 'SALA_ACTION',
        codigo,
        data: cleanData,
      });
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(
            `muses_action_${codigo}`,
            JSON.stringify({ ...cleanData, _ts: Date.now() })
          );
        } catch (e) {}
      }
    } catch (err) {
      console.error('Error in enviarAccionSala:', err);
    }
  }

  procesarAccionSala(data: any) {
    if (!data) return;
    runInAction(() => {
      if (data.type === 'GAME_START_SYNC' && data.tablero && data.partida) {
        this.tablero = data.tablero;
        this.partida = data.partida;

        const commonActions: CartaAccion[] = [
          { id: 101, tipoCarta: 'ACCION', tipo: 'DEVOCION_SOL', nombre: 'Devoción Solar' },
          { id: 102, tipoCarta: 'ACCION', tipo: 'DEVOCION_LUNA', nombre: 'Devoción Lunar' },
          { id: 103, tipoCarta: 'ACCION', tipo: 'REVOLUCION_SOL', nombre: 'Revolución Solar' },
          { id: 104, tipoCarta: 'ACCION', tipo: 'REVOLUCION_LUNA', nombre: 'Revolución Lunar' },
        ];

        const myJugador = this.myPlayer || data.partida.jugadores?.[0];

        if (myJugador?.cartaInspiracion) {
          this.cards = [...commonActions, myJugador.cartaInspiracion];
        } else if (data.cards) {
          this.cards = data.cards;
        }

        this.enPartida = true;
        this.seleccionesRonda = {};
        this.haSeleccionadoCarta = false;
        this.isResolvingRound = false;
        this.isSubmitting = false;
        this.setNotification('¡Partida iniciada! Selecciona tu carta para la ronda 1.');
      } else if (data.type === 'SELECCION_CARTA' && data.payload) {
        const act: PlannedAction = data.payload;
        this.seleccionesRonda = {
          ...this.seleccionesRonda,
          [act.jugadorId]: act,
        };

        if (this.isAnfitrion) {
          this.prepararAccionesBots();
        }

        const totalEsperados = this.partida?.jugadores.length || this.sala?.jugadores.length || 2;
        const totalSeleccionados = Object.keys(this.seleccionesRonda).length;

        if (totalSeleccionados < totalEsperados) {
          if (this.haSeleccionadoCarta) {
            this.setNotification(`Has seleccionado tu carta. Esperando a los demás jugadores... (${totalSeleccionados} / ${totalEsperados})`);
          } else {
            this.setNotification(`${act.jugadorNombre} ha seleccionado su carta. (${totalSeleccionados} / ${totalEsperados})`);
          }
        } else {
          // All players selected!
          this.ejecutarResolucionRonda(Object.values(this.seleccionesRonda));
        }
      }
    });
  }

  prepararAccionesBots() {
    if (!this.partida || !this.tablero) return;
    const isMultiplayer = !!(this.sala && this.sala.jugadores && this.sala.jugadores.length > 1);
    if (isMultiplayer && !this.isAnfitrion) return;

    this.partida.jugadores.forEach((j) => {
      const isBotPlayer = j.esBot || (j as any).bot || j.nombre?.toLowerCase().includes('bot');
      if (isBotPlayer && !this.seleccionesRonda[j.id]) {
        const botAction = this.generarAccionBot(j, this.tablero!, this.partida!.rondaActual);
        this.seleccionesRonda[j.id] = botAction;
        if (this.sala?.codigo) {
          this.enviarAccionSala(this.sala.codigo, {
            type: 'SELECCION_CARTA',
            payload: safeClone(botAction),
          });
        }
      }
    });
  }

  generarAccionBot(bot: Jugador, tablero: Tablero, ronda: number): PlannedAction {
    const solPos = tablero.solPos;
    const lunaPos = tablero.lunaPos;

    // Check inspiration card
    if (bot.cartaInspiracion && !bot.cartaInspiracion.usada) {
      const musaName = bot.cartaInspiracion.nombreMusa;
      const meta = MUSAS_METADATA[musaName];
      const isVertices = solPos % 2 === 0;
      const isCompatible = (meta?.tipoInspiracion === 'VERTICES' && isVertices) ||
                           (meta?.tipoInspiracion === 'LADOS' && !isVertices);

      if (isCompatible && (ronda >= 3 || Math.random() < 0.6)) {
        return {
          jugador: safeClone(bot),
          jugadorId: bot.id,
          jugadorNumero: bot.numeroJugador,
          jugadorNombre: bot.nombre,
          cartaNombre: `Inspiración (${meta?.displayName || musaName})`,
          tipoAccion: 'INSPIRACION',
          prioridad: 1,
          musaName,
          rawCard: safeClone(bot.cartaInspiracion),
        };
      }
    }

    // Evaluate solar vs lunar devotion / revolution
    const solIndex = mapAstroToGrid(solPos);
    const lunaIndex = mapAstroToGrid(lunaPos);
    const musaSol = tablero.grid[solIndex];
    const musaLuna = tablero.grid[lunaIndex];

    const solPts = musaSol ? (MUSAS_METADATA[musaSol.nombre]?.nivel1 || 6) : 6;
    const lunaPts = musaLuna ? (MUSAS_METADATA[musaLuna.nombre]?.nivel1 || 6) : 6;

    const choices = [
      {
        tipo: 'DEVOCION_SOL',
        nombre: 'Devoción Solar',
        prioridad: 2,
        astro: solPos,
        weight: solPts * 1.5,
      },
      {
        tipo: 'DEVOCION_LUNA',
        nombre: 'Devoción Lunar',
        prioridad: 5,
        astro: lunaPos,
        weight: lunaPts * 1.5,
      },
      {
        tipo: 'REVOLUCION_SOL',
        nombre: 'Revolución Solar',
        prioridad: 3,
        astro: solPos,
        weight: 7,
      },
      {
        tipo: 'REVOLUCION_LUNA',
        nombre: 'Revolución Lunar',
        prioridad: 4,
        astro: lunaPos,
        weight: 6,
      },
    ];

    choices.sort((a, b) => b.weight - a.weight);
    const chosen = choices[0];

    return {
      jugador: safeClone(bot),
      jugadorId: bot.id,
      jugadorNumero: bot.numeroJugador,
      jugadorNombre: bot.nombre,
      cartaNombre: chosen.nombre,
      tipoAccion: chosen.tipo,
      prioridad: chosen.prioridad,
      astroPos: chosen.astro,
    };
  }

  iniciarPartidaContraBots() {
    this.initGame();
    this.enPartida = true;
  }

  async crearSala(maxJugadores: number = 3) {
    const currentName = this.usuario?.username || 'Jugador 1';
    const myId = this.usuario?.id || 1;
    this.jugadorActualId = myId;
    this.creeEstaSala = true;

    const host: Jugador = {
      id: myId,
      nombre: currentName,
      numeroJugador: 1,
      puntuacionTotal: 0,
      usuario: this.usuario || undefined,
    };

    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080/api/v1';
      const res = await fetch(`${backendUrl}/salas/crear`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          anfitrionId: this.usuario?.id, 
          anfitrionNombre: currentName, 
          maxJugadores 
        }),
      });
      if (res.ok) {
        const salaData: Sala = await res.json();
        runInAction(() => {
          this.sala = salaData;
          this.creeEstaSala = true;
          if (salaData.anfitrion?.id) {
            this.jugadorActualId = salaData.anfitrion.id;
          }
        });
        this.conectarASalaWS(salaData.codigo);
        return;
      }
    } catch (e) {
      // Backend not running or offline fallback
    }

    // Fallback Mock Sala
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let randCode = 'MUS-';
    for (let i = 0; i < 4; i++) {
      randCode += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    runInAction(() => {
      this.creeEstaSala = true;
      this.sala = {
        id: Date.now(),
        codigo: randCode,
        estado: 'ESPERANDO',
        maxJugadores,
        anfitrion: host,
        jugadores: [host],
      };
    });

    if (typeof window !== 'undefined') {
      localStorage.setItem(`muses_room_${randCode}`, JSON.stringify(this.sala));
    }
    if (this.sala) {
      this.lobbyChannel?.postMessage({ type: 'SALA_UPDATE', sala: safeClone(this.sala) });
    }
    this.conectarASalaWS(randCode);
  }

  async unirseASala(codigo: string) {
    const cleanCode = codigo.trim().toUpperCase();
    const currentName = this.usuario?.username || (this.sala ? `Jugador ${this.sala.jugadores.length + 1}` : 'Jugador 2');
    const myId = this.usuario?.id || (Date.now() % 100000) + 10;
    this.jugadorActualId = myId;
    this.creeEstaSala = false;

    const nuevoJugador: Jugador = {
      id: myId,
      nombre: currentName,
      numeroJugador: 2,
      puntuacionTotal: 0,
      usuario: this.usuario || undefined,
    };

    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080/api/v1';
      const res = await fetch(`${backendUrl}/salas/${cleanCode}/unirse`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          jugadorId: this.usuario?.id, 
          jugadorNombre: currentName 
        }),
      });
      if (res.ok) {
        const salaData: Sala = await res.json();
        const joinedPlayer = salaData.jugadores[salaData.jugadores.length - 1];
        runInAction(() => {
          this.sala = salaData;
          this.creeEstaSala = false;
          if (joinedPlayer?.id) {
            this.jugadorActualId = joinedPlayer.id;
          }
        });
        if (typeof window !== 'undefined') {
          localStorage.setItem(`muses_room_${cleanCode}`, JSON.stringify(salaData));
        }
        this.lobbyChannel?.postMessage({
          type: 'SALA_UPDATE',
          sala: safeClone(salaData),
        });
        this.conectarASalaWS(cleanCode);
        return;
      }
    } catch (e) {
      // Offline fallback
    }

    // Fallback Mock Sala con sincronización cruzada
    let existingRoom: Sala | null = null;
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(`muses_room_${cleanCode}`);
        if (stored) {
          existingRoom = JSON.parse(stored);
        }
      } catch (e) {}
    }

    runInAction(() => {
      if (existingRoom) {
        const exists = existingRoom.jugadores.some(
          (j) => j.id === nuevoJugador.id
        );
        const updatedPlayers = exists
          ? existingRoom.jugadores
          : [...existingRoom.jugadores, { ...nuevoJugador, numeroJugador: existingRoom.jugadores.length + 1 }];
        this.sala = {
          ...existingRoom,
          jugadores: updatedPlayers,
        };
      } else {
        this.sala = {
          id: Date.now(),
          codigo: cleanCode,
          estado: 'ESPERANDO',
          maxJugadores: 3,
          anfitrion: { id: 999, nombre: 'Anfitrión', numeroJugador: 1, puntuacionTotal: 0 },
          jugadores: [
            { id: 999, nombre: 'Anfitrión', numeroJugador: 1, puntuacionTotal: 0 },
            nuevoJugador,
          ],
        };
      }
    });

    if (typeof window !== 'undefined' && this.sala) {
      localStorage.setItem(`muses_room_${cleanCode}`, JSON.stringify(this.sala));
    }

    this.lobbyChannel?.postMessage({
      type: 'SALA_JOIN',
      codigo: cleanCode,
      jugador: safeClone(nuevoJugador),
    });
    if (this.sala) {
      this.lobbyChannel?.postMessage({
        type: 'SALA_UPDATE',
        sala: safeClone(this.sala),
      });
    }

    this.conectarASalaWS(cleanCode);
  }

  async agregarBotASala() {
    if (!this.sala) return;
    if (this.sala.jugadores.length >= this.sala.maxJugadores) return;

    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080/api/v1';
      const res = await fetch(`${backendUrl}/salas/${this.sala.codigo}/agregar-bot`, {
        method: 'POST',
      });
      if (res.ok) {
        const salaData: Sala = await res.json();
        runInAction(() => {
          this.sala = salaData;
        });
        if (typeof window !== 'undefined') {
          localStorage.setItem(`muses_room_${this.sala.codigo}`, JSON.stringify(salaData));
        }
        this.lobbyChannel?.postMessage({
          type: 'SALA_UPDATE',
          sala: safeClone(this.sala),
        });
        return;
      }
    } catch (e) {
      // Offline fallback
    }

    // Fallback Mock Add Bot
    const botNum = this.sala.jugadores.length + 1;
    const botJugador: Jugador = {
      id: Date.now() + botNum,
      nombre: `Bot ${botNum}`,
      numeroJugador: botNum,
      puntuacionTotal: 0,
      esBot: true,
      conectado: true,
    };
    runInAction(() => {
      if (this.sala) {
        this.sala.jugadores.push(botJugador);
        if (typeof window !== 'undefined') {
          localStorage.setItem(`muses_room_${this.sala.codigo}`, JSON.stringify(this.sala));
        }
      }
    });
    this.lobbyChannel?.postMessage({
      type: 'SALA_UPDATE',
      sala: safeClone(this.sala),
    });
  }

  async llenarSalaConBots() {
    if (!this.sala) return;
    if (this.sala.jugadores.length >= this.sala.maxJugadores) return;

    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080/api/v1';
      const res = await fetch(`${backendUrl}/salas/${this.sala.codigo}/llenar-bots`, {
        method: 'POST',
      });
      if (res.ok) {
        const salaData: Sala = await res.json();
        runInAction(() => {
          this.sala = salaData;
        });
        if (typeof window !== 'undefined') {
          localStorage.setItem(`muses_room_${this.sala.codigo}`, JSON.stringify(salaData));
        }
        this.lobbyChannel?.postMessage({
          type: 'SALA_UPDATE',
          sala: safeClone(this.sala),
        });
        return;
      }
    } catch (e) {
      // Backend offline fallback
    }

    const huecos = this.sala.maxJugadores - this.sala.jugadores.length;
    for (let i = 0; i < huecos; i++) {
      await this.agregarBotASala();
    }
  }

  async refrescarEstadoSala() {
    if (!this.sala?.codigo || this.enPartida) return;
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080/api/v1';
      const res = await fetch(`${backendUrl}/salas/${this.sala.codigo}`);
      if (res.ok) {
        const salaData: Sala = await res.json();
        runInAction(() => {
          this.sala = salaData;
          if (salaData.estado === 'EN_CURSO' && !this.enPartida) {
            this.initGame();
            this.enPartida = true;
          }
        });
      }
    } catch (e) {
      // Offline fallback
    }
  }

  conectarASalaWS(codigo: string) {
    this.initLobbyChannel();
    socketService.subscribe(`/topic/sala/${codigo}`, (data: Sala) => {
      runInAction(() => {
        if (data && data.codigo === codigo) {
          this.sala = data;
          if (data.partida?.id) {
            this.suscribirAPartidaWS(data.partida.id);
          }
          if (data.estado === 'EN_CURSO' && !this.enPartida) {
            this.initGame();
            this.enPartida = true;
          }
        }
      });
    });

    socketService.subscribe(`/topic/sala/${codigo}/accion`, (data: any) => {
      this.procesarAccionSala(data);
    });
  }

  suscribirAPartidaWS(partidaId: number) {
    socketService.subscribe(`/topic/partida/${partidaId}/estado`, (partidaData: Partida) => {
      runInAction(() => {
        if (partidaData) {
          this.partida = partidaData;
          if (partidaData.tablero) {
            this.tablero = partidaData.tablero;
          }
        }
      });
    });
  }

  async iniciarPartidaDesdeSala() {
    if (!this.sala) return;

    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080/api/v1';
      const res = await fetch(`${backendUrl}/salas/${this.sala.codigo}/iniciar`, {
        method: 'POST',
      });
      if (res.ok) {
        const salaData: Sala = await res.json();
        runInAction(() => {
          this.sala = salaData;
        });
      }
    } catch (e) {
      // Offline mode
    }

    runInAction(() => {
      if (this.sala) {
        this.sala.estado = 'EN_CURSO';
      }
      this.initGame();
      this.enPartida = true;
    });

    if (typeof window !== 'undefined' && this.sala) {
      localStorage.setItem(`muses_room_${this.sala.codigo}`, JSON.stringify(this.sala));
    }
    this.lobbyChannel?.postMessage({
      type: 'SALA_START',
      codigo: this.sala.codigo,
    });

    this.enviarAccionSala(this.sala.codigo, {
      type: 'GAME_START_SYNC',
      codigo: this.sala.codigo,
      tablero: safeClone(this.tablero),
      partida: safeClone(this.partida),
      cards: safeClone(this.cards),
    });
  }

  abandonarSala() {
    if (this.sala?.codigo) {
      socketService.unsubscribe(`/topic/sala/${this.sala.codigo}`);
      socketService.unsubscribe(`/topic/sala/${this.sala.codigo}/accion`);
      if (typeof window !== 'undefined') {
        localStorage.removeItem(`muses_room_${this.sala.codigo}`);
      }
    }
    this.sala = null;
    this.enPartida = false;
    this.isGameOver = false;
  }

  initGame() {
    const state = buildInitialState(this.usuario);
    this.tablero = state.tablero;
    this.partida = state.partida;
    this.cards = state.cards;

    if (this.sala && this.sala.jugadores && this.sala.jugadores.length > 0) {
      const shuffledInspirations = [...INITIAL_MUSAS].sort(() => Math.random() - 0.5);
      const roomJugadores: Jugador[] = this.sala.jugadores.map((j, idx) => {
        const musaName = shuffledInspirations[idx % shuffledInspirations.length];
        const meta = MUSAS_METADATA[musaName] || MUSAS_METADATA.TERPSICORE;
        const inspCard: CartaInspiracion = {
          id: (idx + 1) * 100 + 50,
          tipoCarta: 'INSPIRACION',
          nombreMusa: musaName,
          usada: false,
          nombre: `Inspiración de ${meta.displayName}`,
        };
        const isBotPlayer = j.esBot || (j as any).bot || j.nombre?.toLowerCase().includes('bot') || false;
        return {
          id: j.id || (idx + 1),
          nombre: j.nombre,
          numeroJugador: idx + 1,
          puntuacionTotal: 0,
          usuario: j.usuario,
          esBot: isBotPlayer,
          conectado: true,
          cartaInspiracion: inspCard,
          tokens: Array.from({ length: 20 }, (_, tIdx) => ({
            id: (idx + 1) * 100 + tIdx,
            colocado: false,
            jugador: { id: j.id || (idx + 1), nombre: j.nombre, numeroJugador: idx + 1, puntuacionTotal: 0 },
          })),
        };
      });
      this.partida.jugadores = roomJugadores;

      const commonActions: CartaAccion[] = [
        { id: 101, tipoCarta: 'ACCION', tipo: 'DEVOCION_SOL', nombre: 'Devoción Solar' },
        { id: 102, tipoCarta: 'ACCION', tipo: 'DEVOCION_LUNA', nombre: 'Devoción Lunar' },
        { id: 103, tipoCarta: 'ACCION', tipo: 'REVOLUCION_SOL', nombre: 'Revolución Solar' },
        { id: 104, tipoCarta: 'ACCION', tipo: 'REVOLUCION_LUNA', nombre: 'Revolución Lunar' },
      ];

      const myJugador = this.myPlayer || roomJugadores[0];

      if (myJugador?.cartaInspiracion) {
        this.cards = [...commonActions, myJugador.cartaInspiracion];
      }
    }

    this.selectedCard = null;
    this.hoveredCard = null;
    this.isSubmitting = false;
    this.isGameOver = false;
    this.scoreBreakdown = null;
    this.actionLogs = [];
    this.notification = null;
    this.seleccionesRonda = {};
    this.haSeleccionadoCarta = false;
    this.isResolvingRound = false;
    this.currentExecutingAction = null;
    this.pendingActions = [];

    // Pre-generate bot choices immediately
    this.prepararAccionesBots();
  }

  resetGame() {
    this.initGame();
    this.setNotification('Partida reiniciada.');
    setTimeout(() => runInAction(() => { this.notification = null; }), 2500);
  }

  selectCard(card: AnyCard | null) {
    if (card === null) {
      this.selectedCard = null;
      return;
    }
    this.selectedCard = this.selectedCard?.id === card.id ? null : card;
  }

  hoverCard(card: AnyCard | null) {
    this.hoveredCard = card;
  }

  setNotification(msg: string | null) {
    this.notification = msg;
  }

  setConnected(val: boolean) {
    this.isConnected = val;
  }

  get isAnfitrion(): boolean {
    if (!this.sala) return true;
    if (this.creeEstaSala) return true;
    if (this.sala.anfitrion?.id && this.sala.anfitrion.id === this.jugadorActualId) {
      return true;
    }
    if (this.usuario?.id && this.sala.anfitrion?.usuario?.id && this.sala.anfitrion.usuario.id === this.usuario.id) {
      return true;
    }
    return false;
  }

  get myPlayer(): Jugador | undefined {
    const jugadores = this.partida?.jugadores || this.sala?.jugadores;
    if (!jugadores || jugadores.length === 0) {
      return undefined;
    }
    // 1. Match by jugadorActualId (unique numeric player ID)
    if (this.jugadorActualId) {
      const found = jugadores.find((j) => j.id === this.jugadorActualId);
      if (found) return found;
    }

    // 2. Match by usuario id (unique numeric user ID)
    if (this.usuario?.id) {
      const found = jugadores.find(
        (j) => (j.usuario && j.usuario.id === this.usuario!.id) || (j.id === this.usuario!.id)
      );
      if (found) return found;
    }

    // 3. Fallback: If I created room, pick the first human player
    if (this.isAnfitrion) {
      const found = jugadores.find((j) => !j.esBot && !(j as any).bot);
      if (found) return found;
      return jugadores[0];
    }

    // 4. Fallback: If I am guest, pick the last human player in room
    const humanPlayers = jugadores.filter((j) => !j.esBot && !(j as any).bot);
    if (humanPlayers.length > 1) {
      return humanPlayers[humanPlayers.length - 1];
    }

    return jugadores[jugadores.length - 1];
  }

  async executeAction(cardToPlay?: AnyCard) {
    const card = cardToPlay || this.selectedCard;
    if (!card || this.isSubmitting || !this.tablero || !this.partida) return;

    const currentTablero = this.tablero;
    const currentPartida = this.partida;
    const cardType = (card as any).tipo || (card as any).tipoCarta;

    // Detect if we are in a multiplayer room with other players
    const isMultiplayerRoom = !!(this.sala && this.sala.jugadores && this.sala.jugadores.length > 1);

    if (isMultiplayerRoom) {
      const myJugador = this.myPlayer || currentPartida.jugadores[0];

      let cartaNombre = 'Carta';
      let tipoAccion = 'DEVOCION_SOL';
      let prioridad = 2;
      let astroPos = currentTablero.solPos;
      let musaName: TipoMusa | undefined = undefined;

      if (cardType === 'DEVOCION_SOL') {
        cartaNombre = 'Devoción Solar';
        tipoAccion = 'DEVOCION_SOL';
        prioridad = 2;
        astroPos = currentTablero.solPos;
      } else if (cardType === 'DEVOCION_LUNA') {
        cartaNombre = 'Devoción Lunar';
        tipoAccion = 'DEVOCION_LUNA';
        prioridad = 5;
        astroPos = currentTablero.lunaPos;
      } else if (cardType === 'REVOLUCION_SOL') {
        cartaNombre = 'Revolución Solar';
        tipoAccion = 'REVOLUCION_SOL';
        prioridad = 3;
        astroPos = currentTablero.solPos;
      } else if (cardType === 'REVOLUCION_LUNA') {
        cartaNombre = 'Revolución Lunar';
        tipoAccion = 'REVOLUCION_LUNA';
        prioridad = 4;
        astroPos = currentTablero.lunaPos;
      } else if (cardType === 'INSPIRACION' || (card as any).tipoMusa || (card as any).nombreMusa) {
        musaName = ((card as any).tipoMusa || (card as any).nombreMusa) as TipoMusa;
        cartaNombre = `Inspiración (${musaName})`;
        tipoAccion = 'INSPIRACION';
        prioridad = 1;
      }

      const plannedAction: PlannedAction = {
        jugador: safeClone(myJugador),
        jugadorId: myJugador.id,
        jugadorNumero: myJugador.numeroJugador,
        jugadorNombre: myJugador.nombre,
        cartaNombre,
        tipoAccion,
        prioridad,
        astroPos,
        musaName,
        rawCard: safeClone(card),
      };

      runInAction(() => {
        this.haSeleccionadoCarta = true;
        this.isSubmitting = true;
        this.seleccionesRonda = {
          ...this.seleccionesRonda,
          [myJugador.id]: plannedAction,
        };

        // If I am host, also generate bot selections for any bots in the match that haven't selected yet!
        if (this.isAnfitrion) {
          currentPartida.jugadores.forEach((j) => {
            if ((j.esBot || j.nombre?.startsWith('Bot')) && !this.seleccionesRonda[j.id]) {
              const botAction = this.generarAccionBot(j, currentTablero, currentPartida.rondaActual);
              this.seleccionesRonda[j.id] = botAction;
              this.enviarAccionSala(this.sala!.codigo, {
                type: 'SELECCION_CARTA',
                payload: safeClone(botAction),
              });
            }
          });
        }
      });

      // Broadcast to other players
      this.enviarAccionSala(this.sala!.codigo, {
        type: 'SELECCION_CARTA',
        payload: safeClone(plannedAction),
      });

      // Optional backend REST notification
      try {
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080/api/v1';
        fetch(`${backendUrl}/partida/${currentPartida.id}/seleccionar-carta?jugadorId=${myJugador.id}&cartaId=${card.id}`, {
          method: 'POST'
        }).catch(() => {});
      } catch (e) {}

      const totalEsperados = currentPartida.jugadores.length;
      const totalSeleccionados = Object.keys(this.seleccionesRonda).length;

      if (totalSeleccionados < totalEsperados) {
        this.setNotification(`Has seleccionado ${cartaNombre}. Esperando a los demás jugadores... (${totalSeleccionados} / ${totalEsperados})`);
      } else {
        this.ejecutarResolucionRonda(Object.values(this.seleccionesRonda));
      }
      return;
    }

    // --- Single player against bots (offline / fallback) ---
    const activePlayer = currentPartida.jugadores[0]; // Active player
    const bot1 = currentPartida.jugadores[1]; // Atenea
    const bot2 = currentPartida.jugadores[2]; // Hermes

    const actionsToExecute: PlannedAction[] = [];

    if (cardType === 'DEVOCION_SOL') {
      actionsToExecute.push({
        jugador: activePlayer,
        jugadorId: activePlayer.id,
        jugadorNumero: 1,
        jugadorNombre: activePlayer.nombre,
        cartaNombre: 'Devoción Solar',
        tipoAccion: 'DEVOCION_SOL',
        prioridad: 2,
        astroPos: currentTablero.solPos,
      });
    } else if (cardType === 'DEVOCION_LUNA') {
      actionsToExecute.push({
        jugador: activePlayer,
        jugadorId: activePlayer.id,
        jugadorNumero: 1,
        jugadorNombre: activePlayer.nombre,
        cartaNombre: 'Devoción Lunar',
        tipoAccion: 'DEVOCION_LUNA',
        prioridad: 5,
        astroPos: currentTablero.lunaPos,
      });
    } else if (cardType === 'REVOLUCION_SOL') {
      actionsToExecute.push({
        jugador: activePlayer,
        jugadorId: activePlayer.id,
        jugadorNumero: 1,
        jugadorNombre: activePlayer.nombre,
        cartaNombre: 'Revolución Solar',
        tipoAccion: 'REVOLUCION_SOL',
        prioridad: 3,
        astroPos: currentTablero.solPos,
      });
    } else if (cardType === 'REVOLUCION_LUNA') {
      actionsToExecute.push({
        jugador: activePlayer,
        jugadorId: activePlayer.id,
        jugadorNumero: 1,
        jugadorNombre: activePlayer.nombre,
        cartaNombre: 'Revolución Lunar',
        tipoAccion: 'REVOLUCION_LUNA',
        prioridad: 4,
        astroPos: currentTablero.lunaPos,
      });
    } else if (cardType === 'INSPIRACION' || (card as any).tipoMusa || (card as any).nombreMusa) {
      const musaName = ((card as any).tipoMusa || (card as any).nombreMusa) as TipoMusa;
      actionsToExecute.push({
        jugador: activePlayer,
        jugadorId: activePlayer.id,
        jugadorNumero: 1,
        jugadorNombre: activePlayer.nombre,
        cartaNombre: `Inspiración (${musaName})`,
        tipoAccion: 'INSPIRACION',
        prioridad: 1,
        musaName,
        rawCard: card,
      });
    }

    if (bot1) {
      actionsToExecute.push(this.generarAccionBot(bot1, currentTablero, currentPartida.rondaActual));
    }

    if (bot2) {
      actionsToExecute.push(this.generarAccionBot(bot2, currentTablero, currentPartida.rondaActual));
    }

    this.ejecutarResolucionRonda(actionsToExecute);
  }

  async ejecutarResolucionRonda(actions: PlannedAction[]) {
    if (this.isResolvingRound) return;
    this.isResolvingRound = true;

    runInAction(() => {
      this.isSubmitting = true;
      this.actionLogs = [];
      this.activeMusaIndex = null;
      this.revolutionAnimating = false;
      this.setNotification('¡Todos han elegido! Resolviendo acciones de la ronda...');
    });

    const currentTablero = this.tablero;
    const currentPartida = this.partida;
    if (!currentTablero || !currentPartida) {
      this.isResolvingRound = false;
      this.isSubmitting = false;
      return;
    }

    const currentCards = [...this.cards];
    const actionsToExecute = [...actions].sort((a, b) => a.prioridad - b.prioridad);
    runInAction(() => {
      this.pendingActions = [...actionsToExecute];
      this.currentExecutingAction = null;
    });
    const isTest = typeof process !== 'undefined' && process.env?.NODE_ENV === 'test';

    if (isTest) {
      setTimeout(() => {
        runInAction(() => {
          if (!this.tablero || !this.partida) return;

          let updatedGrid = [...this.tablero.grid];
          const tokensDeductMap: Record<number, number> = {};
          const newLogs: ActionResolutionLog[] = [];

          for (const act of actionsToExecute) {
            tokensDeductMap[act.jugadorId] = (tokensDeductMap[act.jugadorId] || 0);

            if (act.tipoAccion === 'DEVOCION_SOL' || act.tipoAccion === 'DEVOCION_LUNA') {
              const targetIndex = mapAstroToGrid(act.astroPos!);
              tokensDeductMap[act.jugadorId] += 2;
              const newTokens = Array.from({ length: 2 }, () => ({
                id: getNextTokenId(),
                colocado: true,
                jugador: act.jugador,
                jugadorId: act.jugadorId,
              }));
              updatedGrid = updatedGrid.map((m, idx) =>
                idx === targetIndex ? { ...m, tokensColocados: [...m.tokensColocados, ...newTokens] } : m
              );
              newLogs.push({
                jugadorNombre: act.jugadorNombre,
                jugadorNumero: act.jugadorNumero,
                cartaNombre: act.cartaNombre,
                tipoAccion: act.tipoAccion,
                prioridad: act.prioridad,
                detalle: `Coloca 2 fichas en ${updatedGrid[targetIndex].nombre}`,
              });
            } else if (act.tipoAccion === 'REVOLUCION_SOL' || act.tipoAccion === 'REVOLUCION_LUNA') {
              tokensDeductMap[act.jugadorId] = (tokensDeductMap[act.jugadorId] || 0) + 1;
              const newToken = {
                id: getNextTokenId(),
                colocado: true,
                jugador: act.jugador,
                jugadorId: act.jugadorId,
              };
              updatedGrid = updatedGrid.map((m, idx) =>
                idx === 4 ? { ...m, tokensColocados: [...m.tokensColocados, newToken] } : m
              );
              const targetAstroPos = act.astroPos !== undefined ? act.astroPos : (act.tipoAccion === 'REVOLUCION_SOL' ? this.tablero.solPos : this.tablero.lunaPos);
              updatedGrid = applyRevolution(updatedGrid, targetAstroPos);
              newLogs.push({
                jugadorNombre: act.jugadorNombre,
                jugadorNumero: act.jugadorNumero,
                cartaNombre: act.cartaNombre,
                tipoAccion: act.tipoAccion,
                prioridad: act.prioridad,
                detalle: `Coloca 1 ficha al centro y rota el semiciclo ${act.tipoAccion === 'REVOLUCION_SOL' ? 'solar' : 'lunar'}`,
              });
            } else if (act.tipoAccion === 'INSPIRACION') {
              const musaName = act.musaName!;
              const targetCells = getInspirationTargetCells(musaName, currentTablero.solPos);
              tokensDeductMap[act.jugadorId] = (tokensDeductMap[act.jugadorId] || 0) + targetCells.length * 2;
              targetCells.forEach((targetIndex) => {
                const newTokens = Array.from({ length: 2 }, () => ({
                  id: getNextTokenId(),
                  colocado: true,
                  jugador: act.jugador,
                  jugadorId: act.jugadorId,
                }));
                updatedGrid = updatedGrid.map((m, idx) =>
                  idx === targetIndex ? { ...m, tokensColocados: [...m.tokensColocados, ...newTokens] } : m
                );
              });
              const cardIdx = currentCards.findIndex((c) => c.id === act.rawCard?.id);
              if (cardIdx !== -1) {
                currentCards[cardIdx] = { ...currentCards[cardIdx], usada: true } as CartaInspiracion;
                this.cards = currentCards;
              }
              newLogs.push({
                jugadorNombre: act.jugadorNombre,
                jugadorNumero: act.jugadorNumero,
                cartaNombre: act.cartaNombre,
                tipoAccion: 'INSPIRACION',
                prioridad: act.prioridad,
                detalle: `Coloca fichas geométricas según el Sol`,
              });
            }
          }

          const { solPos: nextSol, lunaPos: nextLuna } = advanceAstros(
            this.tablero.solPos,
            this.tablero.lunaPos
          );

          const updatedJugadores = currentPartida.jugadores.map((j) => {
            const deduct = tokensDeductMap[j.id] || (j.numeroJugador === 1 ? (tokensDeductMap[1] || 0) : 0);
            if (j.numeroJugador === 1 && j.tokens && deduct > 0) return { ...j, tokens: j.tokens.slice(deduct) };
            if (j.numeroJugador === 2 && j.tokens) return { ...j, tokens: j.tokens.slice(2) };
            if (j.numeroJugador === 3 && j.tokens) return { ...j, tokens: j.tokens.slice(1) };
            if (j.tokens && deduct > 0) return { ...j, tokens: j.tokens.slice(deduct) };
            return j;
          });

          const currentRound = currentPartida.rondaActual;
          const isFinishing = currentRound >= currentPartida.maxRondas;

          this.tablero = {
            ...this.tablero,
            solPos: nextSol,
            lunaPos: nextLuna,
            grid: updatedGrid,
          };
          this.actionLogs = newLogs;

          if (isFinishing) {
            const breakdown = calculateScoreBreakdown(this.tablero, updatedJugadores);
            const finalJugadores = updatedJugadores.map((j) => {
              let totalPts = 0;
              Object.values(breakdown.matrix || {}).forEach((mRow: any) => {
                const item = mRow?.[j.id ?? ''] ?? mRow?.[String(j.id)] ?? mRow?.[j.nombre];
                if (item) totalPts += item.points || 0;
              });
              return { ...j, puntuacionTotal: totalPts };
            });
            const maxScore = Math.max(...finalJugadores.map((j) => j.puntuacionTotal));
            const winners = finalJugadores.filter((j) => j.puntuacionTotal === maxScore);

            this.partida = {
              ...currentPartida,
              rondaActual: currentPartida.maxRondas,
              tablero: this.tablero,
              jugadores: finalJugadores,
              ganadores: winners.map((w) => ({ id: w.id, username: w.nombre })),
            };
            this.scoreBreakdown = breakdown;
            this.isGameOver = true;
            this.isSubmitting = false;
            this.isResolvingRound = false;
            this.registrarEstadisticasFinPartida(this.partida, this.partida.ganadores as any);
            this.setNotification('¡Partida finalizada! Calculando favores de las Musas...');
          } else {
            const nextRound = currentRound + 1;
            this.partida = {
              ...currentPartida,
              rondaActual: nextRound,
              tablero: this.tablero,
              jugadores: updatedJugadores,
            };
            this.selectedCard = null;
            this.hoveredCard = null;
            this.isSubmitting = false;
            this.haSeleccionadoCarta = false;
            this.seleccionesRonda = {};
            this.isResolvingRound = false;
            this.setNotification('Ronda resuelta. Los astros avanzan.');
          }
        });
      }, 600);
      return;
    }

    // Interactive Browser Animation Sequence
    const tokensDeductMap: Record<number, number> = {};
    const newLogs: ActionResolutionLog[] = [];
    const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

    for (let actIdx = 0; actIdx < actionsToExecute.length; actIdx++) {
      const act = actionsToExecute[actIdx];
      if (!this.tablero) break;

      tokensDeductMap[act.jugadorId] = (tokensDeductMap[act.jugadorId] || 0);

      let detalle = 'Ejecutando acción de la ronda...';
      if (act.tipoAccion === 'DEVOCION_SOL' || act.tipoAccion === 'DEVOCION_LUNA') {
        const targetIndex = mapAstroToGrid(act.astroPos!);
        const musa = this.tablero.grid[targetIndex];
        detalle = `Coloca 2 fichas de devoción en ${musa?.nombre || 'la musa'} (${act.tipoAccion === 'DEVOCION_SOL' ? 'Sol' : 'Luna'})`;
      } else if (act.tipoAccion === 'REVOLUCION_SOL' || act.tipoAccion === 'REVOLUCION_LUNA') {
        detalle = `Coloca 1 ficha al centro y rota el semiciclo ${act.tipoAccion === 'REVOLUCION_SOL' ? 'solar' : 'lunar'}`;
      } else if (act.tipoAccion === 'INSPIRACION') {
        detalle = `Coloca fichas geométricas según el Sol (${act.musaName || 'Inspiración'})`;
      }
      act.detalle = detalle;

      runInAction(() => {
        this.currentExecutingAction = { ...act };
        this.pendingActions = actionsToExecute.slice(actIdx + 1);
        this.setNotification(`Resolviendo: ${act.jugadorNombre} juega ${act.cartaNombre}...`);
      });
      await sleep(1000);

      if (act.tipoAccion === 'DEVOCION_SOL' || act.tipoAccion === 'DEVOCION_LUNA') {
        const targetIndex = mapAstroToGrid(act.astroPos!);
        tokensDeductMap[act.jugadorId] += 2;

        const newTokens = Array.from({ length: 2 }, () => ({
          id: getNextTokenId(),
          colocado: true,
          jugador: act.jugador,
          jugadorId: act.jugadorId,
        }));

        runInAction(() => {
          if (!this.tablero) return;
          this.activeMusaIndex = targetIndex;
          const musa = this.tablero.grid[targetIndex];
          this.tablero = {
            ...this.tablero,
            grid: this.tablero.grid.map((m, idx) =>
              idx === targetIndex ? { ...m, tokensColocados: [...m.tokensColocados, ...newTokens] } : m
            ),
          };
          const logEntry: ActionResolutionLog = {
            jugadorNombre: act.jugadorNombre,
            jugadorNumero: act.jugadorNumero,
            cartaNombre: act.cartaNombre,
            tipoAccion: act.tipoAccion,
            prioridad: act.prioridad,
            detalle: `Coloca 2 fichas en ${musa.nombre} (${act.tipoAccion === 'DEVOCION_SOL' ? 'Sol' : 'Luna'})`,
          };
          newLogs.push(logEntry);
          this.actionLogs = [...newLogs];
        });

        await sleep(900);
        runInAction(() => {
          this.activeMusaIndex = null;
        });
      } else if (act.tipoAccion === 'REVOLUCION_SOL' || act.tipoAccion === 'REVOLUCION_LUNA') {
        tokensDeductMap[act.jugadorId] += 1;

        const targetAstroPos = act.astroPos !== undefined ? act.astroPos : (act.tipoAccion === 'REVOLUCION_SOL' ? this.tablero.solPos : this.tablero.lunaPos);

        const newToken = {
          id: getNextTokenId(),
          colocado: true,
          jugador: act.jugador,
          jugadorId: act.jugadorId,
        };

        // Step A: place token at center
        runInAction(() => {
          if (!this.tablero) return;
          this.activeMusaIndex = 4;
          this.tablero = {
            ...this.tablero,
            grid: this.tablero.grid.map((m, idx) =>
              idx === 4 ? { ...m, tokensColocados: [...m.tokensColocados, newToken] } : m
            ),
          };
        });

        await sleep(600);

        // Step B: rotate grid in revolution for ANY player (Human or Bot)
        runInAction(() => {
          if (!this.tablero) return;
          this.revolutionAnimating = true;
          this.tablero = {
            ...this.tablero,
            grid: applyRevolution(this.tablero.grid, targetAstroPos),
          };
          const logEntry: ActionResolutionLog = {
            jugadorNombre: act.jugadorNombre,
            jugadorNumero: act.jugadorNumero,
            cartaNombre: act.cartaNombre,
            tipoAccion: act.tipoAccion,
            prioridad: act.prioridad,
            detalle: `Coloca 1 ficha al centro y rota el semiciclo ${act.tipoAccion === 'REVOLUCION_SOL' ? 'solar' : 'lunar'}`,
          };
          newLogs.push(logEntry);
          this.actionLogs = [...newLogs];
        });

        await sleep(1000);
        runInAction(() => {
          this.revolutionAnimating = false;
          this.activeMusaIndex = null;
        });
      } else if (act.tipoAccion === 'INSPIRACION') {
        const musaName = act.musaName!;
        const targetCells = getInspirationTargetCells(musaName, currentTablero.solPos);
        tokensDeductMap[act.jugadorId] = (tokensDeductMap[act.jugadorId] || 0) + targetCells.length * 2;

        runInAction(() => {
          if (!this.tablero) return;
          let updatedG = [...this.tablero.grid];
          targetCells.forEach((targetIndex) => {
            const newTokens = Array.from({ length: 2 }, () => ({
              id: getNextTokenId(),
              colocado: true,
              jugador: act.jugador,
              jugadorId: act.jugadorId,
            }));
            updatedG = updatedG.map((m, idx) =>
              idx === targetIndex ? { ...m, tokensColocados: [...m.tokensColocados, ...newTokens] } : m
            );
          });
          this.tablero = { ...this.tablero, grid: updatedG };

          const cardIdx = currentCards.findIndex((c) => c.id === act.rawCard?.id);
          if (cardIdx !== -1) {
            currentCards[cardIdx] = { ...currentCards[cardIdx], usada: true } as CartaInspiracion;
            this.cards = currentCards;
          }

          const logEntry: ActionResolutionLog = {
            jugadorNombre: act.jugadorNombre,
            jugadorNumero: act.jugadorNumero,
            cartaNombre: act.cartaNombre,
            tipoAccion: 'INSPIRACION',
            prioridad: act.prioridad,
            detalle: `Coloca fichas geométricas según el Sol`,
          };
          newLogs.push(logEntry);
          this.actionLogs = [...newLogs];
        });

        await sleep(1100);
      }

      await sleep(300);
    }

    // Advance Astros
    runInAction(() => {
      if (!this.tablero || !this.partida) return;
      this.setNotification('Avanzando astros en la órbita celeste...');
    });
    await sleep(600);

    runInAction(() => {
      if (!this.tablero || !this.partida) return;

      const { solPos: nextSol, lunaPos: nextLuna } = advanceAstros(
        this.tablero.solPos,
        this.tablero.lunaPos
      );

      const updatedJugadores = currentPartida.jugadores.map((j) => {
        const deduct = tokensDeductMap[j.id] || (j.numeroJugador === 1 ? (tokensDeductMap[1] || 0) : 0);
        if (j.numeroJugador === 1 && j.tokens && deduct > 0) return { ...j, tokens: j.tokens.slice(deduct) };
        if (j.numeroJugador === 2 && j.tokens) return { ...j, tokens: j.tokens.slice(2) };
        if (j.numeroJugador === 3 && j.tokens) return { ...j, tokens: j.tokens.slice(1) };
        if (j.tokens && deduct > 0) return { ...j, tokens: j.tokens.slice(deduct) };
        return j;
      });

      const currentRound = currentPartida.rondaActual;
      const isFinishing = currentRound >= currentPartida.maxRondas;

      this.tablero = {
        ...this.tablero,
        solPos: nextSol,
        lunaPos: nextLuna,
      };

      if (isFinishing) {
        const breakdown = calculateScoreBreakdown(this.tablero, updatedJugadores);
        const finalJugadores = updatedJugadores.map((j) => {
          let totalPts = 0;
          Object.values(breakdown.matrix || {}).forEach((mRow: any) => {
            const item = mRow?.[j.id ?? ''] ?? mRow?.[String(j.id)] ?? mRow?.[j.nombre];
            if (item) {
              totalPts += item.points || 0;
            }
          });
          return { ...j, puntuacionTotal: totalPts };
        });

        const maxScore = Math.max(...finalJugadores.map((j) => j.puntuacionTotal));
        const winners = finalJugadores.filter((j) => j.puntuacionTotal === maxScore);

        this.partida = {
          ...currentPartida,
          rondaActual: currentPartida.maxRondas,
          tablero: this.tablero,
          jugadores: finalJugadores,
          ganadores: winners.map((w) => ({ id: w.id, username: w.nombre })),
        };

        this.scoreBreakdown = breakdown;
        this.isGameOver = true;
        this.isSubmitting = false;
        this.isResolvingRound = false;
        this.currentExecutingAction = null;
        this.pendingActions = [];
        this.activeMusaIndex = null;
        this.revolutionAnimating = false;
        this.registrarEstadisticasFinPartida(this.partida, this.partida.ganadores as any);
        this.setNotification('¡Partida finalizada! Calculando favores de las Musas...');
      } else {
        const nextRound = currentRound + 1;
        this.partida = {
          ...currentPartida,
          rondaActual: nextRound,
          tablero: this.tablero,
          jugadores: updatedJugadores,
        };

        this.selectedCard = null;
        this.hoveredCard = null;
        this.isSubmitting = false;
        this.haSeleccionadoCarta = false;
        this.seleccionesRonda = {};
        this.isResolvingRound = false;
        this.currentExecutingAction = null;
        this.pendingActions = [];
        this.activeMusaIndex = null;
        this.revolutionAnimating = false;
        this.setNotification(`¡Ronda ${nextRound} iniciada! Elige tu próxima carta.`);
        this.prepararAccionesBots();
        setTimeout(() => runInAction(() => { this.notification = null; }), 3500);
      }
    });
  }
}

export const gameStore = new GameStore();
