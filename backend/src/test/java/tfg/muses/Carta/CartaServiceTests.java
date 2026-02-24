package tfg.muses.Carta;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import java.lang.reflect.Field;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import tfg.muses.carta.CartaAccion;
import tfg.muses.carta.CartaBase;
import tfg.muses.carta.CartaInspiracion;
import tfg.muses.carta.CartaRepository;
import tfg.muses.carta.CartaService;
import tfg.muses.carta.TipoAccion;
import tfg.muses.carta.strategy.AccionEffectStrategy;
import tfg.muses.carta.strategy.CartaEffectStrategy;
import tfg.muses.carta.strategy.InspiracionEffectStrategy;
import tfg.muses.jugador.Jugador;
import tfg.muses.musa.Musa;
import tfg.muses.musa.TipoMusa;
import tfg.muses.partida.PartidaService;
import tfg.muses.tablero.Tablero;
import tfg.muses.tablero.TableroService;

public class CartaServiceTests {

    private CartaService cartaService;
    private CartaRepository cartaRepository;
    private PartidaService partidaService;
    private TableroService tableroService;

    private CartaAccion cartaAccion;
    private CartaInspiracion cartaInspiracion;
    private Tablero tablero;
    private Jugador jugador;

    @BeforeEach
    public void setUp() throws Exception {
        cartaRepository = mock(CartaRepository.class);
        partidaService = mock(PartidaService.class);
        tableroService = mock(TableroService.class);
        cartaService = new CartaService();

        injectField(cartaService, "cartaRepository", cartaRepository);
        injectField(cartaService, "partidaService", partidaService);

        AccionEffectStrategy accionStrategy = new AccionEffectStrategy();
        injectField(accionStrategy, "tableroService", tableroService);

        InspiracionEffectStrategy inspiracionStrategy = new InspiracionEffectStrategy();
        injectField(inspiracionStrategy, "tableroService", tableroService);

        List<CartaEffectStrategy> strategies = Arrays.asList(accionStrategy, inspiracionStrategy);
        injectField(cartaService, "strategies", strategies);

        cartaInspiracion = new CartaInspiracion();
        cartaInspiracion.setMusaObjetivo(TipoMusa.CALIOPE);
        cartaInspiracion.setUsada(false);

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
        tablero.setSolPos(1);
        tablero.setLunaPos(5);

        jugador = new Jugador();
        jugador.setNombre("TestJugador");
    }

    // ── CRUD ──────────────────────────────────────────────────────────────────

    @Test
    public void createGuardaYRetornaCarta() {
        CartaAccion carta = new CartaAccion();
        carta.setTipo(TipoAccion.DEVOCION_SOL);
        when(cartaRepository.save(carta)).thenReturn(carta);

        CartaBase resultado = cartaService.create(carta);

        assertEquals(carta, resultado);
        verify(cartaRepository).save(carta);
    }

    @Test
    public void getByIdRetornaCartaCuandoExiste() {
        when(cartaRepository.findById(1L)).thenReturn(Optional.of(cartaAccion));

        CartaBase resultado = cartaService.getById(1L);

        assertNotNull(resultado);
        assertEquals(cartaAccion, resultado);
    }

    @Test
    public void getByIdRetornaNullCuandoNoExiste() {
        when(cartaRepository.findById(99L)).thenReturn(Optional.empty());

        CartaBase resultado = cartaService.getById(99L);

        assertNull(resultado);
    }

    @Test
    public void getAllRetornaListaDeCartas() {
        List<CartaBase> cartas = List.of(cartaAccion, cartaInspiracion);
        when(cartaRepository.findAll()).thenReturn(cartas);

        List<CartaBase> resultado = cartaService.getAll();

        assertEquals(2, resultado.size());
    }

    @Test
    public void getAllRetornaListaVaciaCuandoNoHayCartas() {
        when(cartaRepository.findAll()).thenReturn(List.of());

        List<CartaBase> resultado = cartaService.getAll();

        assertTrue(resultado.isEmpty());
    }

    @Test
    public void getAllByPartidaDelegaEnPartidaService() {
        List<CartaBase> cartas = List.of(cartaAccion);
        when(partidaService.getCartasByPartida(1L)).thenReturn(cartas);

        List<CartaBase> resultado = cartaService.getAllByPartida(1L);

        assertEquals(cartas, resultado);
        verify(partidaService).getCartasByPartida(1L);
    }

    @Test
    public void getAllByPartidaRetornaListaVaciaCuandoNoHayCartasEnPartida() {
        when(partidaService.getCartasByPartida(1L)).thenReturn(List.of());

        List<CartaBase> resultado = cartaService.getAllByPartida(1L);

        assertTrue(resultado.isEmpty());
    }

    @Test
    public void deleteInvocaDeleteByIdEnRepositorio() {
        doNothing().when(cartaRepository).deleteById(1L);

        cartaService.delete(1L);

        verify(cartaRepository).deleteById(1L);
    }

    @Test
    public void deleteAllByPartidaEliminaTodasLasCartasDeLaPartida() {
        List<CartaBase> cartas = List.of(cartaAccion, cartaInspiracion);
        when(partidaService.getCartasByPartida(1L)).thenReturn(cartas);
        doNothing().when(cartaRepository).deleteAll(cartas);

        cartaService.deleteAllByPartida(1L);

        verify(cartaRepository).deleteAll(cartas);
    }

    @Test
    public void deleteAllByPartidaNoFallaCuandoPartidaSinCartas() {
        when(partidaService.getCartasByPartida(1L)).thenReturn(List.of());
        doNothing().when(cartaRepository).deleteAll(List.of());

        assertDoesNotThrow(() -> cartaService.deleteAllByPartida(1L));
        verify(cartaRepository).deleteAll(List.of());
    }

    // ── Ejecución de efectos ──────────────────────────────────────────────────

    @Test
    public void ejecutarEfectoCartaAccionRevolucionSolar() {
        cartaAccion.setTipo(TipoAccion.REVOLUCION_SOL);

        cartaService.ejecutarEfecto(cartaAccion, tablero, jugador);

        verify(tableroService).revolucionSolar(tablero, jugador);
    }

    @Test
    public void ejecutarEfectoCartaAccionRevolucionLunar() {
        cartaAccion.setTipo(TipoAccion.REVOLUCION_LUNA);

        cartaService.ejecutarEfecto(cartaAccion, tablero, jugador);

        verify(tableroService).revolucionLunar(tablero, jugador);
    }

    @Test
    public void ejecutarEfectoCartaAccionDevocionSol() {
        cartaAccion.setTipo(TipoAccion.DEVOCION_SOL);

        cartaService.ejecutarEfecto(cartaAccion, tablero, jugador);

        verify(tableroService).devocionSol(tablero, jugador);
    }

    @Test
    public void ejecutarEfectoCartaAccionDevocionLuna() {
        cartaAccion.setTipo(TipoAccion.DEVOCION_LUNA);

        cartaService.ejecutarEfecto(cartaAccion, tablero, jugador);

        verify(tableroService).devocionLuna(tablero, jugador);
    }

    @Test
    public void ejecutarEfectoCartaInspiracionNoUsada() {
        doNothing().when(tableroService).inspiracion(any(Tablero.class), any(TipoMusa.class), any(Jugador.class));

        cartaService.ejecutarEfecto(cartaInspiracion, tablero, jugador);

        verify(tableroService).inspiracion(tablero, TipoMusa.CALIOPE, jugador);
        assertTrue(cartaInspiracion.isUsada());
    }

    @Test
    public void ejecutarEfectoCartaInspiracionYaUsadaLanzaExcepcion() {
        cartaInspiracion.setUsada(true);

        assertThrows(IllegalStateException.class,
                () -> cartaService.ejecutarEfecto(cartaInspiracion, tablero, jugador));
    }

    @Test
    public void ejecutarEfectoSinEstrategiaCompatibleLanzaExcepcion() throws Exception {
        // Carta sin tipo reconocido: vaciamos la lista de strategies
        injectField(cartaService, "strategies", List.of());

        assertThrows(IllegalArgumentException.class,
                () -> cartaService.ejecutarEfecto(cartaAccion, tablero, jugador));
    }

    // ──────────────────────────────────────────────────────────────────────────

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
