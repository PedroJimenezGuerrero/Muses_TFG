package tfg.muses.Tablero;

import static org.junit.jupiter.api.Assertions.assertEquals;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import tfg.muses.tablero.TableroModel;
import tfg.muses.tablero.TableroService;

public class TableroServiceTests {
    private TableroService tableroService;
    private TableroModel tablero;

    @BeforeEach
    public void setUp() {
        tableroService = new TableroService();
        tablero = new TableroModel();
    }

    @Test
    public void testRotarAstrosWithValidPositions() {
        tablero.setSolPos(1); // Sol: arriba centro
        tablero.setLunaPos(5);  // Luna: Abajo centro

        tableroService.rotarAstros(tablero);
        
        assertEquals(2, tablero.getSolPos());
        assertEquals(6, tablero.getLunaPos());

        tablero.setSolPos(3); // Sol: derecha centro
        tablero.setLunaPos(7);  // Luna: Izquierda centro

        tableroService.rotarAstros(tablero);

        assertEquals(4, tablero.getSolPos());
        assertEquals(0, tablero.getLunaPos());
    }

}