package tfg.muses.carta.strategy;

import org.springframework.stereotype.Component;

import tfg.muses.carta.CartaBase;
import tfg.muses.carta.CartaInspiracion;
import tfg.muses.carta.strategy.inspiracion.InspiracionMusaStrategy;
import tfg.muses.tablero.Tablero;
import tfg.muses.jugador.Jugador;
import tfg.muses.musa.TipoInspiracion;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;

@Component
public class InspiracionEffectStrategy implements CartaEffectStrategy {

    @Autowired
    List<InspiracionMusaStrategy> strategies;

    @Override
    public boolean supports(CartaBase carta) {
        return carta instanceof CartaInspiracion;
    }

    @Override
    public void execute(CartaBase carta, Tablero tablero, Jugador jugador) {
        CartaInspiracion cartaInspiracion = (CartaInspiracion) carta;
        TipoInspiracion tipoInspiracion = cartaInspiracion.getNombreMusa().getTipoInspiracion();

        if (cartaInspiracion.isUsada()) {
            throw new IllegalStateException("Esta carta de inspiración ya ha sido usada");
        }

        if (tipoInspiracion != posicionAstros(tablero)) {
            throw new IllegalStateException("Los astros no están en la posición correcta para usar esta carta");
        }

        for (InspiracionMusaStrategy strategy : strategies) {
            if (strategy.supports(cartaInspiracion)) {
                strategy.execute(cartaInspiracion, tablero, jugador);
                return;
            }
        }

        // Marcar como usada
        cartaInspiracion.setUsada(true);
    }

    /**
     * Comprueba si los astros están en posición diagonal.
     * Las posiciones pares son diagonales y las impares son rectas.
     * @param tablero
     * @return {@code TipoInspiracion.VERTICES} si los astros están en posición diagonal, {@code TipoInspiracion.LADOS} en caso contrario
     */
    private TipoInspiracion posicionAstros(Tablero tablero) {
        // sólo hace falta comprobar el sol para saber si están en las esquinas
        int posicionSol = tablero.getSolPos();
        return posicionSol % 2 == 0 ? TipoInspiracion.VERTICES : TipoInspiracion.LADOS;
    }
}
