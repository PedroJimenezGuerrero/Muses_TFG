package tfg.muses.carta.strategy;

import tfg.muses.carta.CartaBase;
import tfg.muses.tablero.Tablero;

public interface CartaEffectStrategy {
    boolean supports(CartaBase carta);

    void execute(CartaBase carta, Tablero tablero);
}
