package tfg.muses.partida;

import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.OptimisticLockingFailureException;
import org.springframework.resilience.annotation.Retryable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import tfg.muses.carta.CartaBase;
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

    /**
     * Crear una nueva partida
     */
    public Partida create(Partida partida) {
        return partidaRepository.save(partida);
    }

    /**
     * Obtener una partida por su ID
     */
    public Partida getById(Long id) {
        return partidaRepository.findById(id).orElse(null);
    }

    /**
     * Obtener todas las partidas
     */
    public List<Partida> getAll() {
        return partidaRepository.findAll();
    }

    /**
     * Actualizar una partida existente
     */
    public Partida update(Long id, Partida partidaActualizada) {
        return partidaRepository.findById(id).map(partida -> {
            partida.setRondaActual(partidaActualizada.getRondaActual());
            partida.setMaxRondas(partidaActualizada.getMaxRondas());
            partida.setDuracionTotal(partidaActualizada.getDuracionTotal());
            partida.setFechaInicio(partidaActualizada.getFechaInicio());
            partida.setFechaFin(partidaActualizada.getFechaFin());
            partida.setTablero(partidaActualizada.getTablero());
            partida.setJugadores(partidaActualizada.getJugadores());
            partida.setGanador(partidaActualizada.getGanador());
            return partidaRepository.save(partida);
        }).orElse(null);
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

    /**
     * Obtener el tablero de una partida
     */
    public Tablero getTableroByPartida(Long partidaId) {
        Partida partida = getById(partidaId);
        return partida != null ? partida.getTablero() : null;
    }

    /**
     * Obtener los jugadores de una partida
     */
    public List<Jugador> getJugadoresByPartida(Long partidaId) {
        Partida partida = getById(partidaId);
        return partida != null ? partida.getJugadores() : new ArrayList<>();
    }

    /**
     * Obtener todas las cartas de una partida (de la mano de todos los jugadores)
     */
    public List<CartaBase> getCartasByPartida(Long partidaId) {
        List<CartaBase> cartas = new ArrayList<>();
        List<Jugador> jugadores = getJugadoresByPartida(partidaId);
        for (Jugador jugador : jugadores) {
            if (jugador.getMano() != null) {
                cartas.addAll(jugador.getMano());
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

    /**
     * Obtener la partida de un jugador
     */
    public Partida getByJugadorId(Long jugadorId) {
        return partidaRepository.findByJugadoresId(jugadorId).orElse(null);
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
        cartasOrdenadasPorVotos.forEach(cartaBase -> cartaService.ejecutarEfecto(cartaBase, partida.getTablero(), jugador));

        // TODO: notificar al websocket
    }


    private List<CartaBase> obtenerCartasOrdenadas(Map<Long, Long> selecciones) {
        Map<Long, Long> votosPorCarta = new HashMap<>();
        for (Long cartaId : selecciones.values()) {
            votosPorCarta.merge(cartaId, 1L, Long::sum);
        }

        List<CartaBase> cartasOrdenadasPorVotos = votosPorCarta.entrySet().stream()
                .sorted(Map.Entry.comparingByValue(Comparator.reverseOrder()))
                // TODO: añadir desempate por prioridad
                .map(Map.Entry::getKey)
                .map(cartaId -> cartaService.getById(cartaId))
                .toList();

        return cartasOrdenadasPorVotos;
    }

    private boolean todosJugadoresHanSeleccionadoCarta(Partida partida) {
        return partida.getSeleccionesRonda().size() == partida.getJugadores().size();
    }
}
