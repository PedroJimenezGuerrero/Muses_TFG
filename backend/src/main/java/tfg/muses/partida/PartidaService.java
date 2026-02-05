package tfg.muses.partida;

import java.util.ArrayList;
import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import tfg.muses.carta.CartaBase;
import tfg.muses.jugador.Jugador;
import tfg.muses.musa.Musa;
import tfg.muses.tablero.Tablero;
import tfg.muses.token.Token;

@Service
public class PartidaService {

    @Autowired
    private PartidaRepository partidaRepository;

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
     * Obtener todos los tokens de una partida (de los jugadores y del tablero)
     */
    public List<Token> getTokensByPartida(Long partidaId) {
        List<Token> tokens = new ArrayList<>();
        
        // Tokens de los jugadores (reserva)
        List<Jugador> jugadores = getJugadoresByPartida(partidaId);
        for (Jugador jugador : jugadores) {
            if (jugador.getReservaTokens() != null) {
                tokens.addAll(jugador.getReservaTokens());
            }
        }
        
        // Tokens del tablero (colocados en las musas)
        Tablero tablero = getTableroByPartida(partidaId);
        if (tablero != null && tablero.getGrid() != null) {
            for (Musa musa : tablero.getGrid()) {
                if (musa.getTokensColocados() != null) {
                    tokens.addAll(musa.getTokensColocados());
                }
            }
        }
        
        return tokens;
    }

    /**
     * Obtener todas las musas de una partida (del tablero)
     */
    public List<Musa> getMusasByPartida(Long partidaId) {
        Tablero tablero = getTableroByPartida(partidaId);
        return tablero != null && tablero.getGrid() != null ? tablero.getGrid() : new ArrayList<>();
    }
}
