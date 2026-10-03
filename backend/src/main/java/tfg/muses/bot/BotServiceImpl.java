package tfg.muses.bot;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;

import tfg.muses.carta.CartaAccion;
import tfg.muses.carta.CartaBase;
import tfg.muses.carta.CartaInspiracion;
import tfg.muses.carta.CartaRepository;
import tfg.muses.carta.CartaService;
import tfg.muses.carta.TipoAccion;
import tfg.muses.jugador.Jugador;
import tfg.muses.jugador.JugadorService;
import tfg.muses.musa.Musa;
import tfg.muses.musa.TipoInspiracion;
import tfg.muses.partida.Partida;
import tfg.muses.partida.PartidaService;
import tfg.muses.puntuacion.PuntuacionService;
import tfg.muses.tablero.Tablero;
import tfg.muses.tablero.TableroService;
import tfg.muses.token.Token;

/**
 * Implementación del servicio de inteligencia artificial para jugadores Bot.
 * Evalúa el estado del juego mediante heurísticas codiciosas (F31) y despacha
 * automáticamente los turnos pendientes (F32).
 */
@Service
public class BotServiceImpl implements BotService {

    private static final Logger log = LoggerFactory.getLogger(BotServiceImpl.class);

    @Autowired
    @Lazy
    private PartidaService partidaService;

    @Autowired
    private TableroService tableroService;

    @Autowired
    private PuntuacionService puntuacionService;

    @Autowired
    private CartaService cartaService;

    @Autowired
    private CartaRepository cartaRepository;

    @Autowired
    private JugadorService jugadorService;

    private record CartaUtilidad(CartaBase carta, double utilidad, int prioridad) {}

    @Override
    public CartaBase calcularMejorJugada(Partida partida, Jugador bot) {
        if (partida == null || bot == null || partida.getTablero() == null) {
            return null;
        }

        List<CartaBase> candidatas = obtenerCartasCandidatas(partida, bot);
        if (candidatas.isEmpty()) {
            return null;
        }

        List<CartaUtilidad> evaluadas = new ArrayList<>();
        for (CartaBase carta : candidatas) {
            double utilidad = evaluarUtilidadCarta(partida, bot, carta);
            if (utilidad > -100.0) {
                evaluadas.add(new CartaUtilidad(carta, utilidad, obtenerPrioridad(carta)));
            }
        }

        if (evaluadas.isEmpty()) {
            return candidatas.get(0);
        }

        // Ordenar por utilidad descendente (y menor prioridad oficial en caso de empate)
        evaluadas.sort((a, b) -> {
            int cmp = Double.compare(b.utilidad(), a.utilidad());
            if (cmp != 0) return cmp;
            return Integer.compare(a.prioridad(), b.prioridad());
        });

        return evaluadas.get(0).carta();
    }

    /**
     * Selección de jugada mediante ruleta probabilística:
     * 1ª opción más óptima (30%), 2ª opción intermedia (50%), 3ª opción alternativa (20%).
     */
    public CartaBase calcularJugadaRuleta(Partida partida, Jugador bot) {
        if (partida == null || bot == null || partida.getTablero() == null) {
            return null;
        }

        List<CartaBase> candidatas = obtenerCartasCandidatas(partida, bot);
        if (candidatas.isEmpty()) {
            return null;
        }

        List<CartaUtilidad> evaluadas = new ArrayList<>();
        for (CartaBase carta : candidatas) {
            double utilidad = evaluarUtilidadCarta(partida, bot, carta);
            if (utilidad > -100.0) {
                evaluadas.add(new CartaUtilidad(carta, utilidad, obtenerPrioridad(carta)));
            }
        }

        if (evaluadas.isEmpty()) {
            return candidatas.get(0);
        }

        evaluadas.sort((a, b) -> {
            int cmp = Double.compare(b.utilidad(), a.utilidad());
            if (cmp != 0) return cmp;
            return Integer.compare(a.prioridad(), b.prioridad());
        });

        double r = Math.random();
        if (evaluadas.size() >= 3) {
            if (r < 0.30) {
                return evaluadas.get(0).carta();
            } else if (r < 0.80) {
                return evaluadas.get(1).carta();
            } else {
                return evaluadas.get(2).carta();
            }
        } else if (evaluadas.size() == 2) {
            if (r < 0.40) {
                return evaluadas.get(0).carta();
            } else {
                return evaluadas.get(1).carta();
            }
        } else {
            return evaluadas.get(0).carta();
        }
    }

    @Override
    public void ejecutarTurnoBot(Partida partida, Jugador bot) {
        if (partida == null || bot == null) {
            log.warn("ejecutarTurnoBot abortado: argumentos nulos (partida={}, bot={})", partida, bot);
            return;
        }
        if (partida.getId() == null || bot.getId() == null) {
            log.error("ejecutarTurnoBot abortado: entidades sin identificador persistido (partidaId={}, botId={})",
                    partida.getId(), bot.getId());
            return;
        }

        // Idempotencia: no volver a votar si ya seleccionó en la ronda
        if (partida.getSeleccionesRonda() != null && partida.getSeleccionesRonda().containsKey(bot.getId())) {
            log.debug("ejecutarTurnoBot omitido (idempotente): el bot con id={} ya seleccionó carta en la ronda {} de la partida con id={}",
                    bot.getId(), partida.getRondaActual(), partida.getId());
            return;
        }

        CartaBase mejorCarta = calcularMejorJugada(partida, bot);
        if (mejorCarta == null) {
            log.error("Fallo crítico en ejecutarTurnoBot: no se pudo calcular ninguna jugada válida (mejorCarta es null) para el bot con id={} en la partida con id={}, ronda={}. El turno del bot queda desatendido y la partida puede bloquearse.",
                    bot.getId(), partida.getId(), partida.getRondaActual());
            return;
        }

        if (mejorCarta.getId() == null) {
            if (mejorCarta instanceof CartaAccion ca && ca.getTipo() != null) {
                if (cartaService != null) {
                    try {
                        CartaAccion res = cartaService.obtenerOCrearCartaAccion(ca.getTipo());
                        if (res != null && res.getId() != null) {
                            mejorCarta = res;
                        }
                    } catch (Exception ignored) {}
                }
            }
        }

        if (mejorCarta.getId() == null) {
            log.error("Fallo crítico en ejecutarTurnoBot: la carta seleccionada [nombre='{}', clase={}] para el bot con id={} en la partida con id={}, ronda={} carece de identificador persistido (id es null). Imposible despachar a PartidaService.",
                    mejorCarta.getNombre(), mejorCarta.getClass().getSimpleName(), bot.getId(), partida.getId(), partida.getRondaActual());
            return;
        }

        try {
            partidaService.seleccionarCarta(partida.getId(), bot.getId(), mejorCarta.getId());
            log.info("Turno del bot ejecutado con éxito: bot con id={} seleccionó carta [id={}, nombre='{}'] en partida con id={}, ronda={}",
                    bot.getId(), mejorCarta.getId(), mejorCarta.getNombre(), partida.getId(), partida.getRondaActual());
        } catch (Exception e) {
            log.error("Excepción inesperada al despachar selección de carta [id={}] para el bot con id={} en la partida con id={}, ronda={}: {}",
                    mejorCarta.getId(), bot.getId(), partida.getId(), partida.getRondaActual(), e.getMessage(), e);
        }
    }

    // --- Evaluación Heurística ---

    public double evaluarUtilidadCarta(Partida partida, Jugador bot, CartaBase carta) {
        if (carta == null) {
            return -10000.0;
        }

        int tokensLibres = contarTokensLibres(bot);

        // Caso 1: Carta de Inspiración
        if (carta instanceof CartaInspiracion ci) {
            if (!esInspiracionValida(partida, ci)) {
                return -10000.0;
            }
            if (tokensLibres <= 0) {
                return -1000.0;
            }
            int valorN1 = ci.getNombreMusa() != null ? ci.getNombreMusa().getPuntos(1) : 7;
            double urgencia = calcularUrgenciaInspiracion(
                    partida != null ? partida.getRondaActual() : 1,
                    ci.getNombreMusa() != null ? ci.getNombreMusa().getTipoInspiracion() : TipoInspiracion.VERTICES
            );
            return 100.0 + valorN1 + urgencia;
        }

        // Caso 2: Cartas de Acción
        if (carta instanceof CartaAccion ca && ca.getTipo() != null) {
            TipoAccion tipo = ca.getTipo();

            // Si las fichas de devoción están agotadas, recurrir a revolución
            if (tokensLibres == 0) {
                if (tipo == TipoAccion.DEVOCION_SOL || tipo == TipoAccion.DEVOCION_LUNA) {
                    return -100.0;
                }
                if (tipo == TipoAccion.REVOLUCION_SOL) {
                    return 10.0;
                }
                if (tipo == TipoAccion.REVOLUCION_LUNA) {
                    return 9.0;
                }
            }

            // Consulta de musas en astros
            Tablero tablero = partida != null ? partida.getTablero() : null;
            Musa musaSol = null;
            Musa musaLuna = null;

            if (tableroService != null && tablero != null) {
                try {
                    Map<String, Musa> musasAstros = tableroService.getMusasEnAstros(tablero);
                    if (musasAstros != null) {
                        musaSol = musasAstros.get("sol");
                        musaLuna = musasAstros.get("luna");
                    }
                } catch (Exception ignored) {
                    // Tolerancia si el servicio está mockeado o no responde
                }
            }

            if (musaSol == null && tablero != null && tablero.getGrid() != null && !tablero.getGrid().isEmpty()) {
                int solIdx = mapAstroToGrid(tablero.getSolPos());
                if (solIdx >= 0 && solIdx < tablero.getGrid().size()) {
                    musaSol = tablero.getGrid().get(solIdx);
                }
            }

            if (musaLuna == null && tablero != null && tablero.getGrid() != null && !tablero.getGrid().isEmpty()) {
                int lunaIdx = mapAstroToGrid(tablero.getLunaPos());
                if (lunaIdx >= 0 && lunaIdx < tablero.getGrid().size()) {
                    musaLuna = tablero.getGrid().get(lunaIdx);
                }
            }

            int valorSolN1 = (musaSol != null && musaSol.getNombre() != null) ? musaSol.getNombre().getPuntos(1) : 0;
            int valorLunaN1 = (musaLuna != null && musaLuna.getNombre() != null) ? musaLuna.getNombre().getPuntos(1) : 0;

            // Simulación marginal de puntos con PuntuacionService si está disponible
            double deltaPuntosSol = calcularDeltaPuntos(partida, bot, musaSol, 2);
            double deltaPuntosLuna = calcularDeltaPuntos(partida, bot, musaLuna, 2);

            Musa musaCentro = (tablero != null && tablero.getGrid() != null && tablero.getGrid().size() > 4)
                    ? tablero.getGrid().get(4) : null;
            int valorCentroN1 = (musaCentro != null && musaCentro.getNombre() != null) ? musaCentro.getNombre().getPuntos(1) : 0;
            double deltaPuntosCentro = calcularDeltaPuntos(partida, bot, musaCentro, 1);

            switch (tipo) {
                case DEVOCION_SOL:
                    return 20.0 + valorSolN1 + (10.0 * deltaPuntosSol);
                case DEVOCION_LUNA:
                    return 20.0 + valorLunaN1 + (10.0 * deltaPuntosLuna);
                case REVOLUCION_SOL:
                    return 5.0 + valorCentroN1 + (10.0 * deltaPuntosCentro) + 1.0;
                case REVOLUCION_LUNA:
                    return 5.0 + valorCentroN1 + (10.0 * deltaPuntosCentro);
            }
        }

        return 0.0;
    }

    private double calcularDeltaPuntos(Partida partida, Jugador bot, Musa musa, int tokensExtra) {
        if (puntuacionService == null || partida == null || bot == null || musa == null) {
            return 0.0;
        }
        if (partida.getJugadores() == null || partida.getJugadores().isEmpty()) {
            return 0.0;
        }
        try {
            Map<Jugador, Integer> ptsAntes = puntuacionService.calcularPuntosMusa(musa, partida.getJugadores());
            if (ptsAntes == null) {
                return 0.0;
            }
            int pAnt = ptsAntes.getOrDefault(bot, 0);

            Musa musaSim = new Musa();
            musaSim.setNombre(musa.getNombre());
            List<Token> tokens = new ArrayList<>();
            if (musa.getTokensColocados() != null) {
                tokens.addAll(musa.getTokensColocados());
            }
            for (int i = 0; i < tokensExtra; i++) {
                Token t = new Token();
                t.setColocado(true);
                t.setJugador(bot);
                tokens.add(t);
            }
            musaSim.setTokensColocados(tokens);

            Map<Jugador, Integer> ptsDesp = puntuacionService.calcularPuntosMusa(musaSim, partida.getJugadores());
            if (ptsDesp == null) {
                return 0.0;
            }
            int pDes = ptsDesp.getOrDefault(bot, 0);
            return Math.max(0, pDes - pAnt);
        } catch (Exception ignored) {
            return 0.0;
        }
    }

    public List<CartaBase> obtenerCartasCandidatas(Partida partida, Jugador bot) {
        List<CartaBase> candidatas = new ArrayList<>();
        List<CartaBase> disponibles = null;

        if (cartaService != null) {
            try {
                disponibles = cartaService.getAll();
            } catch (Exception ignored) {}
        }
        if (disponibles == null || disponibles.isEmpty()) {
            if (cartaRepository != null) {
                try {
                    disponibles = cartaRepository.findAll();
                } catch (Exception ignored) {}
            }
        }

        Map<TipoAccion, CartaAccion> accionesPorTipo = new LinkedHashMap<>();
        if (disponibles != null && !disponibles.isEmpty()) {
            for (CartaBase c : disponibles) {
                if (c instanceof CartaAccion ca && ca.getTipo() != null) {
                    accionesPorTipo.putIfAbsent(ca.getTipo(), ca);
                }
            }
        } else {
            // Si la base de datos o servicio no tiene cartas cargadas, consultar o persistir mediante CartaService / Repository
            for (TipoAccion tipo : TipoAccion.values()) {
                CartaAccion ca = null;
                if (cartaService != null) {
                    try {
                        ca = cartaService.obtenerOCrearCartaAccion(tipo);
                    } catch (Exception ignored) {}
                }
                if (ca == null && cartaRepository != null) {
                    try {
                        ca = cartaRepository.findCartaAccionByTipo(tipo).orElse(null);
                        if (ca == null) {
                            CartaAccion nueva = new CartaAccion();
                            nueva.setTipo(tipo);
                            nueva.setNombre(tipo.name());
                            nueva.setDescripcion("Carta de acción: " + tipo.name());
                            ca = cartaRepository.save(nueva);
                        }
                    } catch (Exception ignored) {}
                }
                if (ca != null) {
                    accionesPorTipo.put(tipo, ca);
                } else {
                    // Fallback puramente en memoria para tests unitarios aislados
                    CartaAccion caMem = new CartaAccion();
                    caMem.setTipo(tipo);
                    caMem.setNombre(tipo.name());
                    caMem.setDescripcion("Carta de acción: " + tipo.name());
                    accionesPorTipo.put(tipo, caMem);
                }
            }
        }

        candidatas.addAll(accionesPorTipo.values());

        if (bot != null) {
            CartaInspiracion insp = bot.getCartaInspiracion();
            if (esInspiracionValida(partida, insp)) {
                candidatas.add(insp);
            }
        }

        return candidatas;
    }

    public boolean esInspiracionValida(Partida partida, CartaInspiracion carta) {
        if (carta == null || carta.isUsada() || carta.getNombreMusa() == null) {
            return false;
        }
        if (partida == null || partida.getTablero() == null) {
            return false;
        }
        int sol = partida.getTablero().getSolPos();
        TipoInspiracion requerido = (sol % 2 == 0) ? TipoInspiracion.VERTICES : TipoInspiracion.LADOS;
        return carta.getNombreMusa().getTipoInspiracion() == requerido;
    }

    private int contarTokensLibres(Jugador bot) {
        if (bot == null || bot.getTokens() == null) {
            return 0;
        }
        int count = 0;
        for (Token t : bot.getTokens()) {
            if (t != null && !t.isColocado()) {
                count++;
            }
        }
        return count;
    }

    private int obtenerPrioridad(CartaBase carta) {
        if (carta instanceof CartaInspiracion) {
            return 1;
        }
        if (carta instanceof CartaAccion ca && ca.getTipo() != null) {
            return ca.getTipo().getPrioridad();
        }
        return Integer.MAX_VALUE;
    }

    private double calcularUrgenciaInspiracion(int rondaActual, TipoInspiracion tipo) {
        if (tipo == TipoInspiracion.LADOS) {
            if (rondaActual >= 8) return 20.0;
            if (rondaActual == 6) return 10.0;
            if (rondaActual == 4) return 5.0;
            return 2.0;
        } else {
            if (rondaActual >= 9) return 20.0;
            if (rondaActual == 7) return 10.0;
            if (rondaActual == 5) return 5.0;
            return 2.0;
        }
    }

    private int mapAstroToGrid(int astroPos) {
        return switch (astroPos) {
            case 0 -> 0;
            case 1 -> 1;
            case 2 -> 2;
            case 3 -> 5;
            case 4 -> 8;
            case 5 -> 7;
            case 6 -> 6;
            case 7 -> 3;
            default -> 0;
        };
    }
}
