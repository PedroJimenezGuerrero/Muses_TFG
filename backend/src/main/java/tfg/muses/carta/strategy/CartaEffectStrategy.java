package tfg.muses.carta.strategy;

import tfg.muses.carta.CartaBase;
import tfg.muses.tablero.Tablero;
import tfg.muses.jugador.Jugador;

public interface CartaEffectStrategy {
    boolean supports(CartaBase carta);

    void execute(CartaBase carta, Tablero tablero, Jugador jugador);
}
