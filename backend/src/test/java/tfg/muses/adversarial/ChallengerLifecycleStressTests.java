package tfg.muses.adversarial;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import java.lang.reflect.Field;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import tfg.muses.carta.CartaInspiracion;
import tfg.muses.carta.CartaService;
import tfg.muses.estadisticas.Estadisticas;
import tfg.muses.estadisticas.EstadisticasRepository;
import tfg.muses.jugador.Jugador;
import tfg.muses.jugador.JugadorRepository;
import tfg.muses.jugador.JugadorService;
import tfg.muses.musa.Musa;
import tfg.muses.musa.MusaService;
import tfg.muses.musa.TipoMusa;
import tfg.muses.partida.Partida;
import tfg.muses.partida.PartidaRepository;
import tfg.muses.partida.PartidaService;
import tfg.muses.puntuacion.PuntuacionService;
import tfg.muses.tablero.Tablero;
import tfg.muses.tablero.TableroRepository;
import tfg.muses.tablero.TableroService;
import tfg.muses.token.Token;
import tfg.muses.usuario.Usuario;

/**
 * Challenger 2 Adversarial Stress Suite for Milestone 1.
 * Evaluates:
 * 1. Board Initialization invariants & Monte Carlo shuffling randomness (F09, F12).
 * 2. Inspiration Card Distribution uniqueness, unused flag, distinct TipoMusa (F10, F11).
 * 3. Round Progression from 1 to 9, exact termination at round 9, scoring trigger (F13, F14).
 * 4. Multiple Winners recording all tied players in Partida.ganadores (F19).
 * 5. Comprehensive Statistics accumulation across tied winners & losers.
 */
public class ChallengerLifecycleStressTests {

    private TableroService tableroService;
    private TableroRepository tableroRepository;
    private PartidaRepository partidaRepository;
    private MusaService musaService;

    private PartidaService partidaService;
    private CartaService cartaService;
    private JugadorService jugadorService;
    private SimpMessagingTemplate messagingTemplate;
    private PuntuacionService puntuacionService;

    private EstadisticasRepository estadisticasRepository;
    private JugadorRepository jugadorRepository;

    @BeforeEach
    public void setUp() throws Exception {
        tableroRepository = mock(TableroRepository.class);
        partidaRepository = mock(PartidaRepository.class);
        musaService = mock(MusaService.class);
        cartaService = mock(CartaService.class);
        jugadorService = mock(JugadorService.class);
        messagingTemplate = mock(SimpMessagingTemplate.class);
        estadisticasRepository = mock(EstadisticasRepository.class);
        jugadorRepository = mock(JugadorRepository.class);

        // Real TableroService
        tableroService = new TableroService();
        injectField(tableroService, "tableroRepository", tableroRepository);
        injectField(tableroService, "partidaRepository", partidaRepository);
        injectField(tableroService, "musaService", musaService);

        // Real PuntuacionService
        puntuacionService = new PuntuacionService();
        injectField(puntuacionService, "estadisticasRepository", estadisticasRepository);
        injectField(puntuacionService, "jugadorRepository", jugadorRepository);
        injectField(puntuacionService, "partidaRepository", partidaRepository);

        // Real PartidaService
        partidaService = new PartidaService();
        injectField(partidaService, "partidaRepository", partidaRepository);
        injectField(partidaService, "cartaService", cartaService);
        injectField(partidaService, "jugadorService", jugadorService);
        injectField(partidaService, "messagingTemplate", messagingTemplate);
        injectField(partidaService, "tableroService", tableroService);
        injectField(partidaService, "puntuacionService", puntuacionService);
    }

    // =========================================================================
    // 1. BOARD INITIALIZATION (F09, F12)
    // =========================================================================

    @Test
    public void monteCarloBoardInitializationAlwaysProducesNineNonNullShuffledMusasAndCorrectAstros() {
        when(tableroRepository.save(any(Tablero.class))).thenAnswer(i -> i.getArgument(0));

        Set<String> observedPermutations = new HashSet<>();

        for (int i = 0; i < 1000; i++) {
            Tablero tablero = tableroService.inicializarTablero();

            assertNotNull(tablero, "Tablero must not be null");
            assertEquals(0, tablero.getSolPos(), "Sol initial position must strictly be 0");
            assertEquals(4, tablero.getLunaPos(), "Luna initial position must strictly be 4");

            List<Musa> grid = tablero.getGrid();
            assertNotNull(grid, "Grid must not be null");
            assertEquals(9, grid.size(), "Grid must have exactly 9 muses");

            Set<TipoMusa> uniqueMusasInGrid = new HashSet<>();
            StringBuilder permKey = new StringBuilder();

            for (Musa musa : grid) {
                assertNotNull(musa, "Musa in grid must not be null");
                assertNotNull(musa.getNombre(), "Musa name must not be null");
                assertNotNull(musa.getTokensColocados(), "TokensColocados must not be null");
                assertTrue(musa.getTokensColocados().isEmpty(), "Initial tokens on musa must be empty");
                uniqueMusasInGrid.add(musa.getNombre());
                permKey.append(musa.getNombre().name()).append(",");
            }

            assertEquals(9, uniqueMusasInGrid.size(), "All 9 muses must be distinct TipoMusa values");
            assertEquals(TipoMusa.values().length, uniqueMusasInGrid.size());
            observedPermutations.add(permKey.toString());
        }

        // Randomness verification: out of 1000 shuffles, we must see rich diversity of permutations (> 50)
        assertTrue(observedPermutations.size() > 50,
                "Shuffle must generate multiple distinct permutations, observed: " + observedPermutations.size());
    }

    // =========================================================================
    // 2. INSPIRATION CARD DISTRIBUTION (F10, F11)
    // =========================================================================

    @Test
    public void monteCarloInspirationCardDistributionGuaranteesUniquenessAndUsadaFalseAcrossPlayerCounts() {
        when(tableroRepository.save(any(Tablero.class))).thenAnswer(i -> i.getArgument(0));
        when(partidaRepository.save(any(Partida.class))).thenAnswer(i -> i.getArgument(0));

        // Test with 2, 3, and 4 players
        for (int playerCount = 2; playerCount <= 4; playerCount++) {
            for (int run = 0; run < 300; run++) {
                Partida partida = new Partida();
                setId(partida, 100L + run);
                List<Jugador> jugadores = new ArrayList<>();
                for (int p = 1; p <= playerCount; p++) {
                    Usuario u = buildUsuario((long) (p * 1000 + run), "user" + p);
                    Jugador j = buildJugador((long) (p * 1000 + run), "Jugador" + p, u);
                    jugadores.add(j);
                }
                partida.setJugadores(jugadores);

                when(partidaRepository.findById(partida.getId())).thenReturn(Optional.of(partida));

                Tablero resultTablero = partidaService.iniciarPartida(partida.getId());

                assertNotNull(resultTablero);
                assertEquals(1, partida.getRondaActual(), "Game must start at round 1");
                assertNotNull(partida.getFechaInicio(), "fechaInicio must be set");

                Set<TipoMusa> assignedCards = new HashSet<>();
                for (Jugador j : partida.getJugadores()) {
                    CartaInspiracion carta = j.getCartaInspiracion();
                    assertNotNull(carta, "Each player must receive a CartaInspiracion");
                    assertNotNull(carta.getNombreMusa(), "Card must be associated with a TipoMusa");
                    assertFalse(carta.isUsada(), "Card must have usada == false initially");
                    assertTrue(carta.getNombre().contains("Inspiración de " + carta.getNombreMusa().name()));

                    // Verify uniqueness: no two players receive the same TipoMusa
                    boolean isNew = assignedCards.add(carta.getNombreMusa());
                    assertTrue(isNew, "Duplicate inspiration card dealt to player: " + carta.getNombreMusa());

                    // Verify initial devotion tokens: 20 unplaced tokens per player
                    assertNotNull(j.getTokens(), "Player tokens must not be null");
                    assertEquals(20, j.getTokens().size(), "Player must start with exactly 20 tokens");
                    assertTrue(j.getTokens().stream().noneMatch(Token::isColocado),
                            "All initial tokens must be unplaced (colocado == false)");
                    assertTrue(j.getTokens().stream().allMatch(t -> t.getJugador() == j),
                            "All tokens must reference the player");
                }

                assertEquals(playerCount, assignedCards.size());
            }
        }
    }

    // =========================================================================
    // 3. ROUND LIFECYCLE & GAME TERMINATION (F13, F14)
    // =========================================================================

    @Test
    public void adversarialRoundProgressionStepByStepFromOneToNineAndTerminatesExactlyAtNine() throws Exception {
        PuntuacionService mockPuntuacion = mock(PuntuacionService.class);
        injectField(partidaService, "puntuacionService", mockPuntuacion);
        when(partidaRepository.save(any(Partida.class))).thenAnswer(i -> i.getArgument(0));

        Partida partida = new Partida();
        setId(partida, 1L);
        partida.setRondaActual(1);
        partida.setMaxRondas(9);
        partida.setFechaInicio(LocalDateTime.now().minusMinutes(45));

        // Simulate rounds 1 through 8
        for (int r = 1; r < 9; r++) {
            assertEquals(r, partida.getRondaActual(), "Round before finalize must be " + r);
            partida.getSeleccionesRonda().put(1L, 10L);
            partida.getSeleccionesRonda().put(2L, 20L);

            partidaService.finalizarRonda(partida);

            assertTrue(partida.getSeleccionesRonda().isEmpty(), "seleccionesRonda must be cleared after round " + r);
            assertEquals(r + 1, partida.getRondaActual(), "Round must increment to " + (r + 1));
            assertNull(partida.getFechaFin(), "fechaFin must not be set before round 9");
            verifyNoInteractions(mockPuntuacion);
        }

        // At round 9: finalizing round 9 must terminate game
        assertEquals(9, partida.getRondaActual());
        partida.getSeleccionesRonda().put(1L, 10L);

        partidaService.finalizarRonda(partida);

        assertTrue(partida.getSeleccionesRonda().isEmpty(), "seleccionesRonda must be cleared");
        assertEquals(9, partida.getRondaActual(), "Round counter must remain at maxRondas (9)");
        assertNotNull(partida.getFechaFin(), "Game end must set fechaFin");
        assertTrue(partida.getDuracionTotal() >= 44, "duracionTotal must be calculated from fechaInicio");
        verify(mockPuntuacion, times(1)).procesarFinPartida(partida);
        verify(partidaRepository, atLeast(9)).save(partida);
    }

    @Test
    public void adversarialRoundProgressionResistsNullAndOverRoundBoundary() throws Exception {
        PuntuacionService mockPuntuacion = mock(PuntuacionService.class);
        injectField(partidaService, "puntuacionService", mockPuntuacion);

        // Defensive checks for null inputs
        assertDoesNotThrow(() -> partidaService.finalizarRonda(null));
        assertDoesNotThrow(() -> partidaService.finalizarPartida(null));
        verifyNoInteractions(mockPuntuacion);

        // If game is already past maxRondas (e.g. 10), it immediately triggers game finalization
        Partida partida = new Partida();
        partida.setRondaActual(10);
        partida.setMaxRondas(9);
        when(partidaRepository.save(any(Partida.class))).thenAnswer(i -> i.getArgument(0));

        partidaService.finalizarRonda(partida);

        assertNotNull(partida.getFechaFin());
        verify(mockPuntuacion, times(1)).procesarFinPartida(partida);
    }

    // =========================================================================
    // 4. MULTIPLE WINNERS (F19)
    // =========================================================================

    @Test
    public void adversarialMultipleWinnersRecordsAllTiedInPartidaGanadores() {
        // Scenario A: 2-way tie
        Usuario u1 = buildUsuario(1L, "u1");
        Usuario u2 = buildUsuario(2L, "u2");
        Usuario u3 = buildUsuario(3L, "u3");
        Usuario u4 = buildUsuario(4L, "u4");

        Jugador j1 = buildJugador(1L, "J1", u1);
        Jugador j2 = buildJugador(2L, "J2", u2);
        Jugador j3 = buildJugador(3L, "J3", u3);
        Jugador j4 = buildJugador(4L, "J4", u4);

        j1.setPuntuacionTotal(40);
        j2.setPuntuacionTotal(40);
        j3.setPuntuacionTotal(25);
        j4.setPuntuacionTotal(10);

        Partida partidaA = new Partida();
        partidaA.setJugadores(List.of(j1, j2, j3, j4));

        List<Usuario> ganadoresA = puntuacionService.determinarGanadores(partidaA);

        assertEquals(2, ganadoresA.size());
        assertTrue(ganadoresA.contains(u1));
        assertTrue(ganadoresA.contains(u2));
        assertFalse(ganadoresA.contains(u3));
        assertFalse(ganadoresA.contains(u4));
        assertEquals(ganadoresA, partidaA.getGanadores());

        // Scenario B: 4-way tie (all tied for 1st)
        j1.setPuntuacionTotal(30);
        j2.setPuntuacionTotal(30);
        j3.setPuntuacionTotal(30);
        j4.setPuntuacionTotal(30);

        Partida partidaB = new Partida();
        partidaB.setJugadores(List.of(j1, j2, j3, j4));

        List<Usuario> ganadoresB = puntuacionService.determinarGanadores(partidaB);

        assertEquals(4, ganadoresB.size());
        assertTrue(ganadoresB.contains(u1));
        assertTrue(ganadoresB.contains(u2));
        assertTrue(ganadoresB.contains(u3));
        assertTrue(ganadoresB.contains(u4));
        assertEquals(4, partidaB.getGanadores().size());

        // Scenario C: 1 clear winner, 3 tied for 2nd
        j1.setPuntuacionTotal(50);
        j2.setPuntuacionTotal(20);
        j3.setPuntuacionTotal(20);
        j4.setPuntuacionTotal(20);

        Partida partidaC = new Partida();
        partidaC.setJugadores(List.of(j1, j2, j3, j4));

        List<Usuario> ganadoresC = puntuacionService.determinarGanadores(partidaC);

        assertEquals(1, ganadoresC.size());
        assertEquals(u1, ganadoresC.get(0));
        assertEquals(List.of(u1), partidaC.getGanadores());
    }

    // =========================================================================
    // 5. STATISTICS ACCUMULATION & TIED WINNER UPDATES
    // =========================================================================

    @Test
    public void adversarialStatisticsUpdateCorrectlyIncrementsVictoriasDerrotasAndAccumulatesTotalsForTiedWinners() {
        when(estadisticasRepository.save(any(Estadisticas.class))).thenAnswer(i -> i.getArgument(0));

        // Pre-existing stats
        Usuario u1 = buildUsuario(1L, "u1");
        Estadisticas s1 = u1.getEstadisticas();
        s1.setPartidasJugadas(5);
        s1.setVictorias(2);
        s1.setDerrotas(3);
        s1.setPuntuacionTotal(100);
        s1.setTokensColocados(15);
        s1.setTiempoTotalJuego(120);

        Usuario u2 = buildUsuario(2L, "u2");
        Estadisticas s2 = u2.getEstadisticas();
        s2.setPartidasJugadas(10);
        s2.setVictorias(4);
        s2.setDerrotas(6);
        s2.setPuntuacionTotal(200);
        s2.setTokensColocados(30);
        s2.setTiempoTotalJuego(250);

        Usuario u3 = buildUsuario(3L, "u3");
        Estadisticas s3 = u3.getEstadisticas();
        s3.setPartidasJugadas(3);
        s3.setVictorias(1);
        s3.setDerrotas(2);
        s3.setPuntuacionTotal(60);
        s3.setTokensColocados(10);
        s3.setTiempoTotalJuego(80);

        // Player 4 starts with null stats (tests lazy initialization)
        Usuario u4 = buildUsuario(4L, "u4");
        u4.setEstadisticas(null);

        Jugador j1 = buildJugador(1L, "J1", u1);
        Jugador j2 = buildJugador(2L, "J2", u2);
        Jugador j3 = buildJugador(3L, "J3", u3);
        Jugador j4 = buildJugador(4L, "J4", u4);

        // Scores
        j1.setPuntuacionTotal(42);
        j2.setPuntuacionTotal(42);
        j3.setPuntuacionTotal(28);
        j4.setPuntuacionTotal(20);

        // Tokens
        asignarTokensAJugador(j1, 5, 15); // 5 colocados, 15 no colocados
        asignarTokensAJugador(j2, 3, 17); // 3 colocados, 17 no colocados
        asignarTokensAJugador(j3, 6, 14); // 6 colocados, 14 no colocados
        asignarTokensAJugador(j4, 2, 18); // 2 colocados, 18 no colocados

        Partida partida = new Partida();
        partida.setDuracionTotal(45);
        partida.setJugadores(List.of(j1, j2, j3, j4));

        List<Usuario> ganadores = List.of(u1, u2); // Tied winners

        puntuacionService.actualizarEstadisticas(partida, ganadores);

        // Verify U1 (Winner in tie)
        assertEquals(6, s1.getPartidasJugadas(), "partidasJugadas + 1");
        assertEquals(3, s1.getVictorias(), "victorias + 1 for tied winner");
        assertEquals(3, s1.getDerrotas(), "derrotas unchanged for tied winner");
        assertEquals(142, s1.getPuntuacionTotal(), "puntuacionTotal accumulated (+42)");
        assertEquals(20, s1.getTokensColocados(), "tokensColocados accumulated (+5)");
        assertEquals(165, s1.getTiempoTotalJuego(), "tiempoTotalJuego accumulated (+45)");

        // Verify U2 (Winner in tie)
        assertEquals(11, s2.getPartidasJugadas(), "partidasJugadas + 1");
        assertEquals(5, s2.getVictorias(), "victorias + 1 for tied winner");
        assertEquals(6, s2.getDerrotas(), "derrotas unchanged for tied winner");
        assertEquals(242, s2.getPuntuacionTotal(), "puntuacionTotal accumulated (+42)");
        assertEquals(33, s2.getTokensColocados(), "tokensColocados accumulated (+3)");
        assertEquals(295, s2.getTiempoTotalJuego(), "tiempoTotalJuego accumulated (+45)");

        // Verify U3 (Loser)
        assertEquals(4, s3.getPartidasJugadas(), "partidasJugadas + 1");
        assertEquals(1, s3.getVictorias(), "victorias unchanged for loser");
        assertEquals(3, s3.getDerrotas(), "derrotas + 1 for loser");
        assertEquals(88, s3.getPuntuacionTotal(), "puntuacionTotal accumulated (+28)");
        assertEquals(16, s3.getTokensColocados(), "tokensColocados accumulated (+6)");
        assertEquals(125, s3.getTiempoTotalJuego(), "tiempoTotalJuego accumulated (+45)");

        // Verify U4 (Loser, initialized from null)
        Estadisticas s4 = u4.getEstadisticas();
        assertNotNull(s4, "Estadisticas should have been initialized");
        assertEquals(1, s4.getPartidasJugadas());
        assertEquals(0, s4.getVictorias());
        assertEquals(1, s4.getDerrotas());
        assertEquals(20, s4.getPuntuacionTotal());
        assertEquals(2, s4.getTokensColocados());
        assertEquals(45, s4.getTiempoTotalJuego());

        verify(estadisticasRepository, times(4)).save(any(Estadisticas.class));
    }

    @Test
    public void adversarialStatisticsUpdateDefensiveGuards() {
        when(estadisticasRepository.save(any(Estadisticas.class))).thenAnswer(i -> i.getArgument(0));

        // 1. partida == null
        assertDoesNotThrow(() -> puntuacionService.actualizarEstadisticas(null, List.of()));

        // 2. partida.getJugadores() == null
        Partida partidaSinJugadores = new Partida();
        partidaSinJugadores.setJugadores(null);
        assertDoesNotThrow(() -> puntuacionService.actualizarEstadisticas(partidaSinJugadores, List.of()));

        // 3. Jugador without Usuario
        Jugador jSinUsuario = buildJugador(10L, "SinUsuario", null);
        jSinUsuario.setTokens(null);
        Partida partidaConJugadorSinUsuario = new Partida();
        partidaConJugadorSinUsuario.setJugadores(List.of(jSinUsuario));
        assertDoesNotThrow(() -> puntuacionService.actualizarEstadisticas(partidaConJugadorSinUsuario, List.of()));

        // 4. Jugador with null tokens
        Usuario u = buildUsuario(20L, "u20");
        Jugador jSinTokens = buildJugador(20L, "SinTokens", u);
        jSinTokens.setTokens(null);
        Partida partidaConJugadorSinTokens = new Partida();
        partidaConJugadorSinTokens.setJugadores(List.of(jSinTokens));
        assertDoesNotThrow(() -> puntuacionService.actualizarEstadisticas(partidaConJugadorSinTokens, List.of()));
        assertEquals(0, u.getEstadisticas().getTokensColocados());

        // 5. ganadores is null: all players receive derrotas + 1
        Usuario uGanadorNull = buildUsuario(30L, "u30");
        Jugador jGanadorNull = buildJugador(30L, "j30", uGanadorNull);
        Partida partidaGanadoresNull = new Partida();
        partidaGanadoresNull.setJugadores(List.of(jGanadorNull));
        assertDoesNotThrow(() -> puntuacionService.actualizarEstadisticas(partidaGanadoresNull, null));
        assertEquals(1, uGanadorNull.getEstadisticas().getDerrotas());
        assertEquals(0, uGanadorNull.getEstadisticas().getVictorias());
    }

    // =========================================================================
    // 6. END-TO-END COMPLETE LIFECYCLE SIMULATION
    // =========================================================================

    @Test
    public void fullEndToEndGameSimulationFromInitToRoundsToScoringAndStats() {
        when(tableroRepository.save(any(Tablero.class))).thenAnswer(i -> i.getArgument(0));
        when(partidaRepository.save(any(Partida.class))).thenAnswer(i -> i.getArgument(0));
        when(jugadorRepository.saveAll(any())).thenAnswer(i -> i.getArgument(0));
        when(estadisticasRepository.save(any(Estadisticas.class))).thenAnswer(i -> i.getArgument(0));

        // 1. Setup 3 players
        Usuario u1 = buildUsuario(1L, "Alice");
        Usuario u2 = buildUsuario(2L, "Bob");
        Usuario u3 = buildUsuario(3L, "Charlie");

        Jugador j1 = buildJugador(1L, "AlicePlayer", u1);
        Jugador j2 = buildJugador(2L, "BobPlayer", u2);
        Jugador j3 = buildJugador(3L, "CharliePlayer", u3);

        Partida partida = new Partida();
        setId(partida, 500L);
        partida.setJugadores(List.of(j1, j2, j3));

        when(partidaRepository.findById(500L)).thenReturn(Optional.of(partida));

        // 2. Start game
        Tablero tablero = partidaService.iniciarPartida(500L);

        assertNotNull(tablero);
        assertEquals(1, partida.getRondaActual());
        assertEquals(0, tablero.getSolPos());
        assertEquals(4, tablero.getLunaPos());
        assertEquals(9, tablero.getGrid().size());

        // 3. Play 8 rounds
        for (int r = 1; r <= 8; r++) {
            partida.getSeleccionesRonda().put(1L, 100L);
            partida.getSeleccionesRonda().put(2L, 100L);
            partida.getSeleccionesRonda().put(3L, 100L);
            partidaService.finalizarRonda(partida);
            assertEquals(r + 1, partida.getRondaActual());
        }

        assertEquals(9, partida.getRondaActual());

        // 4. Distribute tokens on the board for scoring
        // Musa Clio (7, 5, 3). j1 gets 3 tokens, j2 gets 3 tokens (tied 1st -> floor(12/2)=6), j3 gets 1 token (3rd -> 3)
        Musa musa0 = tablero.getGrid().stream()
                .filter(m -> m.getNombre() == TipoMusa.CLIO)
                .findFirst()
                .orElse(tablero.getGrid().get(0));
        colocarTokensEnMusa(musa0, j1, 3);
        colocarTokensEnMusa(musa0, j2, 3);
        colocarTokensEnMusa(musa0, j3, 1);

        // 5. Finalize round 9 (Triggers game end & scoring)
        partidaService.finalizarRonda(partida);

        assertNotNull(partida.getFechaFin());
        assertEquals(6, j1.getPuntuacionTotal());
        assertEquals(6, j2.getPuntuacionTotal());
        assertEquals(3, j3.getPuntuacionTotal());

        // Both Alice and Bob tied for highest score (6)
        assertEquals(2, partida.getGanadores().size());
        assertTrue(partida.getGanadores().contains(u1));
        assertTrue(partida.getGanadores().contains(u2));
        assertFalse(partida.getGanadores().contains(u3));

        // Verify stats
        assertEquals(1, u1.getEstadisticas().getVictorias());
        assertEquals(0, u1.getEstadisticas().getDerrotas());
        assertEquals(6, u1.getEstadisticas().getPuntuacionTotal());
        assertEquals(3, u1.getEstadisticas().getTokensColocados());

        assertEquals(1, u2.getEstadisticas().getVictorias());
        assertEquals(0, u2.getEstadisticas().getDerrotas());
        assertEquals(6, u2.getEstadisticas().getPuntuacionTotal());
        assertEquals(3, u2.getEstadisticas().getTokensColocados());

        assertEquals(0, u3.getEstadisticas().getVictorias());
        assertEquals(1, u3.getEstadisticas().getDerrotas());
        assertEquals(3, u3.getEstadisticas().getPuntuacionTotal());
        assertEquals(1, u3.getEstadisticas().getTokensColocados());
    }

    // =========================================================================
    // 7. EMPIRICAL VULNERABILITY REPRODUCTION: BIDIRECTIONAL HASHCODE / TOSTRING RECURSION
    // =========================================================================

    @Test
    public void testJugadorTokenBidirectionalRelationshipMustNotCauseStackOverflowOnHashCode() {
        Jugador j = new Jugador();
        Token t = new Token();
        t.setJugador(j);
        j.setTokens(List.of(t));

        // When Jugador is placed in a HashMap/HashSet (as PuntuacionService does),
        // mutual recursion between Jugador.hashCode and Token.hashCode must NOT trigger StackOverflowError.
        assertDoesNotThrow(() -> {
            j.hashCode();
        }, "Mutual recursion between Jugador.hashCode and Token.hashCode must be eliminated via @EqualsAndHashCode.Exclude");
    }

    @Test
    public void testJugadorTokenBidirectionalRelationshipMustNotCauseStackOverflowOnToString() {
        Jugador j = new Jugador();
        Token t = new Token();
        t.setJugador(j);
        j.setTokens(List.of(t));

        assertDoesNotThrow(() -> {
            j.toString();
        }, "Mutual recursion between Jugador.toString and Token.toString must be eliminated via @ToString.Exclude");
    }

    // =========================================================================
    // HELPERS
    // =========================================================================

    private void colocarTokensEnMusa(Musa musa, Jugador jugador, int cantidad) {
        for (int i = 0; i < cantidad; i++) {
            Token t = new Token();
            t.setColocado(true);
            t.setJugador(jugador);
            musa.getTokensColocados().add(t);
            jugador.getTokens().add(t);
        }
    }

    private void asignarTokensAJugador(Jugador j, int colocados, int noColocados) {
        List<Token> tokens = new ArrayList<>();
        for (int i = 0; i < colocados; i++) {
            Token t = new Token();
            t.setColocado(true);
            t.setJugador(j);
            tokens.add(t);
        }
        for (int i = 0; i < noColocados; i++) {
            Token t = new Token();
            t.setColocado(false);
            t.setJugador(j);
            tokens.add(t);
        }
        j.setTokens(tokens);
    }

    private Usuario buildUsuario(Long id, String username) {
        Usuario u = new Usuario();
        setId(u, id);
        u.setUsername(username);
        Estadisticas stats = new Estadisticas();
        setId(stats, id);
        u.setEstadisticas(stats);
        return u;
    }

    private Jugador buildJugador(Long id, String nombre, Usuario usuario) {
        Jugador j = new Jugador();
        setId(j, id);
        j.setNombre(nombre);
        j.setUsuario(usuario);
        j.setTokens(new ArrayList<>());
        return j;
    }

    private void setId(Object entity, Long id) {
        try {
            Field field = entity.getClass().getSuperclass().getDeclaredField("id");
            field.setAccessible(true);
            field.set(entity, id);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
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
