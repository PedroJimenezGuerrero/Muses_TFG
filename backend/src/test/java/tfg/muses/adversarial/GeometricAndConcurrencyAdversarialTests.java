package tfg.muses.adversarial;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import java.lang.reflect.Field;
import java.lang.reflect.Method;
import java.security.InvalidParameterException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.dao.OptimisticLockingFailureException;
import org.springframework.resilience.annotation.Retryable;
import org.springframework.transaction.annotation.Transactional;

import tfg.muses.bot.BotService;
import tfg.muses.bot.BotServiceImpl;
import tfg.muses.carta.CartaAccion;
import tfg.muses.carta.CartaBase;
import tfg.muses.carta.CartaInspiracion;
import tfg.muses.carta.CartaService;
import tfg.muses.carta.TipoAccion;
import tfg.muses.carta.strategy.InspiracionEffectStrategy;
import tfg.muses.carta.strategy.inspiracion.InspiracionCaliopeStrategy;
import tfg.muses.carta.strategy.inspiracion.InspiracionClioStrategy;
import tfg.muses.carta.strategy.inspiracion.InspiracionEratoStrategy;
import tfg.muses.carta.strategy.inspiracion.InspiracionEuterpeStrategy;
import tfg.muses.carta.strategy.inspiracion.InspiracionMelpomeneStrategy;
import tfg.muses.carta.strategy.inspiracion.InspiracionMusaStrategy;
import tfg.muses.carta.strategy.inspiracion.InspiracionPolimniaStrategy;
import tfg.muses.carta.strategy.inspiracion.InspiracionTaliaStrategy;
import tfg.muses.carta.strategy.inspiracion.InspiracionTerpsicoreStrategy;
import tfg.muses.carta.strategy.inspiracion.InspiracionUraniaStrategy;
import tfg.muses.jugador.Jugador;
import tfg.muses.musa.Musa;
import tfg.muses.musa.MusaService;
import tfg.muses.musa.TipoInspiracion;
import tfg.muses.musa.TipoMusa;
import tfg.muses.partida.Partida;
import tfg.muses.partida.PartidaService;
import tfg.muses.puntuacion.PuntuacionService;
import tfg.muses.tablero.Tablero;
import tfg.muses.tablero.TableroService;
import tfg.muses.token.Token;
import tfg.muses.usuario.Usuario;

/**
 * Adversarial Empirical Verification Suite for Milestone 1 Challenger 2.
 * Strictly verifies:
 * 1. Geometric pattern alignment across all 8 perimeter positions (0..7) for VERTICES vs LADOS.
 * 2. CartaInspiracion lifecycle: permanent usada=true transition and rejection of re-use.
 * 3. Concurrency safety: absence of @Transactional on BotService preserving @Retryable resilience.
 */
public class GeometricAndConcurrencyAdversarialTests {

    private BotServiceImpl botService;
    private PartidaService partidaService;
    private TableroService tableroService;
    private PuntuacionService puntuacionService;
    private CartaService cartaService;
    private MusaService musaService;

    private InspiracionEffectStrategy inspiracionEffectStrategy;
    private List<InspiracionMusaStrategy> musaStrategies;

    private Partida partida;
    private Tablero tablero;
    private Jugador botJugador;
    private Usuario botUsuario;

    @BeforeEach
    void setUp() throws Exception {
        botService = new BotServiceImpl();

        partidaService = mock(PartidaService.class);
        tableroService = mock(TableroService.class);
        puntuacionService = mock(PuntuacionService.class);
        cartaService = mock(CartaService.class);
        musaService = mock(MusaService.class);

        injectField(botService, "partidaService", partidaService);
        injectField(botService, "tableroService", tableroService);
        injectField(botService, "puntuacionService", puntuacionService);
        injectField(botService, "cartaService", cartaService);

        // Configuración de estrategias de inspiración
        musaStrategies = new ArrayList<>();
        musaStrategies.add(createMusaStrategy(new InspiracionUraniaStrategy()));
        musaStrategies.add(createMusaStrategy(new InspiracionTerpsicoreStrategy()));
        musaStrategies.add(createMusaStrategy(new InspiracionEratoStrategy()));
        musaStrategies.add(createMusaStrategy(new InspiracionPolimniaStrategy()));
        musaStrategies.add(createMusaStrategy(new InspiracionClioStrategy()));
        musaStrategies.add(createMusaStrategy(new InspiracionEuterpeStrategy()));
        musaStrategies.add(createMusaStrategy(new InspiracionTaliaStrategy()));
        musaStrategies.add(createMusaStrategy(new InspiracionMelpomeneStrategy()));
        musaStrategies.add(createMusaStrategy(new InspiracionCaliopeStrategy()));

        inspiracionEffectStrategy = new InspiracionEffectStrategy();
        injectField(inspiracionEffectStrategy, "strategies", musaStrategies);

        // Estado base del juego
        botUsuario = new Usuario();
        setId(botUsuario, 100L);
        botUsuario.setUsername("BotOmega");

        botJugador = new Jugador();
        setId(botJugador, 1L);
        botJugador.setNombre("BotOmega");
        botJugador.setUsuario(botUsuario);
        botJugador.setEsBot(true);

        List<Token> tokens = new ArrayList<>();
        for (int i = 0; i < 20; i++) {
            Token t = new Token();
            setId(t, (long) (i + 1));
            t.setJugador(botJugador);
            t.setColocado(false);
            tokens.add(t);
        }
        botJugador.setTokens(tokens);

        tablero = new Tablero();
        setId(tablero, 10L);
        tablero.setSolPos(0);
        tablero.setLunaPos(4);

        List<Musa> grid = new ArrayList<>();
        TipoMusa[] musas = TipoMusa.values();
        for (int i = 0; i < 9; i++) {
            Musa m = new Musa();
            setId(m, (long) (i + 1));
            m.setNombre(musas[i]);
            m.setTokensColocados(new ArrayList<>());
            grid.add(m);
        }
        tablero.setGrid(grid);

        partida = new Partida();
        setId(partida, 50L);
        partida.setTablero(tablero);
        partida.setJugadores(List.of(botJugador));
        partida.setRondaActual(1);
        partida.setSeleccionesRonda(new HashMap<>());
    }

    private <T extends InspiracionMusaStrategy> T createMusaStrategy(T strategy) throws Exception {
        injectField(strategy, "musaService", musaService);
        return strategy;
    }

    // =========================================================================
    // DIMENSIÓN 1: ALINEAMIENTO GEOMÉTRICO (0..7 vs VERTICES y LADOS)
    // =========================================================================

    @Nested
    @DisplayName("Dimensión 1: Alineamiento Geométrico de Posiciones Astro (0..7)")
    class GeometricAlignmentTests {

        private final int[] POSICIONES_VERTICES = {0, 2, 4, 6};
        private final int[] POSICIONES_LADOS = {1, 3, 5, 7};

        private final TipoMusa[] MUSAS_VERTICES = {
            TipoMusa.URANIA, TipoMusa.TERPSICORE, TipoMusa.ERATO, TipoMusa.POLIMNIA
        };

        private final TipoMusa[] MUSAS_LADOS = {
            TipoMusa.CLIO, TipoMusa.EUTERPE, TipoMusa.TALIA, TipoMusa.MELPOMENE, TipoMusa.CALIOPE
        };

        @Test
        @DisplayName("Verificación exhaustiva: Posiciones 0..7 mapean estrictamente a VERTICES (pares) y LADOS (impares)")
        void verificarBifurcacionGeometricaExacta() throws Exception {
            Method metodoPosicion = InspiracionEffectStrategy.class.getDeclaredMethod("posicionAstros", Tablero.class);
            metodoPosicion.setAccessible(true);

            for (int pos = 0; pos < 8; pos++) {
                tablero.setSolPos(pos);
                TipoInspiracion tipoResultante = (TipoInspiracion) metodoPosicion.invoke(inspiracionEffectStrategy, tablero);

                if (pos % 2 == 0) {
                    assertEquals(TipoInspiracion.VERTICES, tipoResultante,
                            "Posición astro " + pos + " (par) debe ser evaluada como VERTICES");
                } else {
                    assertEquals(TipoInspiracion.LADOS, tipoResultante,
                            "Posición astro " + pos + " (impar) debe ser evaluada como LADOS");
                }
            }
        }

        @Test
        @DisplayName("BotService.esInspiracionValida: Acepta y rechaza rigurosamente en las 8 posiciones para todas las musas")
        void botService_esInspiracionValida_exhaustivo() {
            for (TipoMusa musaVertice : MUSAS_VERTICES) {
                CartaInspiracion carta = buildCartaInspiracion(100L, musaVertice, false);

                for (int pos : POSICIONES_VERTICES) {
                    tablero.setSolPos(pos);
                    assertTrue(botService.esInspiracionValida(partida, carta),
                            "Musa de vértices " + musaVertice + " DEBE ser válida en posición par " + pos);
                }

                for (int pos : POSICIONES_LADOS) {
                    tablero.setSolPos(pos);
                    assertFalse(botService.esInspiracionValida(partida, carta),
                            "Musa de vértices " + musaVertice + " NO debe ser válida en posición impar " + pos);
                }
            }

            for (TipoMusa musaLado : MUSAS_LADOS) {
                CartaInspiracion carta = buildCartaInspiracion(200L, musaLado, false);

                for (int pos : POSICIONES_LADOS) {
                    tablero.setSolPos(pos);
                    assertTrue(botService.esInspiracionValida(partida, carta),
                            "Musa de lados " + musaLado + " DEBE ser válida en posición impar " + pos);
                }

                for (int pos : POSICIONES_VERTICES) {
                    tablero.setSolPos(pos);
                    assertFalse(botService.esInspiracionValida(partida, carta),
                            "Musa de lados " + musaLado + " NO debe ser válida en posición par " + pos);
                }
            }
        }

        @Test
        @DisplayName("Ejecución en cadena en InspiracionEffectStrategy: Musas de vértices fallan en lados y viceversa")
        void inspiracionEffectStrategy_rechazaPosicionesIncompatibles() {
            for (TipoMusa musaVertice : MUSAS_VERTICES) {
                CartaInspiracion carta = buildCartaInspiracion(300L, musaVertice, false);
                for (int posLado : POSICIONES_LADOS) {
                    tablero.setSolPos(posLado);
                    IllegalStateException ex = assertThrows(IllegalStateException.class,
                            () -> inspiracionEffectStrategy.execute(carta, tablero, botJugador));
                    assertEquals("Los astros no están en la posición correcta para usar esta carta", ex.getMessage());
                }
            }

            for (TipoMusa musaLado : MUSAS_LADOS) {
                CartaInspiracion carta = buildCartaInspiracion(400L, musaLado, false);
                for (int posVertice : POSICIONES_VERTICES) {
                    tablero.setSolPos(posVertice);
                    IllegalStateException ex = assertThrows(IllegalStateException.class,
                            () -> inspiracionEffectStrategy.execute(carta, tablero, botJugador));
                    assertEquals("Los astros no están en la posición correcta para usar esta carta", ex.getMessage());
                }
            }
        }

        @Test
        @DisplayName("Ejecución exitosa en posiciones válidas: Todas las 9 musas colocan tokens sin excepción")
        void inspiracionEffectStrategy_ejecutaExitosamente_enPosicionesValidas() {
            for (TipoMusa musaVertice : MUSAS_VERTICES) {
                for (int pos : POSICIONES_VERTICES) {
                    CartaInspiracion carta = buildCartaInspiracion(500L, musaVertice, false);
                    tablero.setSolPos(pos);
                    assertDoesNotThrow(() -> inspiracionEffectStrategy.execute(carta, tablero, botJugador),
                            "La musa " + musaVertice + " debe ejecutarse correctamente en posición " + pos);
                    assertTrue(carta.isUsada());
                }
            }

            for (TipoMusa musaLado : MUSAS_LADOS) {
                for (int pos : POSICIONES_LADOS) {
                    CartaInspiracion carta = buildCartaInspiracion(600L, musaLado, false);
                    tablero.setSolPos(pos);
                    assertDoesNotThrow(() -> inspiracionEffectStrategy.execute(carta, tablero, botJugador),
                            "La musa " + musaLado + " debe ejecutarse correctamente en posición " + pos);
                    assertTrue(carta.isUsada());
                }
            }
        }

        @Test
        @DisplayName("Robustez ante valores no normalizados (posiciones fuera de 0..7)")
        void posicionesFueraDeRango_lanzanInvalidParameterExceptionEnSubEstrategia() {
            // Posición 8: 8 % 2 == 0 pasa la comprobación inicial de InspiracionEffectStrategy (VERTICES),
            // pero la sub-estrategia individual Urania lanza InvalidParameterException porque sólo admite 0, 2, 4, 6.
            CartaInspiracion cartaUrania = buildCartaInspiracion(650L, TipoMusa.URANIA, false);
            tablero.setSolPos(8);
            assertThrows(InvalidParameterException.class,
                    () -> inspiracionEffectStrategy.execute(cartaUrania, tablero, botJugador),
                    "Posiciones no normalizadas >= 8 deben ser rechazadas por la estrategia concreta");
        }
    }

    // =========================================================================
    // DIMENSIÓN 2: CICLO DE VIDA DE CARTA INSPIRACIÓN Y PREVENCIÓN DE REUSO
    // =========================================================================

    @Nested
    @DisplayName("Dimensión 2: Ciclo de Vida y Prevención Rigurosa de Reuso")
    class InspirationCardLifecycleTests {

        @Test
        @DisplayName("Transición permanente: isUsada pasa de false a true y rechaza intentos subsecuentes")
        void execute_transicionPermanente_yRechazoPosterior() {
            CartaInspiracion carta = buildCartaInspiracion(701L, TipoMusa.URANIA, false);
            tablero.setSolPos(0); // VERTICES

            assertFalse(carta.isUsada(), "Debe iniciar en usada = false");

            // Primer uso -> exitoso
            inspiracionEffectStrategy.execute(carta, tablero, botJugador);
            assertTrue(carta.isUsada(), "Tras execute debe quedar marcada como usada = true");

            // Segundo intento -> debe fallar de inmediato
            IllegalStateException ex1 = assertThrows(IllegalStateException.class,
                    () -> inspiracionEffectStrategy.execute(carta, tablero, botJugador));
            assertEquals("Esta carta de inspiración ya ha sido usada", ex1.getMessage());

            // Tercer intento en otra posición de vértices -> sigue fallando
            tablero.setSolPos(2);
            IllegalStateException ex2 = assertThrows(IllegalStateException.class,
                    () -> inspiracionEffectStrategy.execute(carta, tablero, botJugador));
            assertEquals("Esta carta de inspiración ya ha sido usada", ex2.getMessage());
        }

        @Test
        @DisplayName("Bot Heuristic: Jamás selecciona una carta con usada == true, incluso con utilidad máxima")
        void botHeuristic_nuncaSeleccionaCartaYaUsada() {
            CartaInspiracion cartaUsada = buildCartaInspiracion(702L, TipoMusa.MELPOMENE, true); // 9 pts
            botJugador.setCartaInspiracion(cartaUsada);
            tablero.setSolPos(1); // Posición válida para Melpomene

            CartaAccion devSol = buildCartaAccion(10L, TipoAccion.DEVOCION_SOL);
            CartaAccion devLuna = buildCartaAccion(11L, TipoAccion.DEVOCION_LUNA);
            CartaAccion revSol = buildCartaAccion(12L, TipoAccion.REVOLUCION_SOL);
            CartaAccion revLuna = buildCartaAccion(13L, TipoAccion.REVOLUCION_LUNA);

            when(cartaService.getAll()).thenReturn(List.of(devSol, devLuna, revSol, revLuna));

            Musa musaSol = new Musa();
            setId(musaSol, 1L);
            musaSol.setNombre(TipoMusa.CLIO);
            musaSol.setTokensColocados(new ArrayList<>());

            Musa musaLuna = new Musa();
            setId(musaLuna, 2L);
            musaLuna.setNombre(TipoMusa.TALIA);
            musaLuna.setTokensColocados(new ArrayList<>());

            when(tableroService.getMusasEnAstros(tablero)).thenReturn(Map.of("sol", musaSol, "luna", musaLuna));

            CartaBase seleccionada = botService.calcularMejorJugada(partida, botJugador);

            assertNotNull(seleccionada);
            assertNotEquals(cartaUsada.getId(), seleccionada.getId(),
                    "El bot jamás debe seleccionar una carta de inspiración marcada como usada");
            assertTrue(seleccionada instanceof CartaAccion,
                    "Al estar la inspiración usada, el bot debe recurrir a una carta de acción");
        }

        @Test
        @DisplayName("Atomicidad: Si la estrategia individual falla, la carta NO debe quedar marcada como usada")
        void execute_falloEnEstrategia_noMarcaComoUsada() throws Exception {
            InspiracionEffectStrategy strategyConFallo = new InspiracionEffectStrategy();
            InspiracionMusaStrategy subStrategyMock = mock(InspiracionMusaStrategy.class);
            when(subStrategyMock.supports(any())).thenReturn(true);
            doThrow(new RuntimeException("Error simulado en colocación de tokens"))
                    .when(subStrategyMock).execute(any(), any(), any());

            injectField(strategyConFallo, "strategies", List.of(subStrategyMock));

            CartaInspiracion carta = buildCartaInspiracion(703L, TipoMusa.ERATO, false);
            tablero.setSolPos(0);

            assertThrows(RuntimeException.class,
                    () -> strategyConFallo.execute(carta, tablero, botJugador));

            assertFalse(carta.isUsada(),
                    "Si ocurre una excepción durante la ejecución del efecto, la carta no debe quedar consumida");
        }

        @Test
        @DisplayName("Tolerancia y robustez ante parámetros nulos en esInspiracionValida")
        void esInspiracionValida_toleraNulos() {
            CartaInspiracion carta = buildCartaInspiracion(704L, TipoMusa.TERPSICORE, false);

            assertFalse(botService.esInspiracionValida(null, carta));
            assertFalse(botService.esInspiracionValida(partida, null));
            assertFalse(botService.esInspiracionValida(null, null));

            CartaInspiracion cartaSinMusa = buildCartaInspiracion(705L, null, false);
            assertFalse(botService.esInspiracionValida(partida, cartaSinMusa));

            Partida partidaSinTablero = new Partida();
            assertFalse(botService.esInspiracionValida(partidaSinTablero, carta));
        }
    }

    // =========================================================================
    // DIMENSIÓN 3: CONCURRENCIA, AUSENCIA DE @TRANSACTIONAL Y RESILIENCIA @RETRYABLE
    // =========================================================================

    @Nested
    @DisplayName("Dimensión 3: Concurrencia y Resiliencia Transaccional / @Retryable")
    class ConcurrencyAndRetryableTests {

        @Test
        @DisplayName("Auditoría de Arquitectura: BotService y BotServiceImpl NO tienen @Transactional")
        void verificarAusenciaDeTransactionalEnBotService() {
            assertFalse(BotService.class.isAnnotationPresent(Transactional.class),
                    "La interfaz BotService no debe tener @Transactional a nivel de clase");
            assertFalse(BotServiceImpl.class.isAnnotationPresent(Transactional.class),
                    "La clase BotServiceImpl no debe tener @Transactional a nivel de clase");

            for (Method m : BotServiceImpl.class.getDeclaredMethods()) {
                assertFalse(m.isAnnotationPresent(Transactional.class),
                        "El método " + m.getName() + " de BotServiceImpl no debe tener @Transactional para preservar @Retryable");
            }
        }

        @Test
        @DisplayName("Auditoría de Arquitectura: PartidaService.seleccionarCarta define @Retryable con OptimisticLockingFailureException")
        void verificarContratoRetryableEnPartidaService() throws NoSuchMethodException {
            Method method = PartidaService.class.getMethod("seleccionarCarta", Long.class, Long.class, Long.class);
            assertTrue(method.isAnnotationPresent(Retryable.class),
                    "PartidaService.seleccionarCarta DEBE portar la anotación @Retryable");

            Retryable retryable = method.getAnnotation(Retryable.class);
            assertTrue(Arrays.asList(retryable.value()).contains(OptimisticLockingFailureException.class),
                    "La anotación @Retryable debe capturar OptimisticLockingFailureException");
            assertEquals(5, retryable.maxRetries(),
                    "El número máximo de reintentos debe ser 5");
        }

        @Test
        @DisplayName("Idempotencia: Si el bot ya votó en la ronda, ejecutarTurnoBot es un no-op sin efectos colaterales")
        void ejecutarTurnoBot_idempotente_siYaVoto() {
            partida.getSeleccionesRonda().put(botJugador.getId(), 999L);

            botService.ejecutarTurnoBot(partida, botJugador);

            verify(partidaService, never()).seleccionarCarta(anyLong(), anyLong(), anyLong());
        }

        @Test
        @DisplayName("Estrés Concurrente: Invocaciones simultáneas de ejecutarTurnoBot operan limpiamente")
        void ejecutarTurnoBot_concurrenciaMultiHilo() throws InterruptedException {
            CartaAccion devSol = buildCartaAccion(10L, TipoAccion.DEVOCION_SOL);
            when(cartaService.getAll()).thenReturn(List.of(devSol));

            Musa musaSol = new Musa();
            setId(musaSol, 1L);
            musaSol.setNombre(TipoMusa.CLIO);
            musaSol.setTokensColocados(new ArrayList<>());
            when(tableroService.getMusasEnAstros(tablero)).thenReturn(Map.of("sol", musaSol));

            int numHilos = 8;
            ExecutorService executor = Executors.newFixedThreadPool(numHilos);
            CountDownLatch readyLatch = new CountDownLatch(numHilos);
            CountDownLatch startLatch = new CountDownLatch(1);
            CountDownLatch finishLatch = new CountDownLatch(numHilos);

            AtomicInteger exitos = new AtomicInteger(0);
            AtomicInteger fallos = new AtomicInteger(0);

            for (int i = 0; i < numHilos; i++) {
                executor.submit(() -> {
                    readyLatch.countDown();
                    try {
                        startLatch.await();
                        botService.ejecutarTurnoBot(partida, botJugador);
                        exitos.incrementAndGet();
                    } catch (Exception e) {
                        fallos.incrementAndGet();
                    } finally {
                        finishLatch.countDown();
                    }
                });
            }

            readyLatch.await(5, TimeUnit.SECONDS);
            startLatch.countDown(); // Disparo sincronizado
            boolean terminado = finishLatch.await(5, TimeUnit.SECONDS);
            executor.shutdown();

            assertTrue(terminado, "Todos los hilos concurrentes deben finalizar dentro del tiempo límite");
            assertEquals(0, fallos.get(), "Ningún hilo debe arrojar excepciones no controladas");
            assertEquals(numHilos, exitos.get(), "Todos los hilos completaron la ejecución");
        }
    }

    // =========================================================================
    // UTILIDADES DE REFLEXIÓN Y FIXTURES
    // =========================================================================

    private CartaInspiracion buildCartaInspiracion(Long id, TipoMusa tipoMusa, boolean usada) {
        CartaInspiracion c = new CartaInspiracion();
        setId(c, id);
        c.setNombreMusa(tipoMusa);
        c.setUsada(usada);
        c.setNombre("Inspiración " + (tipoMusa != null ? tipoMusa.name() : "Nula"));
        c.setDescripcion("Efecto de inspiración");
        return c;
    }

    private CartaAccion buildCartaAccion(Long id, TipoAccion tipo) {
        CartaAccion c = new CartaAccion();
        setId(c, id);
        c.setTipo(tipo);
        c.setNombre(tipo.name());
        c.setDescripcion("Carta de acción");
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
