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
public class InspiracionCaliopeStrategy implements InspiracionMusaStrategy {

    @Autowired
    private MusaService musaService;
    
    @Override
    public boolean supports(CartaInspiracion carta) {
        return carta.getNombreMusa() == TipoMusa.CALIOPE;
    }

    @Override
    public void execute(CartaInspiracion carta, Tablero tablero, Jugador jugador) {
        int posicionSol = tablero.getSolPos();
        Musa musaObjetivo1 = null;
        Musa musaObjetivo2 = null;
        switch (posicionSol) {
            case 1:
                musaObjetivo1 = tablero.getGrid().get(6);
                musaObjetivo2 = tablero.getGrid().get(2);
                musaService.colocarTokens(musaObjetivo1, 1, jugador);
                musaService.colocarTokens(musaObjetivo2, 1, jugador);
                break;
            case 3:
                musaObjetivo1 = tablero.getGrid().get(0);
                musaObjetivo2 = tablero.getGrid().get(8);
                musaService.colocarTokens(musaObjetivo1, 1, jugador);
                musaService.colocarTokens(musaObjetivo2, 1, jugador);
                break;
            case 5:
                musaObjetivo1 = tablero.getGrid().get(6);
                musaObjetivo2 = tablero.getGrid().get(2);
                musaService.colocarTokens(musaObjetivo1, 1, jugador);
                musaService.colocarTokens(musaObjetivo2, 1, jugador);
                break;
            case 7:
                musaObjetivo1 = tablero.getGrid().get(0);
                musaObjetivo2 = tablero.getGrid().get(8);
                musaService.colocarTokens(musaObjetivo1, 1, jugador);
                musaService.colocarTokens(musaObjetivo2, 1, jugador);
                break;
            default:
                throw new InvalidParameterException("Esta carta no es válida para la posición de los astros.");
        }

    }
}
