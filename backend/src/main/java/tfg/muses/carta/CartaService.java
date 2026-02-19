package tfg.muses.carta;

import java.util.List;
import tfg.muses.carta.strategy.CartaEffectStrategy;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import tfg.muses.partida.PartidaService;
import tfg.muses.tablero.Tablero;

@Service
public class CartaService {

    @Autowired
    private CartaRepository cartaRepository;

    @Autowired
    private PartidaService partidaService;

    /**
     * Crear una nueva carta
     */
    public CartaBase create(CartaBase carta) {
        return cartaRepository.save(carta);
    }

    /**
     * Obtener una carta por su ID
     */
    public CartaBase getById(Long id) {
        return cartaRepository.findById(id).orElse(null);
    }

    /**
     * Obtener todas las cartas
     */
    public List<CartaBase> getAll() {
        return cartaRepository.findAll();
    }

    /**
     * Obtener todas las cartas de una partida
     */
    public List<CartaBase> getAllByPartida(Long partidaId) {
        return partidaService.getCartasByPartida(partidaId);
    }

    /**
     * Eliminar una carta por su ID
     */
    public void delete(Long id) {
        cartaRepository.deleteById(id);
    }

    /**
     * Eliminar todas las cartas de una partida
     */
    public void deleteAllByPartida(Long partidaId) {
        List<CartaBase> cartas = partidaService.getCartasByPartida(partidaId);
        cartaRepository.deleteAll(cartas);
    }

    @Autowired
    private List<CartaEffectStrategy> strategies;

    public void ejecutarEfecto(CartaBase carta, Tablero tablero) {
        for (CartaEffectStrategy strategy : strategies) {
            if (strategy.supports(carta)) {
                strategy.execute(carta, tablero);
                return;
            }
        }
        throw new IllegalArgumentException("No strategy found for carta type: " + carta.getClass().getSimpleName());
    }
}
