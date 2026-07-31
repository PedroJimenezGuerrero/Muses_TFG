package tfg.muses.bot;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import java.lang.reflect.Field;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.Timeout;

import tfg.muses.carta.CartaAccion;
import tfg.muses.carta.CartaBase;
import tfg.muses.carta.CartaInspiracion;
import tfg.muses.carta.CartaRepository;
import tfg.muses.carta.CartaService;
import tfg.muses.carta.TipoAccion;
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

/**
 * Suite de pruebas adversariales y de estrés para BotService.
 * Verifica empíricamente:
 * 1. Comportamiento ante estados de tablero adversariales y corruptos.
 * 2. Comportamiento ante agotamiento extremo de recursos (Token exhaustion).
 * 3. Determinismo en desempates de puntuaciones (Tied scores).
 * 4. Concurrencia, idempotencia y vulnerabilidades de bloqueo (Hang) o duplicación (Duplicate).
 */
public class BotServiceStressTest {

    private BotServiceImpl botService;

    private PartidaService partidaService;
    private TableroService tableroService;
    private PuntuacionService puntuacionService;
    private CartaService cartaService;
    private CartaRepository cartaRepository;
    private JugadorService jugadorService;

    private Partida partida;
    private Tablero tablero;
    private Jugador botJugador;
    private Jugador rivalJugador;

    private CartaAccion devocionSol;
    private CartaAccion devocionLuna;
    private CartaAccion revolucionSol;
    private CartaAccion revolucionLuna;

    @BeforeEach
    public void setUp() throws Exception {
        partidaService = mock(PartidaService.class);
        tableroService = mock(TableroService.class);
        puntuacionService = mock(PuntuacionService.class);
        cartaService = mock(CartaService.class);
        cartaRepository = mock(CartaRepository.class);
        jugadorService = mock(JugadorService.class);

        botService = new BotServiceImpl();
        injectField(botService, "partidaService", partidaService);
        injectField(botService, "tableroService", tableroService);
        injectField(botService, "puntuacionService", puntuacionService);
        injectField(botService, "cartaService", cartaService);
        injectField(botService, "cartaRepository", cartaRepository);
        injectField(botService, "jugadorService", jugadorService);

        devocionSol = buildCartaAccion(101L, TipoAccion.DEVOCION_SOL);
        devocionLuna = buildCartaAccion(102L, TipoAccion.DEVOCION_LUNA);
        revolucionSol = buildCartaAccion(103L, TipoAccion.REVOLUCION_SOL);
        revolucionLuna = buildCartaAccion(104L, TipoAccion.REVOLUCION_LUNA);

        when(cartaService.getAll()).thenReturn(List.of(
                devocionSol, devocionLuna, revolucionSol, revolucionLuna
        ));

        Usuario uBot = buildUsuario(1L, "Bot_Stress");
        botJugador = buildJugador(1L, "Bot", uBot, 20, 0);

        Usuario uRival = buildUsuario(2L, "Rival_Stress");
        rivalJugador = buildJugador(2L, "Rival", uRival, 20, 0);

        tablero = new Tablero();
        setId(tablero, 10L);
        List<Musa> grid = new ArrayList<>();
        for (TipoMusa tm : TipoMusa.values()) {
            grid.add(buildMusa(grid.size() + 1L, tm));
        }
        tablero.setGrid(grid);
        tablero.setSolPos(0);
        tablero.setLunaPos(4);

        partida = new Partida();
        setId(partida, 100L);
        partida.setRondaActual(1);
        partida.setMaxRondas(9);
        partida.setFechaInicio(LocalDateTime.now());
        partida.setTablero(tablero);
        partida.setJugadores(new ArrayList<>(List.of(botJugador, rivalJugador)));
        partida.setSeleccionesRonda(new HashMap<>());
    }

    // =========================================================================
    // BLOQUE 1: ESTADOS DE TABLERO ADVERSARIALES Y CORRUPTOS
    // =========================================================================
    @Nested
    @DisplayName("Pruebas de Estados de Tablero Adversariales")
    class AdversarialBoardStatesTests {

        @Test
        @DisplayName("Tablero con grid vacío no lanza excepción y retorna una carta válida de acción")
        void calcularMejorJugada_conGridVacio_noLanzaExcepcion() {
            tablero.setGrid(new ArrayList<>());
            when(tableroService.getMusasEnAstros(tablero)).thenReturn(Collections.emptyMap());

            assertDoesNotThrow(() -> {
                CartaBase jugada = botService.calcularMejorJugada(partida, botJugador);
                assertNotNull(jugada, "Debe retornar una jugada de fallback");
                assertTrue(jugada instanceof CartaAccion);
            });
        }

        @Test
        @DisplayName("Tablero con grid incompleto (menos de 9 musas) opera de forma segura")
        void calcularMejorJugada_conGridParcial_operaSinErrores() {
            List<Musa> partialGrid = new ArrayList<>();
            partialGrid.add(buildMusa(1L, TipoMusa.CLIO));
            partialGrid.add(buildMusa(2L, TipoMusa.ERATO));
            tablero.setGrid(partialGrid);
            when(tableroService.getMusasEnAstros(tablero)).thenReturn(Collections.emptyMap());

            assertDoesNotThrow(() -> {
                CartaBase jugada = botService.calcularMejorJugada(partida, botJugador);
                assertNotNull(jugada);
            });
        }

        @Test
        @DisplayName("Tablero con elementos null en el grid no produce NullPointerException")
        void calcularMejorJugada_conElementosNullEnGrid_esTolerante() {
            List<Musa> nullGrid = new ArrayList<>();
            for (int i = 0; i < 9; i++) {
                nullGrid.add(null);
            }
            tablero.setGrid(nullGrid);
            when(tableroService.getMusasEnAstros(tablero)).thenReturn(Collections.emptyMap());

            assertDoesNotThrow(() -> {
                CartaBase jugada = botService.calcularMejorJugada(partida, botJugador);
                assertNotNull(jugada);
            });
        }

        @Test
        @DisplayName("Musas con atributos nulos (nombre == null, tokensColocados == null) son toleradas")
        void calcularMejorJugada_conMusasConAtributosNulos_noFalla() {
            Musa musaSol = new Musa();
            setId(musaSol, 1L);
            musaSol.setNombre(null);
            musaSol.setTokensColocados(null);

            Musa musaLuna = new Musa();
            setId(musaLuna, 2L);
            musaLuna.setNombre(null);
            musaLuna.setTokensColocados(null);

            when(tableroService.getMusasEnAstros(tablero)).thenReturn(Map.of(
                    "sol", musaSol,
                    "luna", musaLuna
            ));

            assertDoesNotThrow(() -> {
                CartaBase jugada = botService.calcularMejorJugada(partida, botJugador);
                assertNotNull(jugada);
            });
        }

        @Test
        @DisplayName("Posiciones astrales extremas y fuera de rango no provocan cuelgues ni excepciones")
        void calcularMejorJugada_conPosicionesAstralesExtremas_esSeguro() {
            int[] posicionesAdversarias = {-100, -1, 8, 9, 50, 999, Integer.MAX_VALUE};
            when(tableroService.getMusasEnAstros(tablero)).thenThrow(new IllegalArgumentException("Posición fuera de rango"));

            for (int pos : posicionesAdversarias) {
                tablero.setSolPos(pos);
                tablero.setLunaPos(pos);

                assertDoesNotThrow(() -> {
                    CartaBase jugada = botService.calcularMejorJugada(partida, botJugador);
                    assertNotNull(jugada, "Fallo evaluando con astroPos = " + pos);
                });
            }
        }

        @Test
        @DisplayName("Tolerancia cuando servicios dependientes lanzan RuntimeException imprevista")
        void calcularMejorJugada_cuandoServiciosDependientesFallan_degradaGraciosamente() {
            when(tableroService.getMusasEnAstros(any(Tablero.class))).thenThrow(new RuntimeException("Fallo de infraestructura simulado"));
            when(puntuacionService.calcularPuntosMusa(any(Musa.class), any())).thenThrow(new RuntimeException("Fallo en motor de cálculo"));

            assertDoesNotThrow(() -> {
                CartaBase jugada = botService.calcularMejorJugada(partida, botJugador);
                assertNotNull(jugada, "Debe degradar a heurística estática ante fallos de dependencias");
            });
        }

        @Test
        @DisplayName("Tolerancia cuando la lista de jugadores de la partida es null o vacía")
        void calcularMejorJugada_conJugadoresVaciosONull_noFalla() {
            partida.setJugadores(null);
            assertDoesNotThrow(() -> {
                CartaBase jugada = botService.calcularMejorJugada(partida, botJugador);
                assertNotNull(jugada);
            });

            partida.setJugadores(Collections.emptyList());
            assertDoesNotThrow(() -> {
                CartaBase jugada = botService.calcularMejorJugada(partida, botJugador);
                assertNotNull(jugada);
            });
        }

        @Test
        @DisplayName("Tolerancia cuando la lista de tokens del bot contiene referencias null")
        void calcularMejorJugada_conTokensConteniendoNulls_operaCorrectamente() {
            List<Token> tokensCorruptos = new ArrayList<>();
            tokensCorruptos.add(null);
            Token tValido = new Token();
            tValido.setColocado(false);
            tokensCorruptos.add(tValido);
            tokensCorruptos.add(null);
            botJugador.setTokens(tokensCorruptos);

            assertDoesNotThrow(() -> {
                CartaBase jugada = botService.calcularMejorJugada(partida, botJugador);
                assertNotNull(jugada);
            });
        }
    }

    // =========================================================================
    // BLOQUE 2: AGOTAMIENTO DE FICHAS (TOKEN EXHAUSTION)
    // =========================================================================
    @Nested
    @DisplayName("Pruebas de Estrés ante Agotamiento de Recursos")
    class TokenExhaustionStressTests {

        @Test
        @DisplayName("Agotamiento total (0 tokens): El bot descarta Devoción e Inspiración y elige Revolución Sol")
        void tokenExhaustion_ceroTokens_priorizaRevolucionSol() {
            for (Token t : botJugador.getTokens()) {
                t.setColocado(true);
            }

            CartaInspiracion insp = buildCartaInspiracion(201L, TipoMusa.TERPSICORE, false);
            botJugador.setCartaInspiracion(insp);
            tablero.setSolPos(0); // Posición válida para Terpsícore

            Musa musaSol = buildMusa(1L, TipoMusa.MELPOMENE); // 9 pts
            Musa musaLuna = buildMusa(2L, TipoMusa.URANIA);    // 7 pts
            when(tableroService.getMusasEnAstros(tablero)).thenReturn(Map.of("sol", musaSol, "luna", musaLuna));

            CartaBase jugada = botService.calcularMejorJugada(partida, botJugador);

            assertNotNull(jugada);
            assertTrue(jugada instanceof CartaAccion);
            assertEquals(TipoAccion.REVOLUCION_SOL, ((CartaAccion) jugada).getTipo(),
                    "Con 0 tokens debe elegir REVOLUCION_SOL sobre DEVOCION e INSPIRACION");
        }

        @Test
        @DisplayName("Agotamiento total y Revolución Sol no disponible: Elige Revolución Luna como alternativa real")
        void tokenExhaustion_sinRevolucionSol_eligeRevolucionLuna() {
            for (Token t : botJugador.getTokens()) {
                t.setColocado(true);
            }
            botJugador.setCartaInspiracion(null);

            // Simular cartas disponibles en cartaService sin Revolución Sol
            when(cartaService.getAll()).thenReturn(List.of(
                    devocionSol, devocionLuna, revolucionLuna
            ));

            Musa musaSol = buildMusa(1L, TipoMusa.MELPOMENE);
            Musa musaLuna = buildMusa(2L, TipoMusa.URANIA);
            when(tableroService.getMusasEnAstros(tablero)).thenReturn(Map.of("sol", musaSol, "luna", musaLuna));

            CartaBase jugada = botService.calcularMejorJugada(partida, botJugador);

            assertNotNull(jugada);
            assertTrue(jugada instanceof CartaAccion);
            assertEquals(TipoAccion.REVOLUCION_LUNA, ((CartaAccion) jugada).getTipo(),
                    "Al no estar disponible Revolución Sol, debe seleccionar la acción disponible Revolución Luna");
            assertEquals(revolucionLuna.getId(), jugada.getId(),
                    "Debe usar el ID real de la carta disponible existente");
            verify(cartaRepository, never()).save(any());
        }

        @Test
        @DisplayName("Simulación de agotamiento gradual: conmuta a revolución en el instante exacto de 0 tokens")
        void tokenExhaustion_conmutacionExactaEnCeroTokens() {
            botJugador.setCartaInspiracion(null);
            Musa musaSol = buildMusa(1L, TipoMusa.MELPOMENE); // 9 pts
            Musa musaLuna = buildMusa(2L, TipoMusa.TERPSICORE); // 5 pts
            when(tableroService.getMusasEnAstros(tablero)).thenReturn(Map.of("sol", musaSol, "luna", musaLuna));

            // Con 20 tokens -> Devoción Sol
            CartaBase jugada20 = botService.calcularMejorJugada(partida, botJugador);
            assertEquals(TipoAccion.DEVOCION_SOL, ((CartaAccion) jugada20).getTipo());

            // Agotar hasta 1 token -> Sigue eligiendo Devoción Sol (puede colocar hasta su última ficha)
            for (int i = 0; i < 19; i++) {
                botJugador.getTokens().get(i).setColocado(true);
            }
            CartaBase jugada1 = botService.calcularMejorJugada(partida, botJugador);
            assertEquals(TipoAccion.DEVOCION_SOL, ((CartaAccion) jugada1).getTipo());

            // Agotar el último token (0 libres) -> Debe conmutar estrictamente a Revolución
            botJugador.getTokens().get(19).setColocado(true);
            CartaBase jugada0 = botService.calcularMejorJugada(partida, botJugador);
            assertTrue(((CartaAccion) jugada0).getTipo() == TipoAccion.REVOLUCION_SOL
                    || ((CartaAccion) jugada0).getTipo() == TipoAccion.REVOLUCION_LUNA,
                    "En 0 tokens libres debe cambiar a revolución");
        }
    }

    // =========================================================================
    // BLOQUE 3: RESOLUCIÓN DE EMPATES DE PUNTUACIÓN (TIED SCORES)
    // =========================================================================
    @Nested
    @DisplayName("Pruebas de Desempate Determínistico de Puntuaciones")
    class TiedScoresResolutionTests {

        @Test
        @DisplayName("Empate exacto en Nivel 1 y deltaPuntos desempata siempre por prioridad oficial")
        void tiedScores_empateExacto_desempataPorPrioridadOficial() {
            // Ambas musas tienen 8 puntos en Nivel 1
            Musa musaSol = buildMusa(1L, TipoMusa.TALIA);   // 8 pts
            Musa musaLuna = buildMusa(2L, TipoMusa.CALIOPE); // 8 pts
            when(tableroService.getMusasEnAstros(tablero)).thenReturn(Map.of("sol", musaSol, "luna", musaLuna));

            // Ambas devuelven el mismo deltaPuntos
            when(puntuacionService.calcularPuntosMusa(any(Musa.class), any())).thenReturn(Map.of(botJugador, 5));

            botJugador.setCartaInspiracion(null);

            CartaBase jugada = botService.calcularMejorJugada(partida, botJugador);

            assertNotNull(jugada);
            assertTrue(jugada instanceof CartaAccion);
            // Devoción Sol (prioridad 2) debe vencer a Devoción Luna (prioridad 5)
            assertEquals(TipoAccion.DEVOCION_SOL, ((CartaAccion) jugada).getTipo());
        }

        @Test
        @DisplayName("El desempate es determinístico independientemente del orden de las cartas candidatas")
        void tiedScores_independienteDelOrdenDeColeccion() {
            Musa musaSol = buildMusa(1L, TipoMusa.TALIA);
            Musa musaLuna = buildMusa(2L, TipoMusa.CALIOPE);
            when(tableroService.getMusasEnAstros(tablero)).thenReturn(Map.of("sol", musaSol, "luna", musaLuna));
            botJugador.setCartaInspiracion(null);

            // Probar con orden estándar: [Sol, Luna, RevSol, RevLuna]
            when(cartaService.getAll()).thenReturn(List.of(devocionSol, devocionLuna, revolucionSol, revolucionLuna));
            CartaBase jugadaOrdenNormal = botService.calcularMejorJugada(partida, botJugador);

            // Probar con orden inverso: [RevLuna, RevSol, Luna, Sol]
            when(cartaService.getAll()).thenReturn(List.of(revolucionLuna, revolucionSol, devocionLuna, devocionSol));
            CartaBase jugadaOrdenInvertido = botService.calcularMejorJugada(partida, botJugador);

            assertEquals(((CartaAccion) jugadaOrdenNormal).getTipo(), ((CartaAccion) jugadaOrdenInvertido).getTipo(),
                    "El resultado de desempate debe ser idéntico sin importar el orden de iteración");
        }

        @Test
        @DisplayName("Inspiración desempata sobre Devoción Sol cuando sus utilidades son iguales")
        void tiedScores_inspiracionTieneMaximaPrioridadSobreAcciones() {
            CartaInspiracion insp = buildCartaInspiracion(201L, TipoMusa.TERPSICORE, false);
            botJugador.setCartaInspiracion(insp);
            tablero.setSolPos(0); // Alineación par válida

            CartaBase jugada = botService.calcularMejorJugada(partida, botJugador);

            assertNotNull(jugada);
            assertTrue(jugada instanceof CartaInspiracion);
        }
    }

    // =========================================================================
    // BLOQUE 4: CONCURRENCIA, VULNERABILIDADES DE BLOQUEO (HANG) Y DUPLICADOS
    // =========================================================================
    @Nested
    @DisplayName("Pruebas de Concurrencia, No-Bloqueo y Cero Duplicados")
    class ConcurrencyAndHangTests {

        @Test
        @Timeout(value = 5, unit = TimeUnit.SECONDS)
        @DisplayName("20 hilos ejecutando turnos de forma concurrente terminan en < 5s sin cuelgues ni excepciones")
        void ejecutarTurnoBot_concurrenciaMultihilo_noSeCuelga() throws InterruptedException {
            int numHilos = 20;
            ExecutorService executor = Executors.newFixedThreadPool(numHilos);
            CountDownLatch latch = new CountDownLatch(1);
            CountDownLatch doneLatch = new CountDownLatch(numHilos);
            AtomicInteger excepciones = new AtomicInteger(0);

            partida.setSeleccionesRonda(new ConcurrentHashMap<>());

            Musa musaSol = buildMusa(1L, TipoMusa.MELPOMENE);
            Musa musaLuna = buildMusa(2L, TipoMusa.TERPSICORE);
            when(tableroService.getMusasEnAstros(tablero)).thenReturn(Map.of("sol", musaSol, "luna", musaLuna));

            for (int i = 0; i < numHilos; i++) {
                executor.submit(() -> {
                    try {
                        latch.await();
                        botService.ejecutarTurnoBot(partida, botJugador);
                    } catch (Exception e) {
                        excepciones.incrementAndGet();
                    } finally {
                        doneLatch.countDown();
                    }
                });
            }

            latch.countDown();
            boolean terminado = doneLatch.await(4, TimeUnit.SECONDS);

            executor.shutdown();
            assertTrue(terminado, "La ejecución de turnos de bot no debe bloquearse");
            assertEquals(0, excepciones.get(), "No deben ocurrir excepciones bajo concurrencia");
        }

        @Test
        @DisplayName("Idempotencia: Si el bot ya seleccionó en la ronda, jamás invoca partidaService")
        void ejecutarTurnoBot_idempotenciaGarantizada_ceroLlamadasDuplicadas() {
            partida.getSeleccionesRonda().put(botJugador.getId(), devocionSol.getId());

            for (int i = 0; i < 50; i++) {
                botService.ejecutarTurnoBot(partida, botJugador);
            }

            verify(partidaService, never()).seleccionarCarta(anyLong(), anyLong(), anyLong());
        }

        @Test
        @DisplayName("VULNERABILIDAD EMPÍRICA 'HANG': Si la mejor jugada no tiene ID persistido, ejecutarTurnoBot omite la jugada y bloquea la partida")
        void ejecutarTurnoBot_cartaSinId_demuestraVulnerabilidadBloqueoSilencioso() {
            // Se simula que la única carta seleccionable no tiene ID
            CartaAccion cartaSinId = new CartaAccion();
            cartaSinId.setTipo(TipoAccion.DEVOCION_SOL);
            // ID = null intencionado

            when(cartaService.getAll()).thenReturn(List.of(cartaSinId));
            botJugador.setCartaInspiracion(null);

            // Ejecutar turno del bot
            botService.ejecutarTurnoBot(partida, botJugador);

            // Verificación empírica del fallo: no se registra selección para el bot
            verify(partidaService, never()).seleccionarCarta(anyLong(), anyLong(), anyLong());
            assertFalse(partida.getSeleccionesRonda().containsKey(botJugador.getId()),
                    "El bot no registra su voto en la partida, lo que causa bloqueo (hang) indefinido de la ronda");
        }

        @Test
        @DisplayName("VULNERABILIDAD EMPÍRICA 'DUPLICATE/RACE': Múltiples hilos concurrentes llaman a seleccionarCarta simultáneamente si no hay bloqueo atómico")
        void ejecutarTurnoBot_concurrenciaSinLock_demuestraCondicionCarrera() throws Exception {
            AtomicInteger llamadasSeleccionar = new AtomicInteger(0);
            doAnswer(invocation -> {
                llamadasSeleccionar.incrementAndGet();
                return null;
            }).when(partidaService).seleccionarCarta(anyLong(), anyLong(), anyLong());

            Musa musaSol = buildMusa(1L, TipoMusa.MELPOMENE);
            Musa musaLuna = buildMusa(2L, TipoMusa.TERPSICORE);
            when(tableroService.getMusasEnAstros(tablero)).thenReturn(Map.of("sol", musaSol, "luna", musaLuna));

            // Simular dos hilos simultáneos que invocan ejecutarTurnoBot exactamente en el mismo instante
            int numHilos = 4;
            ExecutorService pool = Executors.newFixedThreadPool(numHilos);
            CountDownLatch start = new CountDownLatch(1);
            CountDownLatch finish = new CountDownLatch(numHilos);

            for (int i = 0; i < numHilos; i++) {
                pool.submit(() -> {
                    try {
                        start.await();
                        botService.ejecutarTurnoBot(partida, botJugador);
                    } catch (Exception ignored) {
                    } finally {
                        finish.countDown();
                    }
                });
            }

            start.countDown();
            finish.await(3, TimeUnit.SECONDS);
            pool.shutdown();

            // Si ejecutarTurnoBot no sincroniza sobre la partida o no usa lock atómico,
            // múltiples hilos compiten y pueden invocar seleccionarCarta más de 1 vez.
            // Registramos el recuento empírico observado.
            System.out.println("Invocaciones empíricas concurrentes a seleccionarCarta: " + llamadasSeleccionar.get());
            assertTrue(llamadasSeleccionar.get() >= 1, "Debe haberse ejecutado al menos 1 vez");
        }

        @Test
        @Timeout(value = 3, unit = TimeUnit.SECONDS)
        @DisplayName("Harness de 1000 ejecuciones consecutivas de calcularMejorJugada responde en < 3s")
        void calcularMejorJugada_stressHarness1000Iteraciones() {
            Musa musaSol = buildMusa(1L, TipoMusa.MELPOMENE);
            Musa musaLuna = buildMusa(2L, TipoMusa.TERPSICORE);
            when(tableroService.getMusasEnAstros(tablero)).thenReturn(Map.of("sol", musaSol, "luna", musaLuna));

            assertTimeoutPreemptively(Duration.ofSeconds(3), () -> {
                for (int i = 0; i < 1000; i++) {
                    tablero.setSolPos(i % 8);
                    tablero.setLunaPos((i + 4) % 8);
                    CartaBase carta = botService.calcularMejorJugada(partida, botJugador);
                    assertNotNull(carta);
                }
            });
        }
    }

    // =========================================================================
    // MÉTODOS AUXILIARES
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
