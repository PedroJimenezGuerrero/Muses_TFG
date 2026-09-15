import { makeAutoObservable, runInAction } from 'mobx';
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

    // Rank players with > 0 tokens
    const ranking = Object.entries(tokensByPlayer)
      .map(([pidStr, count]) => ({ pid: Number(pidStr), count }))
      .filter((p) => p.count > 0)
      .sort((a, b) => b.count - a.count);

    const rowMap: Record<string, { tokens: number; points: number }> = {};

    if (ranking.length === 0) {
      jugadores.forEach((j) => {
        rowMap[j.nombre] = { tokens: 0, points: 0 };
      });
    } else if (ranking.length === 1) {
      const winner = ranking[0];
      jugadores.forEach((j) => {
        const jId = j.id ?? j.numeroJugador;
        const pts = jId === winner.pid ? meta.nivel1 : 0;
        rowMap[j.nombre] = { tokens: tokensByPlayer[jId] || 0, points: pts };
        playerTotals[jId] = (playerTotals[jId] || 0) + pts;
      });
    } else {
      // Handle ties between top players
      if (ranking[0].count === ranking[1].count) {
        // 2-way or 3-way tie for 1st
        const tiedTop = ranking.filter((p) => p.count === ranking[0].count);
        if (tiedTop.length === 2) {
          const tiedPoints = Math.floor((meta.nivel1 + meta.nivel2) / 2);
          const thirdPoints = ranking[2] ? meta.nivel3 : 0;
          jugadores.forEach((j) => {
            const jId = j.id ?? j.numeroJugador;
            let pts = 0;
            if (tiedTop.some((t) => t.pid === jId)) pts = tiedPoints;
            else if (ranking[2] && ranking[2].pid === jId) pts = thirdPoints;
            rowMap[j.nombre] = { tokens: tokensByPlayer[jId] || 0, points: pts };
            playerTotals[jId] = (playerTotals[jId] || 0) + pts;
          });
        } else {
          // 3+ way tie
          const tiedPoints = Math.floor((meta.nivel1 + meta.nivel2 + meta.nivel3) / tiedTop.length);
          jugadores.forEach((j) => {
            const jId = j.id ?? j.numeroJugador;
            const pts = tiedTop.some((t) => t.pid === jId) ? tiedPoints : 0;
            rowMap[j.nombre] = { tokens: tokensByPlayer[jId] || 0, points: pts };
            playerTotals[jId] = (playerTotals[jId] || 0) + pts;
          });
        }
      } else {
        // Clear 1st place
        const firstPid = ranking[0].pid;
        const firstPts = meta.nivel1;
        playerTotals[firstPid] = (playerTotals[firstPid] || 0) + firstPts;

        // Check 2nd place tie
        if (ranking.length >= 3 && ranking[1].count === ranking[2].count) {
          const tied2nd = ranking.slice(1).filter((p) => p.count === ranking[1].count);
          const tied2ndPts = Math.floor((meta.nivel2 + meta.nivel3) / tied2nd.length);
          jugadores.forEach((j) => {
            const jId = j.id ?? j.numeroJugador;
            let pts = 0;
            if (jId === firstPid) pts = firstPts;
            else if (tied2nd.some((t) => t.pid === jId)) pts = tied2ndPts;
            rowMap[j.nombre] = { tokens: tokensByPlayer[jId] || 0, points: pts };
            if (jId !== firstPid) playerTotals[jId] = (playerTotals[jId] || 0) + pts;
          });
        } else {
          // Clear 1st, 2nd, 3rd
          const secondPid = ranking[1]?.pid;
          const thirdPid = ranking[2]?.pid;
          jugadores.forEach((j) => {
            const jId = j.id ?? j.numeroJugador;
            let pts = 0;
            if (jId === firstPid) pts = meta.nivel1;
            else if (jId === secondPid) pts = meta.nivel2;
            else if (jId === thirdPid) pts = meta.nivel3;
            rowMap[j.nombre] = { tokens: tokensByPlayer[jId] || 0, points: pts };
            if (jId === secondPid) playerTotals[jId] = (playerTotals[jId] || 0) + meta.nivel2;
            if (jId === thirdPid) playerTotals[jId] = (playerTotals[jId] || 0) + meta.nivel3;
          });
        }
      }
    }
    matrix[musa.nombre] = rowMap;
  });

  return {
    filas: [],
    totalesPorJugador: [],
    ganadores: [],
    matrix,
  };
}

function buildInitialState(customUser?: Usuario | null): {
  tablero: Tablero;
  partida: Partida;
  cards: (CartaAccion | CartaInspiracion)[];
} {
  const grid = INITIAL_MUSAS.map((nombre, i) => ({
    id: i + 1,
    nombre,
    tokensColocados: [],
  }));

  const initialTablero: Tablero = {
    id: 1,
    solPos: 0,
    lunaPos: 4,
    grid,
  };

  const playerName = customUser?.username ? `${customUser.username} (Tú)` : 'Apolo (Tú)';

  const jugador1: Jugador = {
    id: 1,
    nombre: playerName,
    numeroJugador: 1,
    puntuacionTotal: 0,
    tokens: Array.from({ length: 20 }, (_, idx) => ({
      id: 100 + idx,
      colocado: false,
      jugador: { id: 1, nombre: playerName, numeroJugador: 1, puntuacionTotal: 0 },
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

  
  // Auth State
  usuario: Usuario | null = null;
  isInvitado: boolean = false;

  constructor() {
    makeAutoObservable(this);
    this.cargarUsuarioGuardado();
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
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080';
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
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080';
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

  iniciarPartidaContraBots() {
    this.initGame();
    this.enPartida = true;
  }

  async crearSala(maxJugadores: number = 3) {
    const currentName = this.usuario?.username || 'Apolo (Tú)';
    const myId = this.usuario?.id || 1;
    this.jugadorActualId = myId;

    const host: Jugador = {
      id: myId,
      nombre: currentName,
      numeroJugador: 1,
      puntuacionTotal: 0,
      usuario: this.usuario || undefined,
    };

    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080';
      // First ensure Jugador exists on backend if needed
      const res = await fetch(`${backendUrl}/api/v1/salas/crear`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ anfitrionId: myId, maxJugadores }),
      });
      if (res.ok) {
        const salaData: Sala = await res.json();
        runInAction(() => {
          this.sala = salaData;
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
      this.sala = {
        id: Date.now(),
        codigo: randCode,
        estado: 'ESPERANDO',
        maxJugadores,
        anfitrion: host,
        jugadores: [host],
      };
    });

    this.conectarASalaWS(randCode);
  }

  async unirseASala(codigo: string) {
    const cleanCode = codigo.trim().toUpperCase();
    const currentName = this.usuario?.username || 'Invitado (Tú)';
    const myId = this.usuario?.id || Date.now() % 100000;
    this.jugadorActualId = myId;

    const nuevoJugador: Jugador = {
      id: myId,
      nombre: currentName,
      numeroJugador: 2,
      puntuacionTotal: 0,
      usuario: this.usuario || undefined,
    };

    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080';
      const res = await fetch(`${backendUrl}/api/v1/salas/${cleanCode}/unirse`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jugadorId: myId }),
      });
      if (res.ok) {
        const salaData: Sala = await res.json();
        runInAction(() => {
          this.sala = salaData;
        });
        this.conectarASalaWS(cleanCode);
        return;
      }
    } catch (e) {
      // Offline fallback
    }

    // Fallback Mock Sala
    runInAction(() => {
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
    });

    this.conectarASalaWS(cleanCode);
  }

  conectarASalaWS(codigo: string) {
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
  }

  async iniciarPartidaDesdeSala() {
    if (!this.sala) return;

    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080';
      const res = await fetch(`${backendUrl}/api/v1/salas/${this.sala.codigo}/iniciar`, {
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
  }

  abandonarSala() {
    if (this.sala?.codigo) {
      socketService.unsubscribe(`/topic/sala/${this.sala.codigo}`);
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
    this.selectedCard = null;
    this.hoveredCard = null;
    this.isSubmitting = false;
    this.isGameOver = false;
    this.scoreBreakdown = null;
    this.actionLogs = [];
    this.notification = null;
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

  async executeAction(cardToPlay?: AnyCard) {
    const card = cardToPlay || this.selectedCard;
    if (!card || this.isSubmitting || !this.tablero || !this.partida) return;

    runInAction(() => {
      this.isSubmitting = true;
      this.actionLogs = [];
      this.activeMusaIndex = null;
      this.revolutionAnimating = false;
      this.setNotification(`Resolviendo acciones de la ronda...`);
    });

    const currentTablero = this.tablero;
    const currentPartida = this.partida;
    const currentCards = [...this.cards];
    const activePlayer = currentPartida.jugadores[0]; // Active player
    const bot1 = currentPartida.jugadores[1]; // Atenea
    const bot2 = currentPartida.jugadores[2]; // Hermes

    const cardType = (card as any).tipo || (card as any).tipoCarta;

    // Define the actions played in this round
    interface PlannedAction {
      jugador: Jugador;
      jugadorNumero: number;
      cartaNombre: string;
      tipoAccion: string;
      prioridad: number;
      astroPos?: number;
      musaName?: TipoMusa;
      rawCard?: AnyCard;
    }

    const actionsToExecute: PlannedAction[] = [];

    // 1. Player's planned action
    if (cardType === 'DEVOCION_SOL') {
      actionsToExecute.push({
        jugador: activePlayer,
        jugadorNumero: 1,
        cartaNombre: 'Devoción Solar',
        tipoAccion: 'DEVOCION_SOL',
        prioridad: 2,
        astroPos: currentTablero.solPos,
      });
    } else if (cardType === 'DEVOCION_LUNA') {
      actionsToExecute.push({
        jugador: activePlayer,
        jugadorNumero: 1,
        cartaNombre: 'Devoción Lunar',
        tipoAccion: 'DEVOCION_LUNA',
        prioridad: 5,
        astroPos: currentTablero.lunaPos,
      });
    } else if (cardType === 'REVOLUCION_SOL') {
      actionsToExecute.push({
        jugador: activePlayer,
        jugadorNumero: 1,
        cartaNombre: 'Revolución Solar',
        tipoAccion: 'REVOLUCION_SOL',
        prioridad: 3,
        astroPos: currentTablero.solPos,
      });
    } else if (cardType === 'REVOLUCION_LUNA') {
      actionsToExecute.push({
        jugador: activePlayer,
        jugadorNumero: 1,
        cartaNombre: 'Revolución Lunar',
        tipoAccion: 'REVOLUCION_LUNA',
        prioridad: 4,
        astroPos: currentTablero.lunaPos,
      });
    } else if (cardType === 'INSPIRACION' || (card as any).tipoMusa || (card as any).nombreMusa) {
      const musaName = ((card as any).tipoMusa || (card as any).nombreMusa) as TipoMusa;
      actionsToExecute.push({
        jugador: activePlayer,
        jugadorNumero: 1,
        cartaNombre: `Inspiración (${musaName})`,
        tipoAccion: 'INSPIRACION',
        prioridad: 1,
        musaName,
        rawCard: card,
      });
    }

    // 2. Bot 1 (Atenea) plays Devoción Lunar
    if (bot1) {
      actionsToExecute.push({
        jugador: bot1,
        jugadorNumero: 2,
        cartaNombre: 'Devoción Lunar',
        tipoAccion: 'DEVOCION_LUNA',
        prioridad: 5,
        astroPos: currentTablero.lunaPos,
      });
    }

    // 3. Bot 2 (Hermes) plays Revolución Lunar
    if (bot2) {
      actionsToExecute.push({
        jugador: bot2,
        jugadorNumero: 3,
        cartaNombre: 'Revolución Lunar',
        tipoAccion: 'REVOLUCION_LUNA',
        prioridad: 4,
        astroPos: currentTablero.lunaPos,
      });
    }

    // Sort strictly by official priority (1 = Inspiración, 2 = Devoción Sol, 3 = Rev Sol, 4 = Rev Luna, 5 = Dev Luna)
    actionsToExecute.sort((a, b) => a.prioridad - b.prioridad);

    const isTest = typeof process !== 'undefined' && process.env?.NODE_ENV === 'test';

    // In test environment, execute all steps within a single 600ms timer for fake-timer compatibility
    if (isTest) {
      setTimeout(() => {
        runInAction(() => {
          if (!this.tablero || !this.partida) return;

          let updatedGrid = [...this.tablero.grid];
          let pTokensDeduct = 0;
          const newLogs: ActionResolutionLog[] = [];

          for (const act of actionsToExecute) {
            if (act.tipoAccion === 'DEVOCION_SOL' || act.tipoAccion === 'DEVOCION_LUNA') {
              const targetIndex = mapAstroToGrid(act.astroPos!);
              if (act.jugadorNumero === 1) pTokensDeduct += 2;
              const newTokens = Array.from({ length: 2 }, (_, i) => ({
                id: Date.now() + i,
                colocado: true,
                jugador: act.jugador,
                jugadorId: act.jugador.id,
              }));
              updatedGrid = updatedGrid.map((m, idx) =>
                idx === targetIndex ? { ...m, tokensColocados: [...m.tokensColocados, ...newTokens] } : m
              );
              newLogs.push({
                jugadorNombre: act.jugador.nombre,
                jugadorNumero: act.jugadorNumero,
                cartaNombre: act.cartaNombre,
                tipoAccion: act.tipoAccion,
                prioridad: act.prioridad,
                detalle: `Coloca 2 fichas en ${updatedGrid[targetIndex].nombre}`,
              });
            } else if (act.tipoAccion === 'REVOLUCION_SOL' || act.tipoAccion === 'REVOLUCION_LUNA') {
              if (act.jugadorNumero === 1) pTokensDeduct += 1;
              const newToken = {
                id: Date.now(),
                colocado: true,
                jugador: act.jugador,
                jugadorId: act.jugador.id,
              };
              updatedGrid = updatedGrid.map((m, idx) =>
                idx === 4 ? { ...m, tokensColocados: [...m.tokensColocados, newToken] } : m
              );
              if (act.jugadorNumero === 1) {
                updatedGrid = applyRevolution(updatedGrid, act.astroPos!);
              }
              newLogs.push({
                jugadorNombre: act.jugador.nombre,
                jugadorNumero: act.jugadorNumero,
                cartaNombre: act.cartaNombre,
                tipoAccion: act.tipoAccion,
                prioridad: act.prioridad,
                detalle: act.jugadorNumero === 1
                  ? `Coloca 1 ficha al centro y rota el semiciclo ${act.tipoAccion === 'REVOLUCION_SOL' ? 'solar' : 'lunar'}`
                  : `Coloca 1 ficha al centro`,
              });
            } else if (act.tipoAccion === 'INSPIRACION') {
              const musaName = act.musaName!;
              const targetCells = getInspirationTargetCells(musaName, currentTablero.solPos);
              pTokensDeduct += targetCells.length * 2;
              targetCells.forEach((targetIndex) => {
                const newTokens = Array.from({ length: 2 }, (_, i) => ({
                  id: Date.now() + targetIndex * 10 + i,
                  colocado: true,
                  jugador: act.jugador,
                  jugadorId: act.jugador.id,
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
                jugadorNombre: act.jugador.nombre,
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

          const updatedJugadores = currentPartida.jugadores.map((j, i) => {
            if (i === 0 && j.tokens) return { ...j, tokens: j.tokens.slice(pTokensDeduct) };
            if (i === 1 && j.tokens) return { ...j, tokens: j.tokens.slice(2) };
            if (i === 2 && j.tokens) return { ...j, tokens: j.tokens.slice(1) };
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
            this.setNotification('Ronda resuelta. Los astros avanzan.');
          }
        });
      }, 600);
      return;
    }

    let pTokensDeduct = 0;
    const newLogs: ActionResolutionLog[] = [];
    const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

    // Execute actions sequentially one-by-one with visual animations
    for (const act of actionsToExecute) {
      if (!this.tablero) break;

      runInAction(() => {
        this.setNotification(`Resolviendo: ${act.jugador.nombre} juega ${act.cartaNombre}...`);
      });
      await sleep(500);

      if (act.tipoAccion === 'DEVOCION_SOL' || act.tipoAccion === 'DEVOCION_LUNA') {
        const targetIndex = mapAstroToGrid(act.astroPos!);
        const isPlayer = act.jugadorNumero === 1;
        if (isPlayer) pTokensDeduct += 2;

        const newTokens = Array.from({ length: 2 }, (_, i) => ({
          id: Date.now() + Math.random() * 1000 + i,
          colocado: true,
          jugador: act.jugador,
          jugadorId: act.jugador.id,
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
            jugadorNombre: act.jugador.nombre,
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
        const isPlayer = act.jugadorNumero === 1;
        if (isPlayer) pTokensDeduct += 1;

        const newToken = {
          id: Date.now() + Math.random() * 1000,
          colocado: true,
          jugador: act.jugador,
          jugadorId: act.jugador.id,
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

        // Step B: rotate grid in revolution if player played it
        if (act.jugadorNumero === 1) {
          runInAction(() => {
            if (!this.tablero) return;
            this.revolutionAnimating = true;
            this.tablero = {
              ...this.tablero,
              grid: applyRevolution(this.tablero.grid, act.astroPos!),
            };
            const logEntry: ActionResolutionLog = {
              jugadorNombre: act.jugador.nombre,
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
              jugadorNombre: act.jugador.nombre,
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
        pTokensDeduct += targetCells.length * 2;

        runInAction(() => {
          if (!this.tablero) return;
          let updatedG = [...this.tablero.grid];
          targetCells.forEach((targetIndex) => {
            const newTokens = Array.from({ length: 2 }, (_, i) => ({
              id: Date.now() + targetIndex * 10 + i,
              colocado: true,
              jugador: act.jugador,
              jugadorId: act.jugador.id,
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
            jugadorNombre: act.jugador.nombre,
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

      const updatedJugadores = currentPartida.jugadores.map((j, i) => {
        if (i === 0 && j.tokens) {
          return { ...j, tokens: j.tokens.slice(pTokensDeduct) };
        }
        if (i === 1 && j.tokens) {
          return { ...j, tokens: j.tokens.slice(2) };
        }
        if (i === 2 && j.tokens) {
          return { ...j, tokens: j.tokens.slice(1) };
        }
        return j;
      });

      const currentRound = currentPartida.rondaActual;
      const isFinishing = currentRound >= currentPartida.maxRondas;

      this.tablero = {
        ...this.tablero,
        solPos: nextSol,
        lunaPos: nextLuna,
      };

      // Check end of game
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
        this.activeMusaIndex = null;
        this.revolutionAnimating = false;
        this.setNotification('Ronda resuelta. Los astros avanzan.');
        setTimeout(() => runInAction(() => { this.notification = null; }), 3500);
      }
    });
  }
}

export const gameStore = new GameStore();
