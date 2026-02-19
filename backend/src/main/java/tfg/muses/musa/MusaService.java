package tfg.muses.musa;

import java.util.ArrayList;
import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import tfg.muses.jugador.Jugador;
import tfg.muses.partida.PartidaService;
import tfg.muses.token.Token;
import tfg.muses.token.TokenService;

@Service
public class MusaService {

    @Autowired
    private MusaRepository musaRepository;

    @Autowired
    private PartidaService partidaService;

    @Autowired
    private TokenService tokenService;

    /**
     * Crear una nueva musa
     */
    public Musa create(Musa musa) {
        return musaRepository.save(musa);
    }

    /**
     * Obtener una musa por su ID
     */
    public Musa getById(Long id) {
        return musaRepository.findById(id).orElse(null);
    }

    /**
     * Obtener todas las musas
     */
    public List<Musa> getAll() {
        return musaRepository.findAll();
    }

    /**
     * Obtener todas las musas de una partida
     */
    public List<Musa> getAllByPartida(Long partidaId) {
        return partidaService.getMusasByPartida(partidaId);
    }

    /**
     * Actualizar una musa existente
     */
    public Musa update(Long id, Musa musaActualizada) {
        return musaRepository.findById(id).map(musa -> {
            musa.setNombre(musaActualizada.getNombre());
            musa.setTokensColocados(musaActualizada.getTokensColocados());
            return musaRepository.save(musa);
        }).orElse(null);
    }

    /**
     * Eliminar una musa por su ID
     */
    public void delete(Long id) {
        musaRepository.deleteById(id);
    }

    /**
     * Eliminar todas las musas de una partida
     */
    public void deleteAllByPartida(Long partidaId) {
        List<Musa> musas = partidaService.getMusasByPartida(partidaId);
        musaRepository.deleteAll(musas);
    }

    /**
     * Colocar tokens en una musa
     */
    public void colocarTokens(Musa musa, int numeroTokens, Jugador jugador) {
        List<Token> tokensColocados = tokenService.colocarTokensByPlayer(numeroTokens, jugador);
        List<Token> tokensEnMusa = musa.getTokensColocados();
        tokensEnMusa.addAll(tokensColocados);
        musa.setTokensColocados(tokensEnMusa);
        musaRepository.save(musa);
    }
}
