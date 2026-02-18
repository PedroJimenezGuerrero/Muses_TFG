package tfg.muses.Carta;

import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;

import java.util.ArrayList;
import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mock;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import tfg.muses.carta.CartaAccion;
import tfg.muses.carta.CartaInspiracion;
import tfg.muses.carta.CartaService;
import tfg.muses.carta.TipoAccion;
import tfg.muses.musa.Musa;
import tfg.muses.musa.TipoMusa;
import tfg.muses.tablero.Tablero;
import tfg.muses.tablero.TableroService;

@SpringBootTest
public class CartaServiceTests {

    @Autowired
    private CartaService cartaService;

    @Mock
    private TableroService tableroService;

    CartaAccion cartaAccion;
    CartaInspiracion cartaInspiracion;

    Tablero tablero;

    @BeforeEach
    public void setUp() {
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

    @Test
    public void testEjecutarEfectoCartaAcción() {
        List<Musa> musasIniciales = tablero.getGrid();
        cartaService.ejecutarEfecto(cartaAccion, tablero);
        List<Musa> musasDespués = tablero.getGrid();

        assertNotEquals(musasIniciales, musasDespués);
        verify(tableroService).revolucionSolar(tablero);

    }

    @Test
    public void testEjecutarEfectoCartaInspiración() {
        List<Musa> musasIniciales = tablero.getGrid();
        cartaService.ejecutarEfecto(cartaInspiracion, tablero);
        List<Musa> musasDespués = tablero.getGrid();

        assertNotEquals(musasIniciales, musasDespués);
        verify(tableroService).inspiracion(tablero, TipoMusa.CALIOPE);

    }

}
