package tfg.muses.carta.strategy.inspiracion;

import org.springframework.stereotype.Component;

import tfg.muses.carta.CartaInspiracion;
import tfg.muses.musa.TipoMusa;
import tfg.muses.tablero.Tablero;
import tfg.muses.jugador.Jugador;

@Component
public class InspiracionUraniaStrategy implements InspiracionMusaStrategy {

    @Override
    public boolean supports(CartaInspiracion carta) {
        return carta.getNombreMusa() == TipoMusa.URANIA;
    }

    @Override
    public void execute(CartaInspiracion carta, Tablero tablero, Jugador jugador) {
        // TODO: Implementar efecto de Urania
    }
}
