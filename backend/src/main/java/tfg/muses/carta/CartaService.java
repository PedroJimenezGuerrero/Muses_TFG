package tfg.muses.carta;

import java.util.List;
import tfg.muses.carta.strategy.CartaEffectStrategy;
import tfg.muses.jugador.Jugador;

import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import tfg.muses.partida.PartidaService;
import tfg.muses.tablero.Tablero;

@Service
public class CartaService {

    @Autowired
    private CartaRepository cartaRepository;

    @Autowired
    @org.springframework.context.annotation.Lazy
    private PartidaService partidaService;

    @PostConstruct
    public void inicializarCartasAccion() {
        for (TipoAccion tipo : TipoAccion.values()) {
            if (cartaRepository.findCartaAccionByTipo(tipo).isEmpty()) {
                CartaAccion ca = new CartaAccion();
                ca.setTipo(tipo);
                ca.setNombre(tipo.name());
                ca.setDescripcion("Carta de acción: " + tipo.name());
                cartaRepository.save(ca);
            }
        }
    }

    public CartaAccion obtenerOCrearCartaAccion(TipoAccion tipo) {
        return cartaRepository.findCartaAccionByTipo(tipo).orElseGet(() -> {
            CartaAccion ca = new CartaAccion();
            ca.setTipo(tipo);
            ca.setNombre(tipo.name());
            ca.setDescripcion("Carta de acción: " + tipo.name());
            return cartaRepository.save(ca);
        });
    }

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

    public void ejecutarEfecto(CartaBase carta, Tablero tablero, Jugador jugador) {
        for (CartaEffectStrategy strategy : strategies) {
            if (strategy.supports(carta)) {
                strategy.execute(carta, tablero, jugador);
                return;
            }
        }
        throw new IllegalArgumentException("No strategy found for carta type: " + carta.getClass().getSimpleName());
    }
}
