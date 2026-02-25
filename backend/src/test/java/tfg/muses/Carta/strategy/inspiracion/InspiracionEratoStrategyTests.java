package tfg.muses.Carta.strategy.inspiracion;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import java.lang.reflect.Field;
import java.security.InvalidParameterException;
import java.util.ArrayList;
import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import tfg.muses.carta.CartaInspiracion;
import tfg.muses.carta.strategy.inspiracion.InspiracionEratoStrategy;
import tfg.muses.jugador.Jugador;
import tfg.muses.musa.Musa;
import tfg.muses.musa.MusaService;
import tfg.muses.musa.TipoMusa;
import tfg.muses.tablero.Tablero;

public class InspiracionEratoStrategyTests {

    private InspiracionEratoStrategy strategy;
    private MusaService musaService;
    private CartaInspiracion carta;
    private Tablero tablero;
    private Jugador jugador;
    private List<Musa> grid;

    @BeforeEach
    public void setUp() throws Exception {
        strategy = new InspiracionEratoStrategy();
        musaService = mock(MusaService.class);
        injectField(strategy, "musaService", musaService);

        carta = new CartaInspiracion();
        carta.setNombreMusa(TipoMusa.ERATO);

        grid = new ArrayList<>();
        for (int i = 0; i < 9; i++) {
            Musa musa = new Musa();
            musa.setNombre(TipoMusa.values()[i]);
            grid.add(musa);
        }

        tablero = new Tablero();
        tablero.setGrid(grid);

        jugador = new Jugador();
    }

    @Test
    public void supportsSoloParaErato() {
        assertTrue(strategy.supports(carta));

        CartaInspiracion otraCarta = new CartaInspiracion();
        otraCarta.setNombreMusa(TipoMusa.CALIOPE);
        assertFalse(strategy.supports(otraCarta));
    }

    @Test
    public void executeSolEnPosicion0ColocaTokensEnGrid6() {
        tablero.setSolPos(0);

        strategy.execute(carta, tablero, jugador);

        verify(musaService).colocarTokens(grid.get(6), 2, jugador);
        verifyNoMoreInteractions(musaService);
    }

    @Test
    public void executeSolEnPosicion2ColocaTokensEnGrid0() {
        tablero.setSolPos(2);

        strategy.execute(carta, tablero, jugador);

        verify(musaService).colocarTokens(grid.get(0), 2, jugador);
        verifyNoMoreInteractions(musaService);
    }

    @Test
    public void executeSolEnPosicion4ColocaTokensEnGrid2() {
        tablero.setSolPos(4);

        strategy.execute(carta, tablero, jugador);

        verify(musaService).colocarTokens(grid.get(2), 2, jugador);
        verifyNoMoreInteractions(musaService);
    }

    @Test
    public void executeSolEnPosicion6ColocaTokensEnGrid8() {
        tablero.setSolPos(6);

        strategy.execute(carta, tablero, jugador);

        verify(musaService).colocarTokens(grid.get(8), 2, jugador);
        verifyNoMoreInteractions(musaService);
    }

    @Test
    public void executePosicionInvalidaLanzaExcepcion() {
        tablero.setSolPos(1);
        assertThrows(InvalidParameterException.class, () -> strategy.execute(carta, tablero, jugador));

        tablero.setSolPos(7);
        assertThrows(InvalidParameterException.class, () -> strategy.execute(carta, tablero, jugador));
    }

    private void injectField(Object target, String fieldName, Object value) throws Exception {
        Class<?> clazz = target.getClass();
        while (clazz != null) {
            try {
                Field field = clazz.getDeclaredField(fieldName);
                field.setAccessible(true);
                field.set(target, value);
                return;
            } catch (NoSuchFieldException e) {
                clazz = clazz.getSuperclass();
            }
        }
        throw new NoSuchFieldException("Field '" + fieldName + "' not found in " + target.getClass());
    }
}
