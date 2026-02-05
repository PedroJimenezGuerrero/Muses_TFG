package tfg.muses.jugador;

import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import tfg.muses.partida.PartidaService;

@Service
public class JugadorService {

    @Autowired
    private JugadorRepository jugadorRepository;

    @Autowired
    private PartidaService partidaService;

    /**
     * Crear un nuevo jugador
     */
    public Jugador create(Jugador jugador) {
        return jugadorRepository.save(jugador);
    }

    /**
     * Obtener un jugador por su ID
     */
    public Jugador getById(Long id) {
        return jugadorRepository.findById(id).orElse(null);
    }

    /**
     * Obtener todos los jugadores
     */
    public List<Jugador> getAll() {
        return jugadorRepository.findAll();
    }

    /**
     * Obtener todos los jugadores de una partida
     */
    public List<Jugador> getAllByPartida(Long partidaId) {
        return partidaService.getJugadoresByPartida(partidaId);
    }

    /**
     * Actualizar un jugador existente
     */
    public Jugador update(Long id, Jugador jugadorActualizado) {
        return jugadorRepository.findById(id).map(jugador -> {
            jugador.setNombre(jugadorActualizado.getNombre());
            jugador.setNumeroJugador(jugadorActualizado.getNumeroJugador());
            jugador.setPuntuacionTotal(jugadorActualizado.getPuntuacionTotal());
            jugador.setCartaInspiracion(jugadorActualizado.getCartaInspiracion());
            jugador.setMano(jugadorActualizado.getMano());
            jugador.setReservaTokens(jugadorActualizado.getReservaTokens());
            jugador.setUsuario(jugadorActualizado.getUsuario());
            return jugadorRepository.save(jugador);
        }).orElse(null);
    }

    /**
     * Eliminar un jugador por su ID
     */
    public void delete(Long id) {
        jugadorRepository.deleteById(id);
    }

    /**
     * Eliminar todos los jugadores de una partida
     */
    public void deleteAllByPartida(Long partidaId) {
        List<Jugador> jugadores = partidaService.getJugadoresByPartida(partidaId);
        jugadorRepository.deleteAll(jugadores);
    }
}
