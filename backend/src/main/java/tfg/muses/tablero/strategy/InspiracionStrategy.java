package tfg.muses.tablero.strategy;

import tfg.muses.jugador.Jugador;
import tfg.muses.musa.TipoMusa;
import tfg.muses.tablero.Tablero;

public interface InspiracionStrategy {
    public void inspiracion(Tablero tablero, TipoMusa musa, Jugador jugador);

    public boolean supports(TipoMusa musa);
}