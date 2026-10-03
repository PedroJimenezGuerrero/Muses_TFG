package tfg.muses.bot;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import java.lang.reflect.Field;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import tfg.muses.carta.CartaAccion;
import tfg.muses.carta.CartaBase;
import tfg.muses.carta.CartaInspiracion;
import tfg.muses.carta.CartaService;
import tfg.muses.carta.TipoAccion;
import tfg.muses.carta.strategy.InspiracionEffectStrategy;
import tfg.muses.carta.strategy.inspiracion.InspiracionMusaStrategy;
import tfg.muses.jugador.Jugador;
import tfg.muses.jugador.JugadorService;
import tfg.muses.musa.Musa;
import tfg.muses.musa.TipoMusa;
import tfg.muses.partida.Partida;
import tfg.muses.partida.PartidaService;
import tfg.muses.puntuacion.PuntuacionService;
import tfg.muses.tablero.Tablero;
import tfg.muses.tablero.TableroService;
import tfg.muses.token.Token;
import tfg.muses.usuario.Usuario;

public class BotServiceTest {

    private BotServiceImpl botService;

    private PartidaService partidaService;
    private TableroService tableroService;
    private PuntuacionService puntuacionService;
    private CartaService cartaService;
    private JugadorService jugadorService;

    private Partida partida;
    private Tablero tablero;
    private Jugador botJugador;
    private Jugador rivalJugador;

    private CartaAccion cartaDevocionSol;
    private CartaAccion cartaDevocionLuna;
    private CartaAccion cartaRevolucionSol;
    private CartaAccion cartaRevolucionLuna;

    @BeforeEach
    public void setUp() throws Exception {
        partidaService = mock(PartidaService.class);
        tableroService = mock(TableroService.class);
        puntuacionService = mock(PuntuacionService.class);
        cartaService = mock(CartaService.class);
        jugadorService = mock(JugadorService.class);

        botService = new BotServiceImpl();
        injectField(botService, "partidaService", partidaService);
        injectField(botService, "tableroService", tableroService);
        injectField(botService, "puntuacionService", puntuacionService);
        injectField(botService, "cartaService", cartaService);
        injectField(botService, "jugadorService", jugadorService);

        // Cartas de acción comunes
        cartaDevocionSol = buildCartaAccion(101L, TipoAccion.DEVOCION_SOL);
        cartaDevocionLuna = buildCartaAccion(102L, TipoAccion.DEVOCION_LUNA);
        cartaRevolucionSol = buildCartaAccion(103L, TipoAccion.REVOLUCION_SOL);
        cartaRevolucionLuna = buildCartaAccion(104L, TipoAccion.REVOLUCION_LUNA);

        when(cartaService.getAll()).thenReturn(List.of(
                cartaDevocionSol, cartaDevocionLuna, cartaRevolucionSol, cartaRevolucionLuna
        ));

        // Configuración de jugadores
        Usuario uBot = buildUsuario(1L, "Bot_Alpha");
        botJugador = buildJugador(1L, "Bot", uBot, 20, 0);

        Usuario uRival = buildUsuario(2L, "Humano");
        rivalJugador = buildJugador(2L, "Rival", uRival, 20, 0);

        // Tablero y Musas
        tablero = new Tablero();
        setId(tablero, 1L);
        List<Musa> grid = new ArrayList<>();
        for (TipoMusa tm : TipoMusa.values()) {
            grid.add(buildMusa(grid.size() + 1L, tm));
        }
        tablero.setGrid(grid);
        tablero.setSolPos(0);
        tablero.setLunaPos(4);

        partida = new Partida();
        setId(partida, 1L);
        partida.setRondaActual(1);
        partida.setMaxRondas(9);
        partida.setFechaInicio(LocalDateTime.now());
        partida.setTablero(tablero);
        partida.setJugadores(new ArrayList<>(List.of(botJugador, rivalJugador)));
        partida.setSeleccionesRonda(new HashMap<>());
    }

    // =========================================================================
    // 1. HEURÍSTICA DE DEVOCIÓN CODICIOSA (GREEDY)
    // =========================================================================

    @Nested
    @DisplayName("Pruebas de Heurística Codiciosa de Devoción")
    class HeuristicaDevocionTests {

        @Test
        @DisplayName("El bot selecciona Devoción Sol cuando Melpómene (9 pts N1) está en Sol y Terpsícore (5 pts N1) en Luna")
        void calcularMejorJugada_seleccionaDevocionSol_cuandoMelpomeneEnSolYTerpsicoreEnLuna() {
            Musa musaSol = buildMusa(1L, TipoMusa.MELPOMENE);   // 9, 6, 3 pts
            Musa musaLuna = buildMusa(2L, TipoMusa.TERPSICORE); // 5, 4, 3 pts

            when(tableroService.getMusasEnAstros(tablero)).thenReturn(Map.of(
                    "sol", musaSol,
                    "luna", musaLuna
            ));

            // Desactivar carta de inspiración del bot para aislar devoción
            botJugador.setCartaInspiracion(null);

            CartaBase jugada = botService.calcularMejorJugada(partida, botJugador);

            assertNotNull(jugada);
            assertTrue(jugada instanceof CartaAccion);
            CartaAccion accion = (CartaAccion) jugada;
            assertEquals(TipoAccion.DEVOCION_SOL, accion.getTipo());
        }

        @Test
        @DisplayName("El bot selecciona Devoción Luna cuando Melpómene (9 pts N1) está en Luna y Terpsícore (5 pts N1) en Sol")
        void calcularMejorJugada_seleccionaDevocionLuna_cuandoMelpomeneEnLunaYTerpsicoreEnSol() {
            Musa musaSol = buildMusa(1L, TipoMusa.TERPSICORE); // 5 pts N1
            Musa musaLuna = buildMusa(2L, TipoMusa.MELPOMENE);  // 9 pts N1

            when(tableroService.getMusasEnAstros(tablero)).thenReturn(Map.of(
                    "sol", musaSol,
                    "luna", musaLuna
            ));

            botJugador.setCartaInspiracion(null);

            CartaBase jugada = botService.calcularMejorJugada(partida, botJugador);

            assertNotNull(jugada);
            assertTrue(jugada instanceof CartaAccion);
            assertEquals(TipoAccion.DEVOCION_LUNA, ((CartaAccion) jugada).getTipo());
        }

        @Test
        @DisplayName("Desempate por prioridad oficial cuando las dos musas en astros ofrecen igual puntuación de Nivel 1")
        void calcularMejorJugada_desempataPorPrioridad_cuandoNivel1EsIgual() {
            // Talía (8 pts) en Sol y Calíope (8 pts) en Luna
            Musa musaSol = buildMusa(1L, TipoMusa.TALIA);
            Musa musaLuna = buildMusa(2L, TipoMusa.CALIOPE);

            when(tableroService.getMusasEnAstros(tablero)).thenReturn(Map.of(
                    "sol", musaSol,
                    "luna", musaLuna
            ));

            botJugador.setCartaInspiracion(null);

            CartaBase jugada = botService.calcularMejorJugada(partida, botJugador);

            assertNotNull(jugada);
            assertTrue(jugada instanceof CartaAccion);
            // Devoción Sol (prioridad 2) vence a Devoción Luna (prioridad 5)
            assertEquals(TipoAccion.DEVOCION_SOL, ((CartaAccion) jugada).getTipo());
        }
    }

    // =========================================================================
    // 2. DISPARO Y RESTRICCIONES DE CARTA DE INSPIRACIÓN
    // =========================================================================

    @Nested
    @DisplayName("Pruebas de Carta de Inspiración y Geometría Astral")
    class CartaInspiracionTests {

        @Test
        @DisplayName("El bot selecciona Carta de Inspiración de VÉRTICES cuando Sol está en posición par y no está usada")
        void calcularMejorJugada_seleccionaInspiracion_cuandoAlineacionVerticesCoincide() {
            CartaInspiracion cartaInsp = buildCartaInspiracion(201L, TipoMusa.TERPSICORE, false); // VERTICES
            botJugador.setCartaInspiracion(cartaInsp);

            tablero.setSolPos(0); // 0 % 2 == 0 -> VERTICES

            CartaBase jugada = botService.calcularMejorJugada(partida, botJugador);

            assertNotNull(jugada);
            assertTrue(jugada instanceof CartaInspiracion);
            assertEquals(TipoMusa.TERPSICORE, ((CartaInspiracion) jugada).getNombreMusa());
            assertEquals(201L, jugada.getId());
        }

        @Test
        @DisplayName("El bot selecciona Carta de Inspiración de LADOS cuando Sol está en posición impar y no está usada")
        void calcularMejorJugada_seleccionaInspiracion_cuandoAlineacionLadosCoincide() {
            CartaInspiracion cartaInsp = buildCartaInspiracion(202L, TipoMusa.MELPOMENE, false); // LADOS
            botJugador.setCartaInspiracion(cartaInsp);

            tablero.setSolPos(1); // 1 % 2 != 0 -> LADOS

            CartaBase jugada = botService.calcularMejorJugada(partida, botJugador);

            assertNotNull(jugada);
            assertTrue(jugada instanceof CartaInspiracion);
            assertEquals(TipoMusa.MELPOMENE, ((CartaInspiracion) jugada).getNombreMusa());
            assertEquals(202L, jugada.getId());
        }

        @Test
        @DisplayName("No selecciona Carta de Inspiración si ya fue usada, aunque los astros coincidan")
        void calcularMejorJugada_noSeleccionaInspiracion_cuandoYaFueUsada() {
            CartaInspiracion cartaInsp = buildCartaInspiracion(201L, TipoMusa.TERPSICORE, true); // usada = true
            botJugador.setCartaInspiracion(cartaInsp);

            tablero.setSolPos(0); // Posición válida para VERTICES

            Musa musaSol = buildMusa(1L, TipoMusa.CLIO);
            Musa musaLuna = buildMusa(2L, TipoMusa.URANIA);
            when(tableroService.getMusasEnAstros(tablero)).thenReturn(Map.of("sol", musaSol, "luna", musaLuna));

            CartaBase jugada = botService.calcularMejorJugada(partida, botJugador);

            assertNotNull(jugada);
            assertFalse(jugada instanceof CartaInspiracion);
            assertTrue(jugada instanceof CartaAccion);
        }

        @Test
        @DisplayName("No selecciona Carta de Inspiración si la posición de los astros no coincide con el tipo geométrico")
        void calcularMejorJugada_noSeleccionaInspiracion_cuandoAlineacionAstroNoCoincide() {
            CartaInspiracion cartaInsp = buildCartaInspiracion(201L, TipoMusa.TERPSICORE, false); // Requiere VERTICES
            botJugador.setCartaInspiracion(cartaInsp);

            tablero.setSolPos(1); // Impar: corresponde a LADOS

            Musa musaSol = buildMusa(1L, TipoMusa.CLIO);
            Musa musaLuna = buildMusa(2L, TipoMusa.URANIA);
            when(tableroService.getMusasEnAstros(tablero)).thenReturn(Map.of("sol", musaSol, "luna", musaLuna));

            CartaBase jugada = botService.calcularMejorJugada(partida, botJugador);

            assertNotNull(jugada);
            assertFalse(jugada instanceof CartaInspiracion);
            assertTrue(jugada instanceof CartaAccion);
        }
    }

    // =========================================================================
    // 3. FALLBACK ANTE AGOTAMIENTO DE FICHAS DE DEVOCIÓN
    // =========================================================================

    @Nested
    @DisplayName("Pruebas de Fallback ante Agotamiento de Recursos")
    class FallbackRecursosTests {

        @Test
        @DisplayName("El bot recurre a cartas de revolución cuando sus fichas de devoción están agotadas (0 libres)")
        void calcularMejorJugada_fallbackARevolucion_cuandoTokensAgotados() {
            // Marcar todos los tokens como colocados
            for (Token t : botJugador.getTokens()) {
                t.setColocado(true);
            }
            botJugador.setCartaInspiracion(null);

            Musa musaSol = buildMusa(1L, TipoMusa.MELPOMENE);
            Musa musaLuna = buildMusa(2L, TipoMusa.CLIO);
            when(tableroService.getMusasEnAstros(tablero)).thenReturn(Map.of("sol", musaSol, "luna", musaLuna));

            CartaBase jugada = botService.calcularMejorJugada(partida, botJugador);

            assertNotNull(jugada);
            assertTrue(jugada instanceof CartaAccion);
            CartaAccion accion = (CartaAccion) jugada;
            assertTrue(accion.getTipo() == TipoAccion.REVOLUCION_SOL || accion.getTipo() == TipoAccion.REVOLUCION_LUNA,
                    "Debe recurrir a revolución al no poder colocar fichas de devoción");
        }

        @Test
        @DisplayName("El bot opera coherentemente con 1 ficha restante sin lanzar excepción")
        void calcularMejorJugada_operaSinFallo_conUnTokenDisponible() {
            for (int i = 0; i < botJugador.getTokens().size(); i++) {
                botJugador.getTokens().get(i).setColocado(i != 0); // Solo el índice 0 no colocado
            }
            botJugador.setCartaInspiracion(null);

            Musa musaSol = buildMusa(1L, TipoMusa.MELPOMENE);
            Musa musaLuna = buildMusa(2L, TipoMusa.CLIO);
            when(tableroService.getMusasEnAstros(tablero)).thenReturn(Map.of("sol", musaSol, "luna", musaLuna));

            assertDoesNotThrow(() -> {
                CartaBase jugada = botService.calcularMejorJugada(partida, botJugador);
                assertNotNull(jugada);
            });
        }

        @Test
        @DisplayName("El bot resuelve cartas con ID persistido incluso si cartaService.getAll() está vacío")
        void obtenerCartasCandidatas_recuperaCartasConId_cuandoGetAllVacio() {
            when(cartaService.getAll()).thenReturn(List.of());
            when(cartaService.obtenerOCrearCartaAccion(any(TipoAccion.class))).thenAnswer(inv -> {
                TipoAccion t = inv.getArgument(0);
                return buildCartaAccion(500L + t.ordinal(), t);
            });

            List<CartaBase> candidatas = botService.obtenerCartasCandidatas(partida, botJugador);

            assertFalse(candidatas.isEmpty());
            assertTrue(candidatas.stream().allMatch(c -> c.getId() != null));
        }
    }

    // =========================================================================
    // 4. EJECUCIÓN AUTOMATIZADA DEL TURNO E IDEMPOTENCIA
    // =========================================================================

    @Nested
    @DisplayName("Pruebas de Ejecución Automatizada de Turno")
    class EjecutarTurnoTests {

        @Test
        @DisplayName("ejecutarTurnoBot invoca partidaService.seleccionarCarta con la jugada calculada")
        void ejecutarTurnoBot_registraCartaSeleccionadaEnPartida() {
            Musa musaSol = buildMusa(1L, TipoMusa.MELPOMENE);
            Musa musaLuna = buildMusa(2L, TipoMusa.TERPSICORE);
            when(tableroService.getMusasEnAstros(tablero)).thenReturn(Map.of("sol", musaSol, "luna", musaLuna));
            botJugador.setCartaInspiracion(null);

            botService.ejecutarTurnoBot(partida, botJugador);

            verify(partidaService, times(1)).seleccionarCarta(eq(partida.getId()), eq(botJugador.getId()), eq(cartaDevocionSol.getId()));
        }

        @Test
        @DisplayName("ejecutarTurnoBot es idempotente: no vuelve a seleccionar si el bot ya votó en la ronda")
        void ejecutarTurnoBot_esIdempotente_noEjecutaSiYaVoto() {
            partida.getSeleccionesRonda().put(botJugador.getId(), cartaDevocionSol.getId());

            botService.ejecutarTurnoBot(partida, botJugador);

            verify(partidaService, never()).seleccionarCarta(anyLong(), anyLong(), anyLong());
        }

        @Test
        @DisplayName("ejecutarTurnoBot tolera referencias nulas sin lanzar excepciones")
        void ejecutarTurnoBot_toleraArgumentosNulos() {
            assertDoesNotThrow(() -> botService.ejecutarTurnoBot(null, botJugador));
            assertDoesNotThrow(() -> botService.ejecutarTurnoBot(partida, null));
            assertDoesNotThrow(() -> botService.ejecutarTurnoBot(null, null));
            verify(partidaService, never()).seleccionarCarta(anyLong(), anyLong(), anyLong());
        }
    }

    // =========================================================================
    // 5. TOLERANCIA ANTE ENTRADAS NULAS EN CALCULAR MEJOR JUGADA
    // =========================================================================

    @Nested
    @DisplayName("Pruebas de Tolerancia a Nulos en Heurística")
    class ToleranciaNulosTests {

        @Test
        @DisplayName("calcularMejorJugada retorna null de forma segura ante entradas nulas")
        void calcularMejorJugada_retornaNull_conEntradasNulas() {
            assertNull(botService.calcularMejorJugada(null, botJugador));
            assertNull(botService.calcularMejorJugada(partida, null));
            assertNull(botService.calcularMejorJugada(null, null));
        }
    }

    // =========================================================================
    // 6. CORRECCIÓN DE BUG EN INSPIRACION EFFECT STRATEGY
    // =========================================================================

    @Nested
    @DisplayName("Pruebas de Corrección de Bug en InspiracionEffectStrategy")
    class InspiracionBugFixTests {

        @Test
        @DisplayName("Al ejecutarse la estrategia de inspiración, la carta pasa a usada = true y posterior uso falla")
        void execute_marcaCartaComoUsada_yPrevieneReutilizacion() throws Exception {
            InspiracionEffectStrategy strategy = new InspiracionEffectStrategy();
            InspiracionMusaStrategy musaStrategy = mock(InspiracionMusaStrategy.class);
            when(musaStrategy.supports(any())).thenReturn(true);
            injectField(strategy, "strategies", List.of(musaStrategy));

            CartaInspiracion carta = buildCartaInspiracion(201L, TipoMusa.TERPSICORE, false);
            tablero.setSolPos(0); // VERTICES (par)

            assertFalse(carta.isUsada());

            strategy.execute(carta, tablero, botJugador);

            assertTrue(carta.isUsada(), "La carta debe quedar marcada como usada tras la ejecución exitosa");
            verify(musaStrategy, times(1)).execute(eq(carta), eq(tablero), eq(botJugador));

            // Intentar reusarla debe lanzar IllegalStateException
            IllegalStateException ex = assertThrows(IllegalStateException.class,
                    () -> strategy.execute(carta, tablero, botJugador));
            assertEquals("Esta carta de inspiración ya ha sido usada", ex.getMessage());
        }
    }

    // =========================================================================
    // 7. MÉTODOS AUXILIARES (FIXTURES & REFLECTION)
    // =========================================================================

    private Usuario buildUsuario(Long id, String username) {
        Usuario u = new Usuario();
        setId(u, id);
        u.setUsername(username);
        return u;
    }

    private Jugador buildJugador(Long id, String nombre, Usuario usuario, int totalTokens, int tokensColocados) {
        Jugador j = new Jugador();
        setId(j, id);
        j.setNombre(nombre);
        j.setUsuario(usuario);
        List<Token> tokens = new ArrayList<>();
        for (int i = 0; i < totalTokens; i++) {
            Token t = new Token();
            setId(t, (long) (i + 1));
            t.setJugador(j);
            t.setColocado(i < tokensColocados);
            tokens.add(t);
        }
        j.setTokens(tokens);
        return j;
    }

    private Musa buildMusa(Long id, TipoMusa tipo) {
        Musa m = new Musa();
        setId(m, id);
        m.setNombre(tipo);
        m.setTokensColocados(new ArrayList<>());
        return m;
    }

    private CartaAccion buildCartaAccion(Long id, TipoAccion tipo) {
        CartaAccion c = new CartaAccion();
        setId(c, id);
        c.setTipo(tipo);
        c.setNombre(tipo.name());
        c.setDescripcion("Carta de acción " + tipo.name());
        return c;
    }

    private CartaInspiracion buildCartaInspiracion(Long id, TipoMusa tipoMusa, boolean usada) {
        CartaInspiracion c = new CartaInspiracion();
        setId(c, id);
        c.setNombreMusa(tipoMusa);
        c.setUsada(usada);
        c.setNombre("Inspiración de " + tipoMusa.name());
        c.setDescripcion("Efecto de inspiración");
        return c;
    }

    private void setId(Object entity, Long id) {
        try {
            Field field = getFieldInHierarchy(entity.getClass(), "id");
            field.setAccessible(true);
            field.set(entity, id);
        } catch (Exception e) {
            throw new RuntimeException("Error asignando ID por reflexión", e);
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
        throw new NoSuchFieldException("Campo '" + fieldName + "' no encontrado");
    }
}
