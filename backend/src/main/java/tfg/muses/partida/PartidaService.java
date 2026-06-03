package tfg.muses.partida;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashMap;
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
import tfg.muses.jugador.Jugador;
import tfg.muses.jugador.JugadorService;
import tfg.muses.musa.Musa;
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
    private PuntuacionService puntuacionService;

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

        partida.getSeleccionesRonda().put(jugadorId, cartaId);
        gestionarSeleccionCartas(partida, jugador);
    }

    // Métodos privados

    @Transactional
    private void gestionarSeleccionCartas(Partida partida, Jugador jugador) {
        update(partida.getId(), partida);
        if (!todosJugadoresHanSeleccionadoCarta(partida)) {
            return;
        }

        Map<Long, Long> selecciones = partida.getSeleccionesRonda();
        List<CartaBase> cartasOrdenadasPorVotos = obtenerCartasOrdenadas(selecciones);

        // Avisa mediante websocket al frontend de que ya se han seleccionado todas las
        // cartas
        messagingTemplate.convertAndSend("/topic/partida/" + partida.getId() + "/cartas-seleccionadas",
                cartasOrdenadasPorVotos);

        cartasOrdenadasPorVotos
                .forEach(cartaBase -> cartaService.ejecutarEfecto(cartaBase, partida.getTablero(), jugador));

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
            partidaRepository.save(partida);
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
