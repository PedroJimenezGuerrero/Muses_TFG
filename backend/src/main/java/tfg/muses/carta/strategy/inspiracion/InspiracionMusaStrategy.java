package tfg.muses.carta.strategy.inspiracion;

import tfg.muses.tablero.Tablero;
import tfg.muses.carta.CartaInspiracion;
import tfg.muses.jugador.Jugador;

public interface InspiracionMusaStrategy {
    boolean supports(CartaInspiracion carta);

    /**
     * Ejecutar la acción de la carta de inspiración. 
     * Cada inspiración de musa coloca una cantidad de tokens en una posición del tablero.
     * Esta posición varía según dónde se encuentran los astros y el tipo de inspiración.
     * @param carta Carta de inspiración
     * @param tablero Tablero
     * @param jugador Jugador
     */
    void execute(CartaInspiracion carta, Tablero tablero, Jugador jugador);
}
