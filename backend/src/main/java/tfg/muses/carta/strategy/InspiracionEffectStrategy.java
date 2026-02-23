package tfg.muses.carta.strategy;

import org.springframework.stereotype.Component;

import tfg.muses.carta.CartaBase;
import tfg.muses.carta.CartaInspiracion;
import tfg.muses.tablero.Tablero;
import tfg.muses.jugador.Jugador;

import org.springframework.beans.factory.annotation.Autowired;

@Component
public class InspiracionEffectStrategy implements CartaEffectStrategy {

    @Autowired
    private tfg.muses.tablero.TableroService tableroService;

    @Override
    public boolean supports(CartaBase carta) {
        return carta instanceof CartaInspiracion;
    }

    @Override
    public void execute(CartaBase carta, Tablero tablero, Jugador jugador) {
        CartaInspiracion cartaInspiracion = (CartaInspiracion) carta;

        if (cartaInspiracion.isUsada()) {
            throw new IllegalStateException("Esta carta de inspiración ya ha sido usada");
        }

        tableroService.inspiracion(tablero, cartaInspiracion.getMusaObjetivo(), jugador);

        // Marcar como usada
        cartaInspiracion.setUsada(true);
    }
}
