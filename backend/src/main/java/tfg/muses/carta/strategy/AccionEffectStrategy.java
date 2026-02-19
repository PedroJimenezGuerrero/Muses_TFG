package tfg.muses.carta.strategy;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import tfg.muses.carta.CartaAccion;
import tfg.muses.carta.CartaBase;
import tfg.muses.tablero.Tablero;

@Component
public class AccionEffectStrategy implements CartaEffectStrategy {

    @Autowired
    private tfg.muses.tablero.TableroService tableroService;

    @Override
    public boolean supports(CartaBase carta) {
        return carta instanceof CartaAccion;
    }

    @Override
    public void execute(CartaBase carta, Tablero tablero) {
        CartaAccion cartaAccion = (CartaAccion) carta;
        switch (cartaAccion.getTipo()) {
            case DEVOCION_SOL:
                // TODO: Implementar DEVOCION_SOL
                break;
            case DEVOCION_LUNA:
                // TODO: Implementar DEVOCION_LUNA
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
