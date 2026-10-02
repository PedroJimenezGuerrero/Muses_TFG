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

function calculateScoreBreakdown(tablero: Tablero, jugadores: Jugador[]): ScoreBreakdown {
  const matrix: ScoreBreakdownMap = {} as any;
  const playerTotals: Record<number, number> = {};
  jugadores.forEach((j) => {
    playerTotals[j.id ?? j.numeroJugador] = 0;
  });

  tablero.grid.forEach((musa) => {
    const meta = MUSAS_METADATA[musa.nombre];
    const tokensByPlayer: Record<number, number> = {};
    jugadores.forEach((j) => {
      tokensByPlayer[j.id ?? j.numeroJugador] = 0;
    });

    musa.tokensColocados.forEach((token: any) => {
      const pid = token.jugador?.id ?? token.jugadorId ?? token.jugador?.numeroJugador ?? token.numeroJugador ?? 1;
      tokensByPlayer[pid] = (tokensByPlayer[pid] || 0) + 1;
    });

    const entries = Object.entries(tokensByPlayer).map(([pId, count]) => ({
      playerId: Number(pId),
      tokens: count,
    }));

    entries.sort((a, b) => b.tokens - a.tokens);

    const breakdownRow: Record<string, { tokens: number; points: number; tieInfo?: string }> = {};

    let rank = 1;
    let i = 0;
    while (i < entries.length) {
      const currentTokens = entries[i].tokens;
      if (currentTokens === 0) {
        for (let j = i; j < entries.length; j++) {
          const p = jugadores.find((pl) => (pl.id ?? pl.numeroJugador) === entries[j].playerId);
          if (p) {
            breakdownRow[p.nombre] = { tokens: 0, points: 0 };
          }
        }
        break;
      }

      const tiedGroup = entries.filter((e) => e.tokens === currentTokens);
      const countTied = tiedGroup.length;

      let pointsPerPlayer = 0;
      let tieText = '';

      if (countTied === 1) {
        if (rank === 1) pointsPerPlayer = meta.primerPuesto;
        else if (rank === 2) pointsPerPlayer = meta.segundoPuesto;
        else if (rank === 3) pointsPerPlayer = meta.tercerPuesto;
      } else {
        if (rank === 1) {
          if (countTied === 2) {
            pointsPerPlayer = Math.floor((meta.primerPuesto + meta.segundoPuesto) / 2);
            tieText = `Empate 1º (P1+P2)/2 = ⌊(${meta.primerPuesto}+${meta.segundoPuesto})/2⌋ = ${pointsPerPlayer} pts`;
          } else {
            pointsPerPlayer = Math.floor((meta.primerPuesto + meta.segundoPuesto + meta.tercerPuesto) / countTied);
            tieText = `Empate triple 1º (P1+P2+P3)/${countTied} = ${pointsPerPlayer} pts`;
          }
        } else if (rank === 2) {
          pointsPerPlayer = Math.floor((meta.segundoPuesto + meta.tercerPuesto) / countTied);
          tieText = `Empate 2º (P2+P3)/${countTied} = ${pointsPerPlayer} pts`;
        } else if (rank === 3) {
          pointsPerPlayer = Math.floor(meta.tercerPuesto / countTied);
          tieText = `Empate 3º P3/${countTied} = ${pointsPerPlayer} pts`;
        }
      }

      tiedGroup.forEach((e) => {
        const p = jugadores.find((pl) => (pl.id ?? pl.numeroJugador) === e.playerId);
        if (p) {
          breakdownRow[p.nombre] = {
            tokens: e.tokens,
            points: pointsPerPlayer,
            tieInfo: tieText || undefined,
          };
          playerTotals[e.playerId] += pointsPerPlayer;
        }
      });

      rank += countTied;
      i += countTied;
    }

    matrix[musa.nombre] = breakdownRow;
  });

  const totals = jugadores.map((j) => ({
    jugadorId: j.id ?? j.numeroJugador,
    nombre: j.nombre,
    puntos: playerTotals[j.id ?? j.numeroJugador] || 0,
  }));

  totals.sort((a, b) => b.puntos - a.puntos);
  const maxPts = totals[0]?.puntos || 0;
  const winners = totals.filter((t) => t.puntos === maxPts).map((t) => t.nombre);

  return {
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

  const currentUsername = usuario?.username || 'Apolo (Tú)';
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

  const inspirationCard: CartaInspiracion = {
    id: 105,
    tipoCarta: 'INSPIRACION',
    nombreMusa: 'TERPSICORE',
    usada: false,
    nombre: 'Inspiración de Terpsícore',
  };

  return {
    tablero: initialTablero,
    partida: initialPartida,
    cards: [...commonActions, inspirationCard],
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
        const found = users.find((u) => u.username.toLowerCase() === username.toLowerCase());
        if (found) {
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
              (j) => j.id === jugador.id || j.nombre === jugador.nombre
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
              this.lobbyChannel?.postMessage({ type: 'SALA_UPDATE', sala: toJS(this.sala) });
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
    socketService.send(`/topic/sala/${codigo}/accion`, data);
    this.lobbyChannel?.postMessage({
      type: 'SALA_ACTION',
      codigo,
      data: toJS(data),
    });
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(
          `muses_action_${codigo}`,
          JSON.stringify({ ...toJS(data), _ts: Date.now() })
        );
      } catch (e) {}
    }
  }

  procesarAccionSala(data: any) {
    if (!data) return;
    runInAction(() => {
      if (data.type === 'GAME_START_SYNC' && data.tablero && data.partida) {
        this.tablero = data.tablero;
        this.partida = data.partida;
        if (data.cards) {
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

  iniciarPartidaContraBots() {
    this.initGame();
    this.enPartida = true;
  }

  async crearSala(maxJugadores: number = 3) {
    const currentName = this.usuario?.username || 'Apolo (Tú)';
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
      this.lobbyChannel?.postMessage({ type: 'SALA_UPDATE', sala: toJS(this.sala) });
    }
    this.conectarASalaWS(randCode);
  }

  async unirseASala(codigo: string) {
    const cleanCode = codigo.trim().toUpperCase();
    const currentName = this.usuario?.username || 'Invitado (Tú)';
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
          (j) => j.id === nuevoJugador.id || j.nombre === nuevoJugador.nombre
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
      jugador: toJS(nuevoJugador),
    });
    if (this.sala) {
      this.lobbyChannel?.postMessage({
        type: 'SALA_UPDATE',
        sala: toJS(this.sala),
      });
    }

    this.conectarASalaWS(cleanCode);
  }

  conectarASalaWS(codigo: string) {
    this.initLobbyChannel();
    socketService.subscribe(`/topic/sala/${codigo}`, (data: Sala) => {
      runInAction(() => {
        if (data && data.codigo === codigo) {
          this.sala = data;
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
      tablero: toJS(this.tablero),
      partida: toJS(this.partida),
      cards: toJS(this.cards),
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
      const roomJugadores: Jugador[] = this.sala.jugadores.map((j, idx) => ({
        id: j.id || (idx + 1),
        nombre: j.nombre,
        numeroJugador: idx + 1,
        puntuacionTotal: 0,
        usuario: j.usuario,
        tokens: Array.from({ length: 20 }, (_, tIdx) => ({
          id: (idx + 1) * 100 + tIdx,
          colocado: false,
          jugador: { id: j.id || (idx + 1), nombre: j.nombre, numeroJugador: idx + 1, puntuacionTotal: 0 },
        })),
      }));
      this.partida.jugadores = roomJugadores;
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
    if (this.usuario && this.sala.anfitrion) {
      if (this.sala.anfitrion.id === this.usuario.id || this.sala.anfitrion.nombre === this.usuario.username) {
        return true;
      }
    }
    if (this.sala.anfitrion?.id && this.sala.anfitrion.id === this.jugadorActualId) {
      return true;
    }
    return false;
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
      const myJugador = currentPartida.jugadores.find(
        (j) => (this.usuario && (j.id === this.usuario.id || j.nombre === this.usuario.username))
      ) || (this.isAnfitrion ? currentPartida.jugadores[0] : currentPartida.jugadores[1]) || currentPartida.jugadores[0];

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
        jugador: myJugador,
        jugadorId: myJugador.id,
        jugadorNumero: myJugador.numeroJugador,
        jugadorNombre: myJugador.nombre,
        cartaNombre,
        tipoAccion,
        prioridad,
        astroPos,
        musaName,
        rawCard: card,
      };

      runInAction(() => {
        this.haSeleccionadoCarta = true;
        this.isSubmitting = true;
        this.seleccionesRonda = {
          ...this.seleccionesRonda,
          [myJugador.id]: plannedAction,
        };
      });

      // Broadcast to other players
      this.enviarAccionSala(this.sala!.codigo, {
        type: 'SELECCION_CARTA',
        payload: plannedAction,
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
      actionsToExecute.push({
        jugador: bot1,
        jugadorId: bot1.id,
        jugadorNumero: 2,
        jugadorNombre: bot1.nombre,
        cartaNombre: 'Devoción Lunar',
        tipoAccion: 'DEVOCION_LUNA',
        prioridad: 5,
        astroPos: currentTablero.lunaPos,
      });
    }

    if (bot2) {
      actionsToExecute.push({
        jugador: bot2,
        jugadorId: bot2.id,
        jugadorNumero: 3,
        jugadorNombre: bot2.nombre,
        cartaNombre: 'Revolución Lunar',
        tipoAccion: 'REVOLUCION_LUNA',
        prioridad: 4,
        astroPos: currentTablero.lunaPos,
      });
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
              const newTokens = Array.from({ length: 2 }, (_, i) => ({
                id: Date.now() + i,
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
                id: Date.now(),
                colocado: true,
                jugador: act.jugador,
                jugadorId: act.jugadorId,
              };
              updatedGrid = updatedGrid.map((m, idx) =>
                idx === 4 ? { ...m, tokensColocados: [...m.tokensColocados, newToken] } : m
              );
              if (act.jugadorNumero === 1 || this.sala) {
                updatedGrid = applyRevolution(updatedGrid, act.astroPos!);
              }
              newLogs.push({
                jugadorNombre: act.jugadorNombre,
                jugadorNumero: act.jugadorNumero,
                cartaNombre: act.cartaNombre,
                tipoAccion: act.tipoAccion,
                prioridad: act.prioridad,
                detalle: (act.jugadorNumero === 1 || this.sala)
                  ? `Coloca 1 ficha al centro y rota el semiciclo ${act.tipoAccion === 'REVOLUCION_SOL' ? 'solar' : 'lunar'}`
                  : `Coloca 1 ficha al centro`,
              });
            } else if (act.tipoAccion === 'INSPIRACION') {
              const musaName = act.musaName!;
              const targetCells = getInspirationTargetCells(musaName, currentTablero.solPos);
              tokensDeductMap[act.jugadorId] = (tokensDeductMap[act.jugadorId] || 0) + targetCells.length * 2;
              targetCells.forEach((targetIndex) => {
                const newTokens = Array.from({ length: 2 }, (_, i) => ({
                  id: Date.now() + targetIndex * 10 + i,
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
                if (mRow && mRow[j.nombre]) totalPts += mRow[j.nombre].points || 0;
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

    for (const act of actionsToExecute) {
      if (!this.tablero) break;

      tokensDeductMap[act.jugadorId] = (tokensDeductMap[act.jugadorId] || 0);

      runInAction(() => {
        this.setNotification(`Resolviendo: ${act.jugadorNombre} juega ${act.cartaNombre}...`);
      });
      await sleep(500);

      if (act.tipoAccion === 'DEVOCION_SOL' || act.tipoAccion === 'DEVOCION_LUNA') {
        const targetIndex = mapAstroToGrid(act.astroPos!);
        tokensDeductMap[act.jugadorId] += 2;

        const newTokens = Array.from({ length: 2 }, (_, i) => ({
          id: Date.now() + Math.random() * 1000 + i,
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

        const newToken = {
          id: Date.now() + Math.random() * 1000,
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

        // Step B: rotate grid in revolution
        if (act.jugadorNumero === 1 || this.sala) {
          runInAction(() => {
            if (!this.tablero) return;
            this.revolutionAnimating = true;
            this.tablero = {
              ...this.tablero,
              grid: applyRevolution(this.tablero.grid, act.astroPos!),
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
        } else {
          runInAction(() => {
            const logEntry: ActionResolutionLog = {
              jugadorNombre: act.jugadorNombre,
              jugadorNumero: act.jugadorNumero,
              cartaNombre: act.cartaNombre,
              tipoAccion: act.tipoAccion,
              prioridad: act.prioridad,
              detalle: `Coloca 1 ficha al centro`,
            };
            newLogs.push(logEntry);
            this.actionLogs = [...newLogs];
            this.activeMusaIndex = null;
          });
          await sleep(500);
        }
      } else if (act.tipoAccion === 'INSPIRACION') {
        const musaName = act.musaName!;
        const targetCells = getInspirationTargetCells(musaName, currentTablero.solPos);
        tokensDeductMap[act.jugadorId] = (tokensDeductMap[act.jugadorId] || 0) + targetCells.length * 2;

        runInAction(() => {
          if (!this.tablero) return;
          let updatedG = [...this.tablero.grid];
          targetCells.forEach((targetIndex) => {
            const newTokens = Array.from({ length: 2 }, (_, i) => ({
              id: Date.now() + targetIndex * 10 + i,
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
            if (mRow && mRow[j.nombre]) {
              totalPts += mRow[j.nombre].points || 0;
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
        this.activeMusaIndex = null;
        this.revolutionAnimating = false;
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
        this.activeMusaIndex = null;
        this.revolutionAnimating = false;
        this.setNotification(`¡Ronda ${nextRound} iniciada! Elige tu próxima carta.`);
        setTimeout(() => runInAction(() => { this.notification = null; }), 3500);
      }
    });
  }
}

export const gameStore = new GameStore();
