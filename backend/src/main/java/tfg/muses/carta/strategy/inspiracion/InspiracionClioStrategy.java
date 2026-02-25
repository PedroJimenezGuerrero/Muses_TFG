package tfg.muses.carta.strategy.inspiracion;

import java.security.InvalidParameterException;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import tfg.muses.carta.CartaInspiracion;
import tfg.muses.musa.TipoMusa;
import tfg.muses.tablero.Tablero;
import tfg.muses.musa.Musa;
import tfg.muses.musa.MusaService;
import tfg.muses.jugador.Jugador;

@Component
public class InspiracionClioStrategy implements InspiracionMusaStrategy {

    @Autowired
    private MusaService musaService;

    @Override
    public boolean supports(CartaInspiracion carta) {
        return carta.getNombreMusa() == TipoMusa.CLIO;
    }

    @Override
    public void execute(CartaInspiracion carta, Tablero tablero, Jugador jugador) {
        int posicionSol = tablero.getSolPos();
        Musa musaObjetivo = null;
        switch (posicionSol) {
            case 1:
                musaObjetivo = tablero.getGrid().get(5);
                musaService.colocarTokens(musaObjetivo, 2, jugador);
                break;
            case 3:
                musaObjetivo = tablero.getGrid().get(7);
                musaService.colocarTokens(musaObjetivo, 2, jugador);
                break;
            case 5:
                musaObjetivo = tablero.getGrid().get(3);
                musaService.colocarTokens(musaObjetivo, 2, jugador);
                break;
            case 7:
                musaObjetivo = tablero.getGrid().get(1);
                musaService.colocarTokens(musaObjetivo, 2, jugador);
                break;
            default:
                throw new InvalidParameterException("Esta carta no es válida para la posición de los astros.");
        }

    }
}
