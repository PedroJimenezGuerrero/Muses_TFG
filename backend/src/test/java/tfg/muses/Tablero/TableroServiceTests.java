package tfg.muses.Tablero;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import java.lang.reflect.Field;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import tfg.muses.jugador.Jugador;
import tfg.muses.musa.Musa;
import tfg.muses.musa.MusaService;
import tfg.muses.musa.TipoMusa;
import tfg.muses.partida.Partida;
import tfg.muses.partida.PartidaRepository;
import tfg.muses.partida.PartidaService;
import tfg.muses.tablero.Tablero;
import tfg.muses.tablero.TableroRepository;
import tfg.muses.tablero.TableroService;

public class TableroServiceTests {

    private TableroService tableroService;
    private TableroRepository tableroRepository;
    private PartidaRepository partidaRepository;
    private PartidaService partidaService;
    private MusaService musaService;

    private Tablero tablero;
    private Jugador jugador;

    @BeforeEach
    public void setUp() throws Exception {
        tableroRepository = mock(TableroRepository.class);
        partidaRepository = mock(PartidaRepository.class);
        partidaService = mock(PartidaService.class);
        musaService = mock(MusaService.class);

        tableroService = new TableroService();
        injectField(tableroService, "tableroRepository", tableroRepository);
        injectField(tableroService, "partidaRepository", partidaRepository);
        injectField(tableroService, "partidaService", partidaService);
        injectField(tableroService, "musaService", musaService);

        tablero = buildTableroConGrid(1, 5);
        jugador = new Jugador();
        jugador.setNombre("TestJugador");
    }

    // ── CRUD ──────────────────────────────────────────────────────────────────

    @Test
    public void getByIdRetornaTableroExistente() {
        when(tableroRepository.findById(1L)).thenReturn(Optional.of(tablero));

        Tablero resultado = tableroService.getById(1L);

        assertNotNull(resultado);
        assertEquals(tablero, resultado);
    }

    @Test
    public void getByIdRetornaNullCuandoNoExiste() {
        when(tableroRepository.findById(99L)).thenReturn(Optional.empty());

        Tablero resultado = tableroService.getById(99L);

        assertNull(resultado);
    }

    @Test
    public void getByPartidaIdRetornaTableroDePartida() {
        Partida partida = new Partida();
        partida.setTablero(tablero);
        when(partidaRepository.findById(1L)).thenReturn(Optional.of(partida));

        Tablero resultado = tableroService.getByPartidaId(1L);

        assertEquals(tablero, resultado);
    }

    @Test
    public void getByPartidaIdRetornaNullCuandoPartidaNoExiste() {
        when(partidaRepository.findById(99L)).thenReturn(Optional.empty());

        Tablero resultado = tableroService.getByPartidaId(99L);

        assertNull(resultado);
    }

    @Test
    public void saveGuardaYRetornaTablero() {
        when(tableroRepository.save(tablero)).thenReturn(tablero);

        Tablero resultado = tableroService.save(tablero);

        assertEquals(tablero, resultado);
        verify(tableroRepository).save(tablero);
    }

    @Test
    public void getAllRetornaListaDeTableros() {
        when(tableroRepository.findAll()).thenReturn(List.of(tablero));

        List<Tablero> resultado = tableroService.getAll();

        assertEquals(1, resultado.size());
    }

    @Test
    public void updateActualizaYRetornaTableroExistente() {
        when(tableroRepository.findById(1L)).thenReturn(Optional.of(tablero));
        Tablero actualizado = buildTableroConGrid(2, 6);
        when(tableroRepository.save(any(Tablero.class))).thenReturn(actualizado);
        setId(tablero, 1L);

        Tablero resultado = tableroService.update(1L, actualizado);

        assertNotNull(resultado);
        assertEquals(2, resultado.getSolPos());
        assertEquals(6, resultado.getLunaPos());
    }

    @Test
    public void updateRetornaNullCuandoTableroNoExiste() {
        when(tableroRepository.findById(99L)).thenReturn(Optional.empty());

        Tablero resultado = tableroService.update(99L, tablero);

        assertNull(resultado);
    }

    @Test
    public void deleteInvocaDeleteById() {
        doNothing().when(tableroRepository).deleteById(1L);

        tableroService.delete(1L);

        verify(tableroRepository).deleteById(1L);
    }

    @Test
    public void getByPlayerIdRetornaTableroDePartidaDelJugador() {
        Partida partida = new Partida();
        partida.setTablero(tablero);
        when(partidaService.getByJugadorId(1L)).thenReturn(partida);

        Tablero resultado = tableroService.getByPlayerId(1L);

        assertEquals(tablero, resultado);
    }

    @Test
    public void getByPlayerIdRetornaNullCuandoJugadorSinPartida() {
        when(partidaService.getByJugadorId(99L)).thenReturn(null);

        Tablero resultado = tableroService.getByPlayerId(99L);

        assertNull(resultado);
    }

    // ── rotarAstros ───────────────────────────────────────────────────────────

    @Test
    public void rotarAstrosAvanzaUnaPosTantoSolComoLuna() {
        tablero.setSolPos(1);
        tablero.setLunaPos(5);

        tableroService.rotarAstros(tablero);

        assertEquals(2, tablero.getSolPos());
        assertEquals(6, tablero.getLunaPos());
    }

    @Test
    public void rotarAstrosHaceModulo8AlLlegarAlFinal() {
        tablero.setSolPos(7);
        tablero.setLunaPos(3);

        tableroService.rotarAstros(tablero);

        assertEquals(0, tablero.getSolPos());
        assertEquals(4, tablero.getLunaPos());
    }

    @Test
    public void rotarAstrosCorrigeDesincronizacionLuna() {
        // Si sol y luna no están opuestos (diferencia != 4), luna se ajusta
        tablero.setSolPos(8); // Posición fuera del rango normal (será % 8 = 0 + 1 = 1)
        tablero.setLunaPos(2); // Luna no opuesta a la posición correcta de sol

        tableroService.rotarAstros(tablero);

        int solPos = tablero.getSolPos();
        int lunaPos = tablero.getLunaPos();
        assertEquals(4, Math.abs(solPos - lunaPos));
    }

    @Test
    public void rotarAstrosMantieneSolYLunaOpuestos() {
        for (int pos = 0; pos < 8; pos++) {
            tablero.setSolPos(pos);
            tablero.setLunaPos((pos + 4) % 8);

            tableroService.rotarAstros(tablero);

            int diferencia = Math.abs(tablero.getSolPos() - tablero.getLunaPos());
            assertTrue(diferencia == 4, "Sol y luna deben estar siempre opuestos, diferencia: " + diferencia);
        }
    }

    // ── revolucionSolar y revolucionLunar ─────────────────────────────────────

    @Test
    public void revolucionSolarEnEjeVerticalDesplazaCorrectamente() {
        // Sol en posición 1 (arriba centro), rotación eje vertical derecha
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

        Musa musaInicial1 = tablero.getGrid().get(1);
        Musa musaInicial4 = tablero.getGrid().get(4);
        Musa musaInicial7 = tablero.getGrid().get(7);

        tableroService.revolucionSolar(tablero, jugador);

        assertEquals(musaInicial4, tablero.getGrid().get(1), "pos 1 debe tener musa de pos 4");
        assertEquals(musaInicial7, tablero.getGrid().get(4), "pos 4 debe tener musa de pos 7");
        assertEquals(musaInicial1, tablero.getGrid().get(2), "pos 2 debe tener musa de pos 1");
        verify(musaService).colocarTokens(any(Musa.class), eq(1), eq(jugador));
        verify(tableroRepository).save(tablero);
    }

    @Test
    public void revolucionLunarEnEjeVerticalDesplazaCorrectamente() {
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

        Musa musaInicial0 = tablero.getGrid().get(0);
        Musa musaInicial1 = tablero.getGrid().get(1);

        tableroService.revolucionLunar(tablero, jugador);

        assertEquals(musaInicial0, tablero.getGrid().get(1), "pos 1 debe tener musa de pos 0");
        assertEquals(musaInicial1, tablero.getGrid().get(4), "pos 4 debe tener musa de pos 1");
        verify(musaService).colocarTokens(any(Musa.class), eq(1), eq(jugador));
        verify(tableroRepository).save(tablero);
    }

    @Test
    public void revolucionSolarEnDiagonalDominanteDesplazaCorrectamente() {
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

        Musa musaInicial0 = tablero.getGrid().get(0);
        Musa musaInicial4 = tablero.getGrid().get(4);

        tableroService.revolucionSolar(tablero, jugador);

        assertEquals(musaInicial4, tablero.getGrid().get(0), "pos 0 debe tener musa de pos 4");
        assertEquals(musaInicial0, tablero.getGrid().get(1), "pos 1 debe tener musa de pos 0");
        verify(musaService).colocarTokens(any(Musa.class), eq(1), eq(jugador));
    }

    @Test
    public void revolucionLunarEnDiagonalDominanteDesplazaCorrectamente() {
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

        Musa musaInicial0 = tablero.getGrid().get(0);
        Musa musaInicial4 = tablero.getGrid().get(4);

        tableroService.revolucionLunar(tablero, jugador);

        assertEquals(musaInicial0, tablero.getGrid().get(4), "pos 4 debe tener musa de pos 0");
        assertEquals(musaInicial4, tablero.getGrid().get(8), "pos 8 debe tener musa de pos 4");
        verify(musaService).colocarTokens(any(Musa.class), eq(1), eq(jugador));
    }

    // ── devocionSol y devocionLuna ─────────────────────────────────────────────

    @Test
    public void devocionSolColocaDosTokensEnMusaDelSol() {
        tablero.setSolPos(1);
        tablero.setLunaPos(5);
        when(tableroRepository.save(any())).thenReturn(tablero);

        tableroService.devocionSol(tablero, jugador);

        // La musa en posición de sol (mapAstroToGrid(1) = 1 → grid[1])
        verify(musaService).colocarTokens(tablero.getGrid().get(1), 2, jugador);
        verify(tableroRepository).save(tablero);
    }

    @Test
    public void devocionLunaColocaDosTokensEnMusaDeLaLuna() {
        tablero.setSolPos(1);
        tablero.setLunaPos(5);
        when(tableroRepository.save(any())).thenReturn(tablero);

        tableroService.devocionLuna(tablero, jugador);

        // La musa en posición de luna (mapAstroToGrid(5) = 7 → grid[7])
        verify(musaService).colocarTokens(tablero.getGrid().get(7), 2, jugador);
        verify(tableroRepository).save(tablero);
    }

    // ── getMusasEnAstros ──────────────────────────────────────────────────────

    @Test
    public void getMusasEnAstrosRetornaMusasCorrectas() {
        tablero.setSolPos(0); // mapAstroToGrid(0) = 0
        tablero.setLunaPos(4); // mapAstroToGrid(4) = 8
        
        /*
          sol     
            0   1   2
            3   4   5
            6   7   8
                     luna
        */
        Map<String, Musa> resultado = tableroService.getMusasEnAstros(tablero);

        assertEquals(TipoMusa.values()[0], resultado.get("sol").getNombre());
        assertEquals(TipoMusa.values()[8], resultado.get("luna").getNombre());
    }

    @Test
    public void getMusasEnAstrosPorIdRetornaMusasCorrectas() {
        tablero.setSolPos(0);
        tablero.setLunaPos(4);
        when(tableroRepository.findById(1L)).thenReturn(Optional.of(tablero));

        Map<String, Musa> resultado = tableroService.getMusasEnAstros(1L);

        assertEquals(TipoMusa.values()[0], resultado.get("sol").getNombre());
        assertEquals(TipoMusa.values()[8], resultado.get("luna").getNombre());
    }

    @Test
    public void getMusasEnAstrosPorIdLanzaExcepcionCuandoTableroNoExiste() {
        when(tableroRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(IllegalArgumentException.class,
                () -> tableroService.getMusasEnAstros(99L));
    }

    @Test
    public void getMusasEnAstrosTodasLasPosicionesAstroSonValidas() {
        // Verificamos que el mapeo funciona para todas las posiciones de astro (0-7)
        for (int pos = 0; pos < 8; pos++) {
            tablero.setSolPos(pos);
            tablero.setLunaPos((pos + 4) % 8);
            assertDoesNotThrow(() -> tableroService.getMusasEnAstros(tablero),
                    "La posición " + pos + " debería ser válida");
        }
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private Tablero buildTableroConGrid(int solPos, int lunaPos) {
        Tablero t = new Tablero();
        t.setSolPos(solPos);
        t.setLunaPos(lunaPos);
        List<Musa> gridMusas = new ArrayList<>();
        for (TipoMusa tipoMusa : TipoMusa.values()) {
            Musa musa = new Musa();
            musa.setNombre(tipoMusa);
            gridMusas.add(musa);
        }
        t.setGrid(gridMusas);
        return t;
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

    private void setId(Object entity, Long id) {
        try {
            injectField(entity, "id", id);
        } catch (Exception ignored) {
        }
    }
}