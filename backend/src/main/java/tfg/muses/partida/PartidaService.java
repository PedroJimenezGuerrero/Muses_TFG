package tfg.muses.partida;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import tfg.muses.exception.ResourceNotFoundException;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.OptimisticLockingFailureException;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.resilience.annotation.Retryable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import tfg.muses.carta.CartaAccion;
import tfg.muses.carta.CartaBase;
import tfg.muses.carta.CartaInspiracion;
import tfg.muses.carta.CartaService;
import tfg.muses.carta.TipoAccion;
import tfg.muses.jugador.Jugador;
import tfg.muses.jugador.JugadorService;
import tfg.muses.musa.Musa;
import tfg.muses.musa.MusaService;
import tfg.muses.musa.TipoMusa;
import tfg.muses.puntuacion.PuntuacionService;
import tfg.muses.tablero.Tablero;
import tfg.muses.tablero.TableroService;
import tfg.muses.token.Token;

@Service
public class PartidaService {

    @Autowired
    private PartidaRepository partidaRepository;

    @Autowired
    @org.springframework.context.annotation.Lazy
    private CartaService cartaService;

    @Autowired
    @org.springframework.context.annotation.Lazy
    private JugadorService jugadorService;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @Autowired
    @org.springframework.context.annotation.Lazy
    private TableroService tableroService;

    @Autowired
    @org.springframework.context.annotation.Lazy
    private MusaService musaService;

    @Autowired
    @org.springframework.context.annotation.Lazy
    private PuntuacionService puntuacionService;

    @Autowired
    @org.springframework.context.annotation.Lazy
    private tfg.muses.bot.BotService botService;

    @Autowired(required = false)
    @org.springframework.context.annotation.Lazy
    private tfg.muses.sala.SalaRepository salaRepository;

    /**
     * Crear una nueva partida
     */
    public Partida create(Partida partida) {
        return partidaRepository.save(partida);
    }

    public Partida getById(Long id) {
        return partidaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Partida", id));
    }

    /**
     * Obtener todas las partidas
     */
    public List<Partida> getAll() {
        return partidaRepository.findAll();
    }

    public Partida update(Long id, Partida partidaActualizada) {
        Partida partida = getById(id);
        partida.setRondaActual(partidaActualizada.getRondaActual());
        partida.setMaxRondas(partidaActualizada.getMaxRondas());
        partida.setDuracionTotal(partidaActualizada.getDuracionTotal());
        partida.setFechaInicio(partidaActualizada.getFechaInicio());
        partida.setFechaFin(partidaActualizada.getFechaFin());
        partida.setTablero(partidaActualizada.getTablero());
        partida.setJugadores(partidaActualizada.getJugadores());
        partida.setGanadores(partidaActualizada.getGanadores());
        return partidaRepository.save(partida);
    }

    /**
     * Eliminar una partida por su ID
     */
    public void delete(Long id) {
        partidaRepository.deleteById(id);
    }

    /**
     * Eliminar todas las partidas
     */
    public void deleteAll() {
        partidaRepository.deleteAll();
    }

    public Tablero getTableroByPartida(Long partidaId) {
        return getById(partidaId).getTablero();
    }

    public List<Jugador> getJugadoresByPartida(Long partidaId) {
        return getById(partidaId).getJugadores();
    }

    /**
     * Obtener todas las cartas de inspiración de una partida
     */
    public List<CartaBase> getCartasByPartida(Long partidaId) {
        List<CartaBase> cartas = new ArrayList<>();
        List<Jugador> jugadores = getJugadoresByPartida(partidaId);
        for (Jugador jugador : jugadores) {
            if (jugador.getCartaInspiracion() != null) {
                cartas.add(jugador.getCartaInspiracion());
            }
        }
        return cartas;
    }

    /**
     * Obtener todos los tokens de una partida
     */
    public List<Token> getTokensByPartida(Long partidaId) {
        List<Token> tokens = new ArrayList<>();

        // Tokens de los jugadores (reserva)
        List<Jugador> jugadores = getJugadoresByPartida(partidaId);
        for (Jugador jugador : jugadores) {
            tokens.addAll(jugador.getTokens());
        }
        return tokens;
    }

    /**
     * Obtener todas las musas de una partida
     */
    public List<Musa> getMusasByPartida(Long partidaId) {
        Tablero tablero = getTableroByPartida(partidaId);
        return tablero != null && tablero.getGrid() != null ? tablero.getGrid() : new ArrayList<>();
    }

    public Partida getByJugadorId(Long jugadorId) {
        return partidaRepository.findByJugadoresId(jugadorId)
                .orElseThrow(() -> new ResourceNotFoundException("Partida del jugador", jugadorId));
    }

    @Retryable(value = OptimisticLockingFailureException.class, maxRetries = 5)
    public void seleccionarCarta(Long partidaId, Long jugadorId, Long cartaId) {
        Partida partida = getById(partidaId);
        Jugador jugador = jugadorService.getById(jugadorId);

        CartaBase carta = cartaService.getById(cartaId);
        if (carta == null) {
            if (cartaId == 101L || cartaId == 1L) {
                carta = cartaService.obtenerOCrearCartaAccion(TipoAccion.DEVOCION_SOL);
            } else if (cartaId == 102L || cartaId == 2L) {
                carta = cartaService.obtenerOCrearCartaAccion(TipoAccion.DEVOCION_LUNA);
            } else if (cartaId == 103L || cartaId == 3L) {
                carta = cartaService.obtenerOCrearCartaAccion(TipoAccion.REVOLUCION_SOL);
            } else if (cartaId == 104L || cartaId == 4L) {
                carta = cartaService.obtenerOCrearCartaAccion(TipoAccion.REVOLUCION_LUNA);
            } else if (jugador != null && jugador.getCartaInspiracion() != null) {
                carta = jugador.getCartaInspiracion();
            }
            if (carta != null && carta.getId() != null) {
                cartaId = carta.getId();
            }
        }

        partida.getSeleccionesRonda().put(jugadorId, cartaId);

        if (messagingTemplate != null) {
            Map<String, Object> seleccionEvento = new HashMap<>();
            seleccionEvento.put("type", "SELECCION_CARTA");
            Map<String, Object> payload = new HashMap<>();
            payload.put("jugadorId", jugadorId);
            payload.put("jugadorNombre", jugador != null ? jugador.getNombre() : "Jugador " + jugadorId);
            payload.put("jugadorNumero", jugador != null ? jugador.getNumeroJugador() : 1);
            payload.put("cartaNombre", carta != null ? carta.getNombre() : "Carta " + cartaId);
            payload.put("cartaId", cartaId);
            if (carta instanceof CartaAccion ca && ca.getTipo() != null) {
                payload.put("tipoAccion", ca.getTipo().name());
                payload.put("prioridad", ca.getTipo().getPrioridad());
            } else if (carta instanceof CartaInspiracion ci) {
                payload.put("tipoAccion", "INSPIRACION");
                payload.put("prioridad", 1);
                payload.put("musaName", ci.getNombreMusa() != null ? ci.getNombreMusa().name() : null);
            }
            seleccionEvento.put("payload", payload);

            messagingTemplate.convertAndSend("/topic/partida/" + partidaId + "/seleccion", (Object) seleccionEvento);
            if (salaRepository != null) {
                salaRepository.findByPartidaId(partidaId).ifPresent(sala -> {
                    if (sala.getCodigo() != null) {
                        messagingTemplate.convertAndSend("/topic/sala/" + sala.getCodigo() + "/accion", (Object) seleccionEvento);
                    }
                });
            }
        }

        gestionarSeleccionCartas(partida, jugador);
    }

    // Métodos privados

    @Transactional
    private void gestionarSeleccionCartas(Partida partida, Jugador jugador) {
        update(partida.getId(), partida);
        ejecutarTurnosBotsSiAplica(partida);
        if (!todosJugadoresHanSeleccionadoCarta(partida)) {
            return;
        }

        Map<Long, Long> selecciones = partida.getSeleccionesRonda();
        Map<Long, List<Jugador>> jugadoresPorCarta = new HashMap<>();
        for (Map.Entry<Long, Long> entry : selecciones.entrySet()) {
            Long jId = entry.getKey();
            Long cId = entry.getValue();
            Jugador j = jugadorService.getById(jId);
            if (j != null) {
                jugadoresPorCarta.computeIfAbsent(cId, k -> new ArrayList<>()).add(j);
            }
        }

        List<CartaBase> cartasOrdenadasPorVotos = obtenerCartasOrdenadas(selecciones);

        List<Map<String, Object>> listaAcciones = new ArrayList<>();
        for (CartaBase cartaBase : cartasOrdenadasPorVotos) {
            List<Jugador> votantes = jugadoresPorCarta.getOrDefault(cartaBase.getId(), Collections.emptyList());
            for (Jugador j : votantes) {
                Map<String, Object> accionInfo = new HashMap<>();
                accionInfo.put("jugadorId", j.getId());
                accionInfo.put("jugadorNombre", j.getNombre() != null ? j.getNombre() : "Jugador " + j.getId());
                accionInfo.put("jugadorNumero", j.getNumeroJugador());
                accionInfo.put("cartaNombre", cartaBase.getNombre());
                accionInfo.put("cartaId", cartaBase.getId());
                if (cartaBase instanceof CartaAccion ca && ca.getTipo() != null) {
                    accionInfo.put("tipoAccion", ca.getTipo().name());
                    accionInfo.put("prioridad", ca.getTipo().getPrioridad());
                } else if (cartaBase instanceof CartaInspiracion ci) {
                    accionInfo.put("tipoAccion", "INSPIRACION");
                    accionInfo.put("prioridad", 1);
                    accionInfo.put("musaName", ci.getNombreMusa() != null ? ci.getNombreMusa().name() : null);
                }
                listaAcciones.add(accionInfo);
            }
        }

        Map<String, Object> resolucionEvento = new HashMap<>();
        resolucionEvento.put("type", "CARTAS_SELECCIONADAS");
        resolucionEvento.put("ronda", partida.getRondaActual());
        resolucionEvento.put("acciones", listaAcciones);
        resolucionEvento.put("cartas", cartasOrdenadasPorVotos);

        // Avisa mediante websocket al frontend de que ya se han seleccionado todas las cartas
        if (messagingTemplate != null) {
            messagingTemplate.convertAndSend("/topic/partida/" + partida.getId() + "/cartas-seleccionadas",
                    cartasOrdenadasPorVotos);
            if (salaRepository != null) {
                salaRepository.findByPartidaId(partida.getId()).ifPresent(sala -> {
                    if (sala.getCodigo() != null) {
                        messagingTemplate.convertAndSend("/topic/sala/" + sala.getCodigo() + "/accion", (Object) resolucionEvento);
                    }
                });
            }
        }

        for (CartaBase cartaBase : cartasOrdenadasPorVotos) {
            List<Jugador> votantes = jugadoresPorCarta.getOrDefault(cartaBase.getId(), Collections.emptyList());
            for (Jugador j : votantes) {
                cartaService.ejecutarEfecto(cartaBase, partida.getTablero(), j);
            }
        }
        tableroService.save(partida.getTablero());

        finalizarRonda(partida);
    }

    /**
     * F09-F12: Iniciar una partida.
     * Inicializa el tablero con 9 musas aleatorias y astros (sol=0, luna=4),
     * establece la ronda 1, asigna fecha de inicio y reparte a cada jugador
     * una carta de inspiración única (usada=false) y 20 tokens de devoción.
     */
    @Transactional
    public Tablero iniciarPartida(Long id) {
        Partida partida = getById(id);

        Tablero tablero = tableroService.inicializarTablero();
        partida.setTablero(tablero);
        partida.setRondaActual(1);
        partida.setFechaInicio(LocalDateTime.now());

        if (partida.getJugadores() != null) {
            List<TipoMusa> musasDisponibles = new ArrayList<>(List.of(TipoMusa.values()));
            Collections.shuffle(musasDisponibles);

            int index = 0;
            for (Jugador j : partida.getJugadores()) {
                if (index < musasDisponibles.size()) {
                    TipoMusa tipoMusa = musasDisponibles.get(index++);
                    CartaInspiracion carta = new CartaInspiracion();
                    carta.setNombre("Inspiración de " + tipoMusa.name());
                    carta.setDescripcion("Efecto de inspiración de la musa " + tipoMusa.name());
                    carta.setNombreMusa(tipoMusa);
                    carta.setUsada(false);
                    j.setCartaInspiracion(carta);
                }

                if (j.getTokens() == null || j.getTokens().isEmpty()) {
                    List<Token> tokens = new ArrayList<>();
                    for (int i = 0; i < 20; i++) {
                        Token token = new Token();
                        token.setColocado(false);
                        token.setJugador(j);
                        tokens.add(token);
                    }
                    j.setTokens(tokens);
                }
            }
        }

        partidaRepository.save(partida);
        if (messagingTemplate != null) {
            messagingTemplate.convertAndSend("/topic/partida/" + partida.getId() + "/estado", partida);
            if (salaRepository != null) {
                salaRepository.findByPartidaId(partida.getId()).ifPresent(sala -> {
                    if (sala.getCodigo() != null) {
                        Map<String, Object> syncEvt = new HashMap<>();
                        syncEvt.put("type", "ROUND_STATE_SYNC");
                        syncEvt.put("partida", partida);
                        syncEvt.put("tablero", partida.getTablero());
                        syncEvt.put("isGameOver", false);
                        messagingTemplate.convertAndSend("/topic/sala/" + sala.getCodigo() + "/accion", (Object) syncEvt);
                    }
                });
            }
        }
        ejecutarTurnosBotsSiAplica(partida);
        return tablero;
    }

    /**
     * F13 & F14: Finalizar la ronda actual.
     * Limpia selecciones de ronda e incrementa rondaActual.
     * Si rondaActual alcanza maxRondas, invoca finalizarPartida.
     */
    public void finalizarRonda(Partida partida) {
        if (partida == null) {
            return;
        }

        partida.getSeleccionesRonda().clear();

        if (partida.getRondaActual() >= partida.getMaxRondas()) {
            finalizarPartida(partida);
        } else {
            partida.setRondaActual(partida.getRondaActual() + 1);
            if (partida.getTablero() != null) {
                tableroService.rotarAstros(partida.getTablero());
            }
            partidaRepository.save(partida);
            if (messagingTemplate != null) {
                messagingTemplate.convertAndSend("/topic/partida/" + partida.getId() + "/estado", partida);
                if (salaRepository != null) {
                    salaRepository.findByPartidaId(partida.getId()).ifPresent(sala -> {
                        if (sala.getCodigo() != null) {
                            Map<String, Object> syncEvt = new HashMap<>();
                            syncEvt.put("type", "ROUND_STATE_SYNC");
                            syncEvt.put("partida", partida);
                            syncEvt.put("tablero", partida.getTablero());
                            syncEvt.put("isGameOver", false);
                            messagingTemplate.convertAndSend("/topic/sala/" + sala.getCodigo() + "/accion", (Object) syncEvt);
                        }
                    });
                }
            }
            ejecutarTurnosBotsSiAplica(partida);
        }
    }

    /**
     * Ejecuta automáticamente el turno de todos los bots y jugadores desconectados
     * que tengan pendiente seleccionar carta en la ronda actual.
     */
    public void ejecutarTurnosBotsSiAplica(Partida partida) {
        if (partida == null || partida.getJugadores() == null || botService == null) {
            return;
        }
        // Copia defensiva de la lista de jugadores para evitar ConcurrentModificationException
        List<Jugador> jugadoresCopia = new ArrayList<>(partida.getJugadores());
        for (Jugador j : jugadoresCopia) {
            if (j != null && (j.isBot() || !j.isConectado())) {
                Partida actual = (partida.getId() != null) ? getById(partida.getId()) : partida;
                if (actual.getSeleccionesRonda() == null || !actual.getSeleccionesRonda().containsKey(j.getId())) {
                    try {
                        botService.ejecutarTurnoBot(actual, j);
                    } catch (Exception e) {
                        org.slf4j.LoggerFactory.getLogger(PartidaService.class)
                                .error("Error al ejecutar turno de bot id={}: {}", j.getId(), e.getMessage());
                    }
                }
            }
        }
    }

    /**
     * F14 & F15-F19: Finalizar partida.
     * Establece fechaFin, calcula duracionTotal y delega en PuntuacionService.
     */
    public void finalizarPartida(Partida partida) {
        if (partida == null) {
            return;
        }

        LocalDateTime fin = LocalDateTime.now();
        partida.setFechaFin(fin);
        if (partida.getFechaInicio() != null) {
            long minutos = Duration.between(partida.getFechaInicio(), fin).toMinutes();
            partida.setDuracionTotal((int) minutos);
        }

        puntuacionService.procesarFinPartida(partida);
        partidaRepository.save(partida);
        if (messagingTemplate != null) {
            messagingTemplate.convertAndSend("/topic/partida/" + partida.getId() + "/fin", partida);
            if (salaRepository != null) {
                salaRepository.findByPartidaId(partida.getId()).ifPresent(sala -> {
                    if (sala.getCodigo() != null) {
                        Map<String, Object> finEvt = new HashMap<>();
                        finEvt.put("type", "ROUND_STATE_SYNC");
                        finEvt.put("partida", partida);
                        finEvt.put("tablero", partida.getTablero());
                        finEvt.put("isGameOver", true);
                        messagingTemplate.convertAndSend("/topic/sala/" + sala.getCodigo() + "/accion", (Object) finEvt);
                    }
                });
            }
        }
    }

    /**
     * Obtener el desglose de puntos por musa y jugador para el modal de fin de partida.
     */
    public Map<String, Map<String, Map<String, Integer>>> obtenerDesglosePuntos(Long partidaId) {
        Partida partida = getById(partidaId);
        Map<String, Map<String, Map<String, Integer>>> desglose = new LinkedHashMap<>();

        if (partida.getTablero() != null && partida.getTablero().getGrid() != null) {
            List<Jugador> jugadores = partida.getJugadores() != null ? partida.getJugadores() : Collections.emptyList();
            for (Musa musa : partida.getTablero().getGrid()) {
                Map<Jugador, Integer> recuento = puntuacionService.contarTokensPorJugador(musa, jugadores);
                Map<Jugador, Integer> puntos = puntuacionService.calcularPuntosMusa(musa, jugadores);

                Map<String, Map<String, Integer>> musaDesglose = new LinkedHashMap<>();
                for (Jugador j : jugadores) {
                    String nombreJugador = j.getNombre() != null ? j.getNombre()
                            : (j.getUsuario() != null ? j.getUsuario().getUsername() : "Jugador " + j.getId());
                    Map<String, Integer> item = new HashMap<>();
                    item.put("tokens", recuento.getOrDefault(j, 0));
                    item.put("points", puntos.getOrDefault(j, 0));
                    if (nombreJugador != null) {
                        musaDesglose.put(nombreJugador, item);
                    }
                    if (j.getId() != null) {
                        musaDesglose.put(String.valueOf(j.getId()), item);
                    }
                }
                desglose.put(musa.getNombre().name(), musaDesglose);
            }
        }
        return desglose;
    }

    private List<CartaBase> obtenerCartasOrdenadas(Map<Long, Long> selecciones) {
        Map<Long, Long> votosPorCarta = new HashMap<>();
        for (Long cartaId : selecciones.values()) {
            votosPorCarta.merge(cartaId, 1L, Long::sum);
        }

        List<CartaBase> cartasOrdenadasPorVotos = votosPorCarta.entrySet().stream()
                .map(entry -> Map.entry(cartaService.getById(entry.getKey()), entry.getValue()))
                .sorted(Comparator.<Map.Entry<CartaBase, Long>, Long>comparing(Map.Entry::getValue,
                        Comparator.reverseOrder())
                        .thenComparing(entry -> obtenerPrioridad(entry.getKey())))
                .map(Map.Entry::getKey)
                .toList();

        return cartasOrdenadasPorVotos;
    }

    private int obtenerPrioridad(CartaBase carta) {
        if (carta instanceof CartaInspiracion) {
            return 1;
        }
        if (carta instanceof CartaAccion cartaAccion) {
            return cartaAccion.getTipo().getPrioridad();
        }
        return Integer.MAX_VALUE;
    }

    private boolean todosJugadoresHanSeleccionadoCarta(Partida partida) {
        return partida.getSeleccionesRonda().size() == partida.getJugadores().size();
    }
}
