package tfg.muses.token;

import java.util.ArrayList;
import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import tfg.muses.jugador.Jugador;
import tfg.muses.jugador.JugadorService;
import tfg.muses.partida.PartidaService;

@Service
public class TokenService {

    @Autowired
    private TokenRepository tokenRepository;

    @Autowired
    private PartidaService partidaService;

    @Autowired
    private JugadorService jugadorService;

    /**
     * Crear un nuevo token
     */
    public Token create(Token token) {
        return tokenRepository.save(token);
    }

    /**
     * Obtener un token por su ID
     */
    public Token getById(Long id) {
        return tokenRepository.findById(id).orElse(null);
    }

    /**
     * Obtener todos los tokens
     */
    public List<Token> getAll() {
        return tokenRepository.findAll();
    }

    /**
     * Obtener todos los tokens de una partida
     */
    public List<Token> getAllByPartida(Long partidaId) {
        return partidaService.getTokensByPartida(partidaId);
    }

    /**
     * Actualizar un token existente
     */
    public Token update(Long id, Token tokenActualizado) {
        return tokenRepository.findById(id).map(token -> {
            // El token es simple, podría no tener propiedades para actualizar
            // pero mantenemos la estructura CRUD completa
            return tokenRepository.save(token);
        }).orElse(null);
    }

    /**
     * Eliminar un token por su ID
     */
    public void delete(Long id) {
        tokenRepository.deleteById(id);
    }

    /**
     * Eliminar todos los tokens de una partida
     */
    public void deleteAllByPartida(Long partidaId) {
        List<Token> tokens = partidaService.getTokensByPartida(partidaId);
        tokenRepository.deleteAll(tokens);
    }

    public List<Token> colocarTokensByPlayer(int numeroTokens, Jugador jugador){
        List<Token> tokens = new ArrayList<>();
        for (int i = 0; i < numeroTokens; i++) {
            Token token = jugadorService.getTokenNoColocado(jugador);
            if (token != null) {
                colocar(token);
                tokens.add(token);
            } else {
                break;
            }
        }
        return tokens;
    }

    private void colocar(Token token) {
        token.setColocado(true);
        tokenRepository.save(token);
    }
}
