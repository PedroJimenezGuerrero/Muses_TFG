package tfg.muses.partida;

import java.util.ArrayList;
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
import tfg.muses.tablero.Tablero;
import tfg.muses.token.Token;

@Service
public class PartidaService {

    @Autowired
    private PartidaRepository partidaRepository;

    @Autowired
    private CartaService cartaService;

    @Autowired
    private JugadorService jugadorService;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

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
        partida.setGanador(partidaActualizada.getGanador());
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
