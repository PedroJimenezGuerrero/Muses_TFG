package tfg.muses.carta.strategy;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import tfg.muses.carta.CartaAccion;
import tfg.muses.carta.CartaBase;
import tfg.muses.tablero.Tablero;
import tfg.muses.tablero.TableroService;

@Component
public class AccionEffectStrategy implements CartaEffectStrategy {

    @Autowired
    private TableroService tableroService;

    @Override
    public boolean supports(CartaBase carta) {
        return carta instanceof CartaAccion;
    }

    @Override
    public void execute(CartaBase carta, Tablero tablero) {
        CartaAccion cartaAccion = (CartaAccion) carta;
        switch (cartaAccion.getTipo()) {
            case DEVOCION_SOL:
                // tableroService.devocionSol(tablero, jugador);
                break;
            case DEVOCION_LUNA:
                // tableroService.devocionLuna(tablero, jugador);
                break;
            case REVOLUCION_SOL:
                tableroService.revolucionSolar(tablero);
                break;
            case REVOLUCION_LUNA:
                tableroService.revolucionLunar(tablero);
                break;
            default:
                throw new UnsupportedOperationException("TipoAccion no soportado: " + cartaAccion.getTipo());
        }
    }
}
