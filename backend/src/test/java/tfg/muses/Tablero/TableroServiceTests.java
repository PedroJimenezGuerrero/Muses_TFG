package tfg.muses.Tablero;

import static org.junit.jupiter.api.Assertions.assertEquals;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import tfg.muses.musa.Musa;
import tfg.muses.musa.TipoMusa;
import tfg.muses.tablero.Tablero;
import tfg.muses.tablero.TableroService;

public class TableroServiceTests {
    private TableroService tableroService;
    private Tablero tablero;

    @BeforeEach
    public void setUp() {
        tableroService = new TableroService();
        tablero = new Tablero();
    }

    @Test
    public void testRotarAstrosWithValidPositions() {
        tablero.setSolPos(1); // Sol: arriba centro
        tablero.setLunaPos(5); // Luna: Abajo centro

        tableroService.rotarAstros(tablero);

        assertEquals(2, tablero.getSolPos());
        assertEquals(6, tablero.getLunaPos());

        tablero.setSolPos(3); // Sol: derecha centro
        tablero.setLunaPos(7); // Luna: Izquierda centro

        tableroService.rotarAstros(tablero);

        assertEquals(4, tablero.getSolPos());
        assertEquals(0, tablero.getLunaPos());
    }

    @Test
    public void testRotarAstrosWithInvalidPositions() {
        tablero.setSolPos(8); // Sol: arriba izquierda (sin modulo de 8)
        tablero.setLunaPos(5); // Luna: Abajo centro (debería ser 4)

        tableroService.rotarAstros(tablero);

        // Tras rotar se arreglan las incongruencias
        assertEquals(1, tablero.getSolPos());
        assertEquals(5, tablero.getLunaPos());
    }

    @Test
    public void testRevoluciónSolarVertical() {
        // Crear lista de musas para el grid
        List<Musa> gridMusas = new ArrayList<>();
        for (TipoMusa tipoMusa : TipoMusa.values()) {
            Musa musa = new Musa();
            musa.setNombre(tipoMusa);
            gridMusas.add(musa);
        }
        tablero.setGrid(gridMusas);

        // Tokens arriba centro y abajo centro
        tablero.setSolPos(1);
        tablero.setLunaPos(5);

        /*
        la rotación debería efectuarse en sentido horario, 
        la musa 4 yendo hacia el sol

           sol     
        0   1   2
        3   4   5
        6   7   8
           luna

        y quedaría así:

           sol     
        0   4   1
        3   7   2
        6   8   5
           luna
        
         */

        // Guardar referencias de musas iniciales
        Musa musaInicial0 = tablero.getGrid().get(0); // Esta no debe moverse
        Musa musaInicial1 = tablero.getGrid().get(1); // Esta se moverá a la posición 2 (su derecha)
        Musa musaInicial7 = tablero.getGrid().get(7); // Esta se moverá a la posición 4 (arriba)

        // Ejecutar revolución solar
        tableroService.revolucionSolar(tablero);

        // Verificar rotación horaria: posición i debe contener lo que estaba en i-1
        assertEquals(musaInicial0, tablero.getGrid().get(0), "Posición 0 debe contener musa de posición 0");
        assertEquals(musaInicial1, tablero.getGrid().get(2), "Posición 2 debe contener musa de posición 1");
        assertEquals(musaInicial7, tablero.getGrid().get(4), "Posición 4 debe contener musa de posición 7");
    }

    @Test
    public void testRevoluciónLunarVertical() {
        // Crear lista de musas para el grid
        List<Musa> gridMusas = new ArrayList<>();
        for (TipoMusa tipoMusa : TipoMusa.values()) {
            Musa musa = new Musa();
            musa.setNombre(tipoMusa);
            gridMusas.add(musa);
        }
        tablero.setGrid(gridMusas);

        // Tokens arriba centro y abajo centro
        tablero.setSolPos(1);
        tablero.setLunaPos(5);

        /*
        la rotación debería efectuarse en sentido horario, 
        la musa 4 yendo hacia la luna

           sol     
        0   1   2
        3   4   5
        6   7   8
           luna

        y quedaría así:

           sol     
        3   0   2
        6   1   5
        7   4   8
           luna
        
         */

        // Guardar referencias de musas iniciales
        Musa musaInicial0 = tablero.getGrid().get(0); // Esta se moverá a la posición 1 (su derecha)
        Musa musaInicial1 = tablero.getGrid().get(1); // Esta se moverá a la posición 4 (abajo)
        Musa musaInicial7 = tablero.getGrid().get(7); // Esta no debe moverse

        // Ejecutar revolución lunar
        tableroService.revolucionLunar(tablero);

        // Verificar rotación horaria: posición i debe contener lo que estaba en i-1
        assertEquals(musaInicial0, tablero.getGrid().get(1), "Posición 0 debe contener musa de posición 0");
        assertEquals(musaInicial1, tablero.getGrid().get(4), "Posición 4 debe contener musa de posición 1");
        assertEquals(musaInicial7, tablero.getGrid().get(6), "Posición 6 debe contener musa de posición 7");
    }

    @Test
    public void testRevoluciónSolarDiagonal() {
        // Crear lista de musas para el grid
        List<Musa> gridMusas = new ArrayList<>();
        for (TipoMusa tipoMusa : TipoMusa.values()) {
            Musa musa = new Musa();
            musa.setNombre(tipoMusa);
            gridMusas.add(musa);
        }
        tablero.setGrid(gridMusas);

        // Tokens en la diagonal: arriba izquierda y abajo derecha
        tablero.setSolPos(0);
        tablero.setLunaPos(4);

        /*
        la rotación debería efectuarse en sentido horario, 
        la musa 4 yendo hacia el sol

        sol     
          0   1   2
          3   4   5
          6   7   8
                   luna

        y quedaría así:

        sol     
          4   0   1
          3   8   2
          6   7   5
                   luna
        
         */

        // Guardar referencias de musas iniciales
        Musa musaInicial0 = tablero.getGrid().get(0); // Esta se moverá a la posición 1 (su derecha)
        Musa musaInicial4 = tablero.getGrid().get(4); // Esta se moverá a la posición 1 (su diagonal izq)
        Musa musaInicial7 = tablero.getGrid().get(7); // Esta no se moverá

        // Ejecutar revolución solar
        tableroService.revolucionSolar(tablero);

        // Verificar rotación horaria: posición i debe contener lo que estaba en i-1
        assertEquals(musaInicial0, tablero.getGrid().get(1), "Posición 1 debe contener musa de posición 0");
        assertEquals(musaInicial4, tablero.getGrid().get(0), "Posición 0 debe contener musa de posición 4");
        assertEquals(musaInicial7, tablero.getGrid().get(7), "Posición 7 debe contener musa de posición 7");
    }

    @Test
    public void testRevoluciónLunarDiagonal() {
        // Crear lista de musas para el grid
        List<Musa> gridMusas = new ArrayList<>();
        for (TipoMusa tipoMusa : TipoMusa.values()) {
            Musa musa = new Musa();
            musa.setNombre(tipoMusa);
            gridMusas.add(musa);
        }
        tablero.setGrid(gridMusas);

        // Tokens en la diagonal: arriba izquierda y abajo derecha
        tablero.setSolPos(0);
        tablero.setLunaPos(4);

        /*
        la rotación debería efectuarse en sentido horario, 
        la musa 4 yendo hacia la luna

        sol     
          0   1   2
          3   4   5
          6   7   8
                   luna

        y quedaría así:

        sol     
          3   1   2
          6   0   5
          7   8   4
                   luna
        
         */

        // Guardar referencias de musas iniciales
        Musa musaInicial0 = tablero.getGrid().get(0); // Esta se moverá a la posición 4 (su diagonal der)
        Musa musaInicial2 = tablero.getGrid().get(2); // Esta no se moverá
        Musa musaInicial4 = tablero.getGrid().get(4); // Esta se moverá a la posición 7 (su diagonal der)
        Musa musaInicial7 = tablero.getGrid().get(7); // Esta se moverá a la posción 6 (su izquierda)

        // Ejecutar revolución lunar
        tableroService.revolucionLunar(tablero);

        // Verificar rotación horaria: posición i debe contener lo que estaba en i-1
        assertEquals(musaInicial0, tablero.getGrid().get(4), "Posición 4 debe contener musa de posición 0");
        assertEquals(musaInicial2, tablero.getGrid().get(2), "Posición 2 debe contener musa de posición 2");
        assertEquals(musaInicial4, tablero.getGrid().get(8), "Posición 8 debe contener musa de posición 4");
        assertEquals(musaInicial7, tablero.getGrid().get(6), "Posición 6 debe contener musa de posición 7");
    }

    @Test
    public void testGetMusasEnAstros() {
        // Crear lista de musas para el grid
        List<Musa> gridMusas = new ArrayList<>();
        for (TipoMusa tipoMusa : TipoMusa.values()) {
            Musa musa = new Musa();
            musa.setNombre(tipoMusa);
            gridMusas.add(musa);
        }
        tablero.setGrid(gridMusas);
        
        // Sol en pos 0 (debería corresponder a la musa en la posición 0)
        tablero.setSolPos(0); 
        // Luna en pos 4 (debería corresponder a la musa en la posición 8)
        tablero.setLunaPos(4);
        
        /*
          sol     
            0   1   2
            3   4   5
            6   7   8
                     luna
        */

        Map<String, Musa> result = tableroService.getMusasEnAstros(tablero);

        assertEquals(TipoMusa.values()[0], result.get("sol").getNombre());
        assertEquals(TipoMusa.values()[8], result.get("luna").getNombre());
    }
}