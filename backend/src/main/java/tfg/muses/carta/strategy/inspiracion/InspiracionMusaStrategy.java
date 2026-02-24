package tfg.muses.carta.strategy.inspiracion;

import tfg.muses.tablero.Tablero;
import tfg.muses.carta.CartaInspiracion;
import tfg.muses.jugador.Jugador;

public interface InspiracionMusaStrategy {
    boolean supports(CartaInspiracion carta);

    void execute(CartaInspiracion carta, Tablero tablero, Jugador jugador);
}
