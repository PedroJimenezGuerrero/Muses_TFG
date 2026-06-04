package tfg.muses.Partida;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import java.lang.reflect.Field;
import java.lang.reflect.Method;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import tfg.muses.exception.ResourceNotFoundException;

import tfg.muses.carta.CartaAccion;
import tfg.muses.carta.CartaBase;
import tfg.muses.carta.CartaInspiracion;
import tfg.muses.carta.CartaService;
import tfg.muses.carta.TipoAccion;
import tfg.muses.jugador.Jugador;
import tfg.muses.jugador.JugadorService;
import tfg.muses.musa.Musa;
import tfg.muses.musa.TipoMusa;
import tfg.muses.partida.Partida;
import tfg.muses.partida.PartidaRepository;
import tfg.muses.partida.PartidaService;
import tfg.muses.tablero.Tablero;
import tfg.muses.token.Token;
import tfg.muses.usuario.Usuario;

public class PartidaServiceTests {

    private PartidaService partidaService;
    private PartidaRepository partidaRepository;
    private CartaService cartaService;
    private JugadorService jugadorService;
    private SimpMessagingTemplate messagingTemplate;

    private Partida partida;
    private Tablero tablero;
    private Jugador jugador1;
    private Jugador jugador2;
    private Usuario usuario;

    @BeforeEach
    public void setUp() throws Exception {
        partidaRepository = mock(PartidaRepository.class);
        cartaService = mock(CartaService.class);
        jugadorService = mock(JugadorService.class);
        messagingTemplate = mock(SimpMessagingTemplate.class);

        partidaService = new PartidaService();
        injectField(partidaService, "partidaRepository", partidaRepository);
        injectField(partidaService, "cartaService", cartaService);
        injectField(partidaService, "jugadorService", jugadorService);
        injectField(partidaService, "messagingTemplate", messagingTemplate);

        usuario = new Usuario();
        usuario.setUsername("testUser");
        usuario.setPassword("password");

        jugador1 = new Jugador();
        jugador1.setNombre("Jugador1");
        jugador1.setUsuario(usuario);
        setId(jugador1, 1L);

        jugador2 = new Jugador();
        jugador2.setNombre("Jugador2");
        jugador2.setUsuario(usuario);
        setId(jugador2, 2L);

        tablero = new Tablero();
        List<Musa> grid = new ArrayList<>();
        for (TipoMusa tipoMusa : TipoMusa.values()) {
            Musa musa = new Musa();
            musa.setNombre(tipoMusa);
            grid.add(musa);
        }
        tablero.setGrid(grid);
        tablero.setSolPos(0);
        tablero.setLunaPos(4);

        partida = new Partida();
        setId(partida, 1L);
        partida.setRondaActual(1);
        partida.setFechaInicio(LocalDateTime.now());
        partida.setTablero(tablero);
        partida.setJugadores(List.of(jugador1, jugador2));
    }

    // ── CRUD ──────────────────────────────────────────────────────────────────

    @Test
    public void createGuardaYRetornaPartida() {
        when(partidaRepository.save(partida)).thenReturn(partida);

        Partida resultado = partidaService.create(partida);

        assertEquals(partida, resultado);
        verify(partidaRepository).save(partida);
    }

    @Test
    public void getByIdRetornaPartidaCuandoExiste() {
        when(partidaRepository.findById(1L)).thenReturn(Optional.of(partida));

        Partida resultado = partidaService.getById(1L);

        assertNotNull(resultado);
        assertEquals(partida, resultado);
    }

    @Test
    public void getByIdLanzaExcepcionCuandoNoExiste() {
        when(partidaRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> partidaService.getById(99L));
    }

    @Test
    public void getAllRetornaListaDePartidas() {
        Partida otraPartida = new Partida();
        otraPartida.setFechaInicio(LocalDateTime.now());
        when(partidaRepository.findAll()).thenReturn(List.of(partida, otraPartida));

        List<Partida> resultado = partidaService.getAll();

        assertEquals(2, resultado.size());
    }

    @Test
    public void getAllRetornaListaVaciaCuandoNoHayPartidas() {
        when(partidaRepository.findAll()).thenReturn(List.of());

        List<Partida> resultado = partidaService.getAll();

        assertTrue(resultado.isEmpty());
    }

    @Test
    public void updateActualizaPartidaExistente() {
        Partida actualizada = new Partida();
        actualizada.setRondaActual(3);
        actualizada.setMaxRondas(12);
        actualizada.setDuracionTotal(600);
        actualizada.setFechaInicio(LocalDateTime.now());
        actualizada.setTablero(tablero);
        actualizada.setJugadores(List.of(jugador1));

        when(partidaRepository.findById(1L)).thenReturn(Optional.of(partida));
        when(partidaRepository.save(any(Partida.class))).thenReturn(partida);

        Partida resultado = partidaService.update(1L, actualizada);

        assertNotNull(resultado);
        verify(partidaRepository).save(any(Partida.class));
    }

    @Test
    public void updateLanzaExcepcionCuandoPartidaNoExiste() {
        Partida actualizada = new Partida();
        actualizada.setFechaInicio(LocalDateTime.now());
        when(partidaRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> partidaService.update(99L, actualizada));
        verify(partidaRepository, never()).save(any());
    }

    @Test
    public void deleteInvocaDeleteByIdEnRepositorio() {
        doNothing().when(partidaRepository).deleteById(1L);

        partidaService.delete(1L);

        verify(partidaRepository).deleteById(1L);
    }

    @Test
    public void deleteAllInvocaDeleteAllEnRepositorio() {
        doNothing().when(partidaRepository).deleteAll();

        partidaService.deleteAll();

        verify(partidaRepository).deleteAll();
    }

    // ── Métodos de consulta ──────────────────────────────────────────────────

    @Test
    public void getTableroByPartidaRetornaTablero() {
        when(partidaRepository.findById(1L)).thenReturn(Optional.of(partida));

        Tablero resultado = partidaService.getTableroByPartida(1L);

        assertNotNull(resultado);
        assertEquals(tablero, resultado);
    }

    @Test
    public void getTableroByPartidaLanzaExcepcionCuandoPartidaNoExiste() {
        when(partidaRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> partidaService.getTableroByPartida(99L));
    }

    @Test
    public void getJugadoresByPartidaRetornaJugadores() {
        when(partidaRepository.findById(1L)).thenReturn(Optional.of(partida));

        List<Jugador> resultado = partidaService.getJugadoresByPartida(1L);

        assertEquals(2, resultado.size());
    }

    @Test
    public void getJugadoresByPartidaLanzaExcepcionCuandoPartidaNoExiste() {
        when(partidaRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> partidaService.getJugadoresByPartida(99L));
    }

    @Test
    public void getCartasByPartidaRetornaCartasDeInspiracion() {
        CartaInspiracion carta1 = new CartaInspiracion();
        carta1.setNombreMusa(TipoMusa.CLIO);
        CartaInspiracion carta2 = new CartaInspiracion();
        carta2.setNombreMusa(TipoMusa.EUTERPE);

        jugador1.setCartaInspiracion(carta1);
        jugador2.setCartaInspiracion(carta2);

        when(partidaRepository.findById(1L)).thenReturn(Optional.of(partida));

        List<CartaBase> resultado = partidaService.getCartasByPartida(1L);

        assertEquals(2, resultado.size());
    }

    @Test
    public void getCartasByPartidaIgnoraJugadoresSinCartaInspiracion() {
        CartaInspiracion carta1 = new CartaInspiracion();
        carta1.setNombreMusa(TipoMusa.CLIO);
        jugador1.setCartaInspiracion(carta1);
        jugador2.setCartaInspiracion(null);

        when(partidaRepository.findById(1L)).thenReturn(Optional.of(partida));

        List<CartaBase> resultado = partidaService.getCartasByPartida(1L);

        assertEquals(1, resultado.size());
    }

    @Test
    public void getCartasByPartidaLanzaExcepcionCuandoPartidaNoExiste() {
        when(partidaRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> partidaService.getCartasByPartida(99L));
    }

    @Test
    public void getTokensByPartidaRetornaTokensDeTodosLosJugadores() {
        Token token1 = new Token();
        Token token2 = new Token();
        jugador1.setTokens(List.of(token1));
        jugador2.setTokens(List.of(token2));

        when(partidaRepository.findById(1L)).thenReturn(Optional.of(partida));

        List<Token> resultado = partidaService.getTokensByPartida(1L);

        assertEquals(2, resultado.size());
    }

    @Test
    public void getMusasByPartidaRetornaGridDelTablero() {
        when(partidaRepository.findById(1L)).thenReturn(Optional.of(partida));

        List<Musa> resultado = partidaService.getMusasByPartida(1L);

        assertEquals(TipoMusa.values().length, resultado.size());
    }

    @Test
    public void getMusasByPartidaRetornaListaVaciaCuandoTableroSinGrid() {
        tablero.setGrid(null);
        when(partidaRepository.findById(1L)).thenReturn(Optional.of(partida));

        List<Musa> resultado = partidaService.getMusasByPartida(1L);

        assertTrue(resultado.isEmpty());
    }

    @Test
    public void getMusasByPartidaLanzaExcepcionCuandoPartidaNoExiste() {
        when(partidaRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> partidaService.getMusasByPartida(99L));
    }

    @Test
    public void getByJugadorIdRetornaPartida() {
        when(partidaRepository.findByJugadoresId(1L)).thenReturn(Optional.of(partida));

        Partida resultado = partidaService.getByJugadorId(1L);

        assertNotNull(resultado);
        assertEquals(partida, resultado);
    }

    @Test
    public void getByJugadorIdLanzaExcepcionCuandoNoExiste() {
        when(partidaRepository.findByJugadoresId(99L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> partidaService.getByJugadorId(99L));
    }

    // ── Selección de cartas ──────────────────────────────────────────────────

    @Test
    public void seleccionarCartaGuardaSeleccionEnPartida() {
        when(partidaRepository.findById(1L)).thenReturn(Optional.of(partida));
        when(jugadorService.getById(1L)).thenReturn(jugador1);
        when(partidaRepository.save(any(Partida.class))).thenReturn(partida);

        partidaService.seleccionarCarta(1L, 1L, 10L);

        assertEquals(10L, partida.getSeleccionesRonda().get(1L));
    }

    @Test
    public void seleccionarCartaNoEjecutaEfectosSiFaltanJugadores() {
        when(partidaRepository.findById(1L)).thenReturn(Optional.of(partida));
        when(jugadorService.getById(1L)).thenReturn(jugador1);
        when(partidaRepository.save(any(Partida.class))).thenReturn(partida);

        partidaService.seleccionarCarta(1L, 1L, 10L);

        verifyNoInteractions(messagingTemplate);
        verify(cartaService, never()).ejecutarEfecto(any(), any(), any());
    }

    @Test
    public void seleccionarCartaEjecutaEfectosCuandoTodosSeleccionan() {
        CartaAccion cartaDevocion = new CartaAccion();
        cartaDevocion.setTipo(TipoAccion.DEVOCION_SOL);
        setId(cartaDevocion, 10L);

        partida.getSeleccionesRonda().put(1L, 10L);

        when(partidaRepository.findById(1L)).thenReturn(Optional.of(partida));
        when(jugadorService.getById(2L)).thenReturn(jugador2);
        when(partidaRepository.save(any(Partida.class))).thenReturn(partida);
        when(cartaService.getById(10L)).thenReturn(cartaDevocion);

        partidaService.seleccionarCarta(1L, 2L, 10L);

        verify(cartaService).ejecutarEfecto(eq(cartaDevocion), eq(tablero), eq(jugador2));
        verify(messagingTemplate).convertAndSend(
                eq("/topic/partida/1/cartas-seleccionadas"),
                anyList());
    }

    @Test
    public void seleccionarCartaNotificaWebSocketAnteDeEjecutarEfectos() {
        CartaAccion carta = new CartaAccion();
        carta.setTipo(TipoAccion.REVOLUCION_SOL);
        setId(carta, 10L);

        partida.getSeleccionesRonda().put(1L, 10L);

        when(partidaRepository.findById(1L)).thenReturn(Optional.of(partida));
        when(jugadorService.getById(2L)).thenReturn(jugador2);
        when(partidaRepository.save(any(Partida.class))).thenReturn(partida);
        when(cartaService.getById(10L)).thenReturn(carta);

        var inOrder = inOrder(messagingTemplate, cartaService);

        partidaService.seleccionarCarta(1L, 2L, 10L);

        inOrder.verify(messagingTemplate).convertAndSend(anyString(), anyList());
        inOrder.verify(cartaService).ejecutarEfecto(any(), any(), any());
    }

    // ── obtenerCartasOrdenadas (via reflection) ──────────────────────────────

    @Test
    public void obtenerCartasOrdenadasDevuelveCartaConMasVotosPrimero() throws Exception {
        CartaAccion cartaDevocion = new CartaAccion();
        cartaDevocion.setTipo(TipoAccion.DEVOCION_SOL);
        setId(cartaDevocion, 10L);

        CartaAccion cartaRevolucion = new CartaAccion();
        cartaRevolucion.setTipo(TipoAccion.REVOLUCION_SOL);
        setId(cartaRevolucion, 20L);

        when(cartaService.getById(10L)).thenReturn(cartaDevocion);
        when(cartaService.getById(20L)).thenReturn(cartaRevolucion);

        // 3 votos para carta 10, 1 voto para carta 20
        Map<Long, Long> selecciones = new HashMap<>();
        selecciones.put(1L, 10L);
        selecciones.put(2L, 10L);
        selecciones.put(3L, 10L);
        selecciones.put(4L, 20L);

        List<CartaBase> resultado = invokeObtenerCartasOrdenadas(selecciones);

        assertEquals(2, resultado.size());
        assertEquals(cartaDevocion, resultado.get(0));
        assertEquals(cartaRevolucion, resultado.get(1));
    }

    @Test
    public void obtenerCartasOrdenadasConCartaUnica() throws Exception {
        CartaAccion carta = new CartaAccion();
        carta.setTipo(TipoAccion.DEVOCION_SOL);
        setId(carta, 10L);

        when(cartaService.getById(10L)).thenReturn(carta);

        Map<Long, Long> selecciones = new HashMap<>();
        selecciones.put(1L, 10L);
        selecciones.put(2L, 10L);

        List<CartaBase> resultado = invokeObtenerCartasOrdenadas(selecciones);

        assertEquals(1, resultado.size());
        assertEquals(carta, resultado.get(0));
    }

    @Test
    public void obtenerCartasOrdenadasConTresCartasDistintas() throws Exception {
        CartaAccion carta1 = new CartaAccion();
        carta1.setTipo(TipoAccion.DEVOCION_SOL);
        setId(carta1, 10L);

        CartaAccion carta2 = new CartaAccion();
        carta2.setTipo(TipoAccion.REVOLUCION_SOL);
        setId(carta2, 20L);

        CartaInspiracion carta3 = new CartaInspiracion();
        carta3.setNombreMusa(TipoMusa.CALIOPE);
        setId(carta3, 30L);

        when(cartaService.getById(10L)).thenReturn(carta1);
        when(cartaService.getById(20L)).thenReturn(carta2);
        when(cartaService.getById(30L)).thenReturn(carta3);

        // carta2 tiene 3 votos, carta1 tiene 2, carta3 tiene 1
        Map<Long, Long> selecciones = new HashMap<>();
        selecciones.put(1L, 20L);
        selecciones.put(2L, 20L);
        selecciones.put(3L, 20L);
        selecciones.put(4L, 10L);
        selecciones.put(5L, 10L);
        selecciones.put(6L, 30L);

        List<CartaBase> resultado = invokeObtenerCartasOrdenadas(selecciones);

        assertEquals(3, resultado.size());
        assertEquals(carta2, resultado.get(0));
        assertEquals(carta1, resultado.get(1));
        assertEquals(carta3, resultado.get(2));
    }

    @Test
    public void obtenerCartasOrdenadasConEmpateDevuelveAmbas() throws Exception {
        CartaAccion carta1 = new CartaAccion();
        carta1.setTipo(TipoAccion.DEVOCION_SOL);
        setId(carta1, 10L);

        CartaAccion carta2 = new CartaAccion();
        carta2.setTipo(TipoAccion.REVOLUCION_LUNA);
        setId(carta2, 20L);

        when(cartaService.getById(10L)).thenReturn(carta1);
        when(cartaService.getById(20L)).thenReturn(carta2);

        // Empate: 2 votos cada una
        Map<Long, Long> selecciones = new HashMap<>();
        selecciones.put(1L, 10L);
        selecciones.put(2L, 10L);
        selecciones.put(3L, 20L);
        selecciones.put(4L, 20L);

        List<CartaBase> resultado = invokeObtenerCartasOrdenadas(selecciones);

        assertEquals(2, resultado.size());
    }

    // ── todosJugadoresHanSeleccionadoCarta (via reflection) ──────────────────

    @Test
    public void todosHanSeleccionadoRetornaTrueCuandoTodosSeleccionaron() throws Exception {
        partida.getSeleccionesRonda().put(1L, 10L);
        partida.getSeleccionesRonda().put(2L, 20L);

        boolean resultado = invokeTodosJugadoresHanSeleccionadoCarta(partida);

        assertTrue(resultado);
    }

    @Test
    public void todosHanSeleccionadoRetornaFalseCuandoFaltanJugadores() throws Exception {
        partida.getSeleccionesRonda().put(1L, 10L);

        boolean resultado = invokeTodosJugadoresHanSeleccionadoCarta(partida);

        assertFalse(resultado);
    }

    @Test
    public void todosHanSeleccionadoRetornaFalseCuandoNadieSelecciono() throws Exception {
        boolean resultado = invokeTodosJugadoresHanSeleccionadoCarta(partida);

        assertFalse(resultado);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    @SuppressWarnings("unchecked")
    private List<CartaBase> invokeObtenerCartasOrdenadas(Map<Long, Long> selecciones) throws Exception {
        Method method = PartidaService.class.getDeclaredMethod("obtenerCartasOrdenadas", Map.class);
        method.setAccessible(true);
        return (List<CartaBase>) method.invoke(partidaService, selecciones);
    }

    private boolean invokeTodosJugadoresHanSeleccionadoCarta(Partida partida) throws Exception {
        Method method = PartidaService.class.getDeclaredMethod("todosJugadoresHanSeleccionadoCarta", Partida.class);
        method.setAccessible(true);
        return (boolean) method.invoke(partidaService, partida);
    }

    private void setId(Object entity, Long id) {
        try {
            Field field = getFieldInHierarchy(entity.getClass(), "id");
            field.setAccessible(true);
            field.set(entity, id);
        } catch (Exception ignored) {
        }
    }

    private void injectField(Object target, String fieldName, Object value) throws Exception {
        Field field = getFieldInHierarchy(target.getClass(), fieldName);
        field.setAccessible(true);
        field.set(target, value);
    }

    private Field getFieldInHierarchy(Class<?> clazz, String fieldName) throws NoSuchFieldException {
        while (clazz != null) {
            try {
                return clazz.getDeclaredField(fieldName);
            } catch (NoSuchFieldException e) {
                clazz = clazz.getSuperclass();
            }
        }
        throw new NoSuchFieldException("Field '" + fieldName + "' not found");
    }
}
