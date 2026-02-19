package tfg.muses.Carta;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;

import java.lang.reflect.Field;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import tfg.muses.carta.CartaAccion;
import tfg.muses.carta.CartaInspiracion;
import tfg.muses.carta.CartaService;
import tfg.muses.carta.TipoAccion;
import tfg.muses.carta.strategy.AccionEffectStrategy;
import tfg.muses.carta.strategy.CartaEffectStrategy;
import tfg.muses.carta.strategy.InspiracionEffectStrategy;
import tfg.muses.musa.Musa;
import tfg.muses.musa.TipoMusa;
import tfg.muses.tablero.Tablero;
import tfg.muses.tablero.TableroService;

public class CartaServiceTests {

    private CartaService cartaService;
    private TableroService tableroService;

    CartaAccion cartaAccion;
    CartaInspiracion cartaInspiracion;
    Tablero tablero;

    @BeforeEach
    public void setUp() throws Exception {
        tableroService = mock(TableroService.class);
        cartaService = new CartaService();

        // Setup strategies
        AccionEffectStrategy accionStrategy = new AccionEffectStrategy();
        injectField(accionStrategy, "tableroService", tableroService);

        InspiracionEffectStrategy inspiracionStrategy = new InspiracionEffectStrategy();
        injectField(inspiracionStrategy, "tableroService", tableroService);

        List<CartaEffectStrategy> strategies = Arrays.asList(accionStrategy, inspiracionStrategy);
        injectField(cartaService, "strategies", strategies);

        // Setup Test Data
        cartaInspiracion = new CartaInspiracion();
        cartaInspiracion.setMusaObjetivo(TipoMusa.CALIOPE);

        cartaAccion = new CartaAccion();
        cartaAccion.setTipo(TipoAccion.REVOLUCION_SOL);

        tablero = new Tablero();
        List<Musa> gridMusas = new ArrayList<>();
        for (TipoMusa tipoMusa : TipoMusa.values()) {
            Musa musa = new Musa();
            musa.setNombre(tipoMusa);
            gridMusas.add(musa);
        }
        tablero.setGrid(gridMusas);
    }

    private void injectField(Object target, String fieldName, Object value) throws Exception {
        Field field = target.getClass().getDeclaredField(fieldName);
        field.setAccessible(true);
        field.set(target, value);
    }

    @Test
    public void testEjecutarEfectoCartaAcción() {
        // We mocked tableroService, so it won't actually modify the board unless we
        // stub it to do so.
        // But the previous test logic relied on side effects.
        // If we want to verify the call, we can just verify.
        // If we want to verify side effects, we must stub.

        // Let's verify the CALL, which confirms the Strategy Pattern is working.

        cartaService.ejecutarEfecto(cartaAccion, tablero);

        verify(tableroService).revolucionSolar(tablero);
    }

    @Test
    public void testEjecutarEfectoCartaInspiración() {
        // Stub inspiracion to verify call without exception
        doNothing().when(tableroService).inspiracion(any(Tablero.class), any(TipoMusa.class));

        cartaService.ejecutarEfecto(cartaInspiracion, tablero);

        verify(tableroService).inspiracion(tablero, TipoMusa.CALIOPE);
    }
}
