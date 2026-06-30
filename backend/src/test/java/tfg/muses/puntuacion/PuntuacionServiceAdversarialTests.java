package tfg.muses.puntuacion;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import java.lang.reflect.Field;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import tfg.muses.estadisticas.Estadisticas;
import tfg.muses.estadisticas.EstadisticasRepository;
import tfg.muses.jugador.Jugador;
import tfg.muses.jugador.JugadorRepository;
import tfg.muses.musa.Musa;
import tfg.muses.musa.TipoMusa;
import tfg.muses.partida.Partida;
import tfg.muses.partida.PartidaRepository;
import tfg.muses.tablero.Tablero;
import tfg.muses.token.Token;
import tfg.muses.usuario.Usuario;

/**
 * Adversarial Stress & Edge-Case Verification Suite for PuntuacionService.
 * Exhaustively challenges all tie-breaking combinations, boundary conditions,
 * mathematical division invariants, and defensive null guards.
 */
public class PuntuacionServiceAdversarialTests {

    private PuntuacionService puntuacionService;
    private EstadisticasRepository estadisticasRepository;
    private JugadorRepository jugadorRepository;
    private PartidaRepository partidaRepository;

    private List<Jugador> jugadores;
    private List<Usuario> usuarios;

    @BeforeEach
    public void setUp() throws Exception {
        estadisticasRepository = mock(EstadisticasRepository.class);
        jugadorRepository = mock(JugadorRepository.class);
        partidaRepository = mock(PartidaRepository.class);

        puntuacionService = new PuntuacionService();
        injectField(puntuacionService, "estadisticasRepository", estadisticasRepository);
        injectField(puntuacionService, "jugadorRepository", jugadorRepository);
        injectField(puntuacionService, "partidaRepository", partidaRepository);

        jugadores = new ArrayList<>();
        usuarios = new ArrayList<>();
        for (int i = 1; i <= 10; i++) {
            Usuario u = buildUsuario((long) i, "user" + i);
            Jugador j = buildJugador((long) i, "Jugador" + i, u);
            usuarios.add(u);
            jugadores.add(j);
        }
    }

    @Test
    public void testBidirectionalJugadorTokenCausesStackOverflowInHashMap() {
        Jugador j = jugadores.get(0);
        Token t = new Token();
        t.setColocado(true);
        t.setJugador(j);
        j.getTokens().add(t);

        Musa musa = buildMusa(TipoMusa.CLIO);
        musa.getTokensColocados().add(t);

        // HashMap in contarTokensPorJugador calls j.hashCode()
        assertDoesNotThrow(() -> puntuacionService.calcularPuntosMusa(musa, List.of(j)));
    }

    // =========================================================================
    // 1. 2-WAY TIE FOR 1ST PLACE SCENARIOS
    // =========================================================================

    @Test
    public void testDosEmpatanPrimeroYTerceroUnicoRecibeNivel3Completo() {
        // Clio: 7, 5, 3
        Musa musa = buildMusa(TipoMusa.CLIO);
        asignarTokens(musa, jugadores.get(0), 4);
        asignarTokens(musa, jugadores.get(1), 4);
        asignarTokens(musa, jugadores.get(2), 2);
        asignarTokens(musa, jugadores.get(3), 0);

        Map<Jugador, Integer> pts = puntuacionService.calcularPuntosMusa(musa, jugadores.subList(0, 4));

        assertEquals((int) Math.floor((7.0 + 5.0) / 2.0), pts.get(jugadores.get(0))); // 6
        assertEquals((int) Math.floor((7.0 + 5.0) / 2.0), pts.get(jugadores.get(1))); // 6
        assertEquals(3, pts.get(jugadores.get(2))); // 3
        assertEquals(0, pts.get(jugadores.get(3))); // 0 tokens = 0 pts
    }

    @Test
    public void testDosEmpatanPrimeroYDosEmpatanTerceroDividenNivel3() {
        // Clio: 7, 5, 3. 3º puesto tiene n3=3, dividido entre 2 -> floor(3/2) = 1
        Musa musa = buildMusa(TipoMusa.CLIO);
        asignarTokens(musa, jugadores.get(0), 5);
        asignarTokens(musa, jugadores.get(1), 5);
        asignarTokens(musa, jugadores.get(2), 2);
        asignarTokens(musa, jugadores.get(3), 2);

        Map<Jugador, Integer> pts = puntuacionService.calcularPuntosMusa(musa, jugadores.subList(0, 4));

        assertEquals(6, pts.get(jugadores.get(0)));
        assertEquals(6, pts.get(jugadores.get(1)));
        assertEquals(1, pts.get(jugadores.get(2)));
        assertEquals(1, pts.get(jugadores.get(3)));
    }

    @Test
    public void testDosEmpatanPrimeroYTresEmpatanTercero() {
        // Clio: 7, 5, 3. floor(3/3) = 1
        Musa musa = buildMusa(TipoMusa.CLIO);
        asignarTokens(musa, jugadores.get(0), 5);
        asignarTokens(musa, jugadores.get(1), 5);
        asignarTokens(musa, jugadores.get(2), 2);
        asignarTokens(musa, jugadores.get(3), 2);
        asignarTokens(musa, jugadores.get(4), 2);

        Map<Jugador, Integer> pts = puntuacionService.calcularPuntosMusa(musa, jugadores.subList(0, 5));

        assertEquals(6, pts.get(jugadores.get(0)));
        assertEquals(6, pts.get(jugadores.get(1)));
        assertEquals(1, pts.get(jugadores.get(2)));
        assertEquals(1, pts.get(jugadores.get(3)));
        assertEquals(1, pts.get(jugadores.get(4)));
    }

    @Test
    public void testDosEmpatanPrimeroSinTerceroConTokens() {
        // Clio: 7, 5, 3. Solo 2 jugadores pusieron tokens. Jugador 3 tiene 0 tokens.
        Musa musa = buildMusa(TipoMusa.CLIO);
        asignarTokens(musa, jugadores.get(0), 3);
        asignarTokens(musa, jugadores.get(1), 3);

        Map<Jugador, Integer> pts = puntuacionService.calcularPuntosMusa(musa, jugadores.subList(0, 3));

        assertEquals(6, pts.get(jugadores.get(0)));
        assertEquals(6, pts.get(jugadores.get(1)));
        assertEquals(0, pts.get(jugadores.get(2))); // Strictly 0
    }

    // =========================================================================
    // 2. 3+ WAY TIE FOR 1ST PLACE SCENARIOS
    // =========================================================================

    @Test
    public void testTresEmpatanPrimeroYCuartoConTokensRecibeCero() {
        // Clio: 7, 5, 3 -> suma = 15. floor(15/3) = 5.
        // Cuarto jugador tiene tokens pero los 3 primeros puestos ya fueron consumidos.
        Musa musa = buildMusa(TipoMusa.CLIO);
        asignarTokens(musa, jugadores.get(0), 3);
        asignarTokens(musa, jugadores.get(1), 3);
        asignarTokens(musa, jugadores.get(2), 3);
        asignarTokens(musa, jugadores.get(3), 1);

        Map<Jugador, Integer> pts = puntuacionService.calcularPuntosMusa(musa, jugadores.subList(0, 4));

        assertEquals(5, pts.get(jugadores.get(0)));
        assertEquals(5, pts.get(jugadores.get(1)));
        assertEquals(5, pts.get(jugadores.get(2)));
        assertEquals(0, pts.get(jugadores.get(3))); // 4th place gets 0
    }

    @Test
    public void testCuatroEmpatanPrimeroDivisionConTruncamiento() {
        // Melpomene: 9, 6, 3 -> suma = 18. floor(18/4) = 4 cada uno.
        Musa musa = buildMusa(TipoMusa.MELPOMENE);
        for (int i = 0; i < 4; i++) {
            asignarTokens(musa, jugadores.get(i), 2);
        }

        Map<Jugador, Integer> pts = puntuacionService.calcularPuntosMusa(musa, jugadores.subList(0, 4));

        for (int i = 0; i < 4; i++) {
            assertEquals(4, pts.get(jugadores.get(i)));
        }
    }

    @Test
    public void testDiezJugadoresEmpatanPrimeroDivisionExtrema() {
        // Clio: 7, 5, 3 -> suma = 15. floor(15/10) = 1 cada uno.
        Musa musa = buildMusa(TipoMusa.CLIO);
        for (int i = 0; i < 10; i++) {
            asignarTokens(musa, jugadores.get(i), 1);
        }

        Map<Jugador, Integer> pts = puntuacionService.calcularPuntosMusa(musa, jugadores);

        for (int i = 0; i < 10; i++) {
            assertEquals(1, pts.get(jugadores.get(i)));
        }
    }

    // =========================================================================
    // 3. TIE FOR 2ND PLACE SCENARIOS (SOLO 1ST PLACE)
    // =========================================================================

    @Test
    public void testSoloPrimeroYDosEmpatanSegundoCuartoConTokensRecibeCero() {
        // Clio: 7, 5, 3. 1º=7. 2º y 3º empatan: floor((5+3)/2) = 4.
        // Cuarto jugador tiene tokens pero no hay puestos disponibles -> 0 pts.
        Musa musa = buildMusa(TipoMusa.CLIO);
        asignarTokens(musa, jugadores.get(0), 5);
        asignarTokens(musa, jugadores.get(1), 3);
        asignarTokens(musa, jugadores.get(2), 3);
        asignarTokens(musa, jugadores.get(3), 1);

        Map<Jugador, Integer> pts = puntuacionService.calcularPuntosMusa(musa, jugadores.subList(0, 4));

        assertEquals(7, pts.get(jugadores.get(0)));
        assertEquals(4, pts.get(jugadores.get(1)));
        assertEquals(4, pts.get(jugadores.get(2)));
        assertEquals(0, pts.get(jugadores.get(3)));
    }

    @Test
    public void testSoloPrimeroYTresEmpatanSegundo() {
        // Talia: 8, 6, 4. 1º=8. 2º puesto empate de 3: floor((6+4)/3) = 3 cada uno.
        Musa musa = buildMusa(TipoMusa.TALIA);
        asignarTokens(musa, jugadores.get(0), 4);
        asignarTokens(musa, jugadores.get(1), 2);
        asignarTokens(musa, jugadores.get(2), 2);
        asignarTokens(musa, jugadores.get(3), 2);

        Map<Jugador, Integer> pts = puntuacionService.calcularPuntosMusa(musa, jugadores.subList(0, 4));

        assertEquals(8, pts.get(jugadores.get(0)));
        assertEquals(3, pts.get(jugadores.get(1)));
        assertEquals(3, pts.get(jugadores.get(2)));
        assertEquals(3, pts.get(jugadores.get(3)));
    }

    @Test
    public void testSoloPrimeroYCuatroEmpatanSegundoDivisionConTruncamiento() {
        // Talia: 8, 6, 4. 1º=8. Empate 4 en 2º: floor((6+4)/4) = floor(10/4) = 2 cada uno.
        Musa musa = buildMusa(TipoMusa.TALIA);
        asignarTokens(musa, jugadores.get(0), 6);
        for (int i = 1; i <= 4; i++) {
            asignarTokens(musa, jugadores.get(i), 2);
        }

        Map<Jugador, Integer> pts = puntuacionService.calcularPuntosMusa(musa, jugadores.subList(0, 5));

        assertEquals(8, pts.get(jugadores.get(0)));
        for (int i = 1; i <= 4; i++) {
            assertEquals(2, pts.get(jugadores.get(i)));
        }
    }

    // =========================================================================
    // 4. TIE FOR 3RD PLACE SCENARIOS (SOLO 1ST AND SOLO 2ND)
    // =========================================================================

    @Test
    public void testSoloPrimeroYSoloSegundoYEmpateTresTercero() {
        // Clio: 7, 5, 3. 1º=7, 2º=5. Empate 3 en 3º: floor(3/3) = 1 cada uno.
        Musa musa = buildMusa(TipoMusa.CLIO);
        asignarTokens(musa, jugadores.get(0), 6);
        asignarTokens(musa, jugadores.get(1), 4);
        asignarTokens(musa, jugadores.get(2), 2);
        asignarTokens(musa, jugadores.get(3), 2);
        asignarTokens(musa, jugadores.get(4), 2);

        Map<Jugador, Integer> pts = puntuacionService.calcularPuntosMusa(musa, jugadores.subList(0, 5));

        assertEquals(7, pts.get(jugadores.get(0)));
        assertEquals(5, pts.get(jugadores.get(1)));
        assertEquals(1, pts.get(jugadores.get(2)));
        assertEquals(1, pts.get(jugadores.get(3)));
        assertEquals(1, pts.get(jugadores.get(4)));
    }

    @Test
    public void testSoloPrimeroYSoloSegundoYEmpateCuatroTerceroDaCeroPuntosPorTruncamiento() {
        // Erato: 7, 4, 1. 1º=7, 2º=4. 3º puesto n3=1.
        // Empate de 2 en 3º: floor(1/2) = 0 puntos cada uno.
        Musa musa = buildMusa(TipoMusa.ERATO);
        asignarTokens(musa, jugadores.get(0), 5);
        asignarTokens(musa, jugadores.get(1), 3);
        asignarTokens(musa, jugadores.get(2), 1);
        asignarTokens(musa, jugadores.get(3), 1);

        Map<Jugador, Integer> pts = puntuacionService.calcularPuntosMusa(musa, jugadores.subList(0, 4));

        assertEquals(7, pts.get(jugadores.get(0)));
        assertEquals(4, pts.get(jugadores.get(1)));
        assertEquals(0, pts.get(jugadores.get(2)));
        assertEquals(0, pts.get(jugadores.get(3)));
    }

    // =========================================================================
    // 5. ZERO-TOKEN STRICT INVARIANT TESTS
    // =========================================================================

    @Test
    public void testTodosConCeroTokensRecibenEstrictamenteCero() {
        Musa musa = buildMusa(TipoMusa.CLIO);
        Map<Jugador, Integer> pts = puntuacionService.calcularPuntosMusa(musa, jugadores.subList(0, 4));

        for (int i = 0; i < 4; i++) {
            assertEquals(0, pts.get(jugadores.get(i)));
        }
    }

    @Test
    public void testSoloUnJugadorConTokensPuestosDosYTresNoSeOtorganANadie() {
        Musa musa = buildMusa(TipoMusa.CLIO);
        asignarTokens(musa, jugadores.get(0), 1);

        Map<Jugador, Integer> pts = puntuacionService.calcularPuntosMusa(musa, jugadores.subList(0, 4));

        assertEquals(7, pts.get(jugadores.get(0)));
        assertEquals(0, pts.get(jugadores.get(1)));
        assertEquals(0, pts.get(jugadores.get(2)));
        assertEquals(0, pts.get(jugadores.get(3)));
    }

    @Test
    public void testSoloDosJugadoresConTokensPuestoTresNoSeOtorgaANadie() {
        Musa musa = buildMusa(TipoMusa.CLIO);
        asignarTokens(musa, jugadores.get(0), 3);
        asignarTokens(musa, jugadores.get(1), 1);

        Map<Jugador, Integer> pts = puntuacionService.calcularPuntosMusa(musa, jugadores.subList(0, 4));

        assertEquals(7, pts.get(jugadores.get(0)));
        assertEquals(5, pts.get(jugadores.get(1)));
        assertEquals(0, pts.get(jugadores.get(2)));
        assertEquals(0, pts.get(jugadores.get(3)));
    }

    // =========================================================================
    // 6. ALL 9 MUSES EXHAUSTIVE MATHEMATICAL ACCURACY
    // =========================================================================

    @Test
    public void testTodasLasNueveMusasCalculanDesempatesCorrectamente() {
        for (TipoMusa tipo : TipoMusa.values()) {
            Musa musa = buildMusa(tipo);
            int n1 = tipo.getPuntos(1);
            int n2 = tipo.getPuntos(2);
            int n3 = tipo.getPuntos(3);

            // Test 1: Sin empates
            musa.setTokensColocados(new ArrayList<>());
            asignarTokens(musa, jugadores.get(0), 3);
            asignarTokens(musa, jugadores.get(1), 2);
            asignarTokens(musa, jugadores.get(2), 1);
            Map<Jugador, Integer> res1 = puntuacionService.calcularPuntosMusa(musa, jugadores.subList(0, 3));
            assertEquals(n1, res1.get(jugadores.get(0)), "Fallo n1 en " + tipo);
            assertEquals(n2, res1.get(jugadores.get(1)), "Fallo n2 en " + tipo);
            assertEquals(n3, res1.get(jugadores.get(2)), "Fallo n3 en " + tipo);

            // Test 2: Empate 2 en 1º + 3º solitario
            musa.setTokensColocados(new ArrayList<>());
            asignarTokens(musa, jugadores.get(0), 3);
            asignarTokens(musa, jugadores.get(1), 3);
            asignarTokens(musa, jugadores.get(2), 1);
            Map<Jugador, Integer> res2 = puntuacionService.calcularPuntosMusa(musa, jugadores.subList(0, 3));
            int expectedPts1 = (int) Math.floor((double) (n1 + n2) / 2);
            assertEquals(expectedPts1, res2.get(jugadores.get(0)), "Fallo empate 1º en " + tipo);
            assertEquals(expectedPts1, res2.get(jugadores.get(1)), "Fallo empate 1º en " + tipo);
            assertEquals(n3, res2.get(jugadores.get(2)), "Fallo 3º tras empate 1º en " + tipo);

            // Test 3: Empate 3 en 1º
            musa.setTokensColocados(new ArrayList<>());
            asignarTokens(musa, jugadores.get(0), 2);
            asignarTokens(musa, jugadores.get(1), 2);
            asignarTokens(musa, jugadores.get(2), 2);
            Map<Jugador, Integer> res3 = puntuacionService.calcularPuntosMusa(musa, jugadores.subList(0, 3));
            int expectedPts3Way = (int) Math.floor((double) (n1 + n2 + n3) / 3);
            assertEquals(expectedPts3Way, res3.get(jugadores.get(0)), "Fallo empate 3-way en " + tipo);
            assertEquals(expectedPts3Way, res3.get(jugadores.get(1)), "Fallo empate 3-way en " + tipo);
            assertEquals(expectedPts3Way, res3.get(jugadores.get(2)), "Fallo empate 3-way en " + tipo);
        }
    }

    // =========================================================================
    // 7. ROBUSTNESS & DEFENSIVE BOUNDARY CONDITIONS
    // =========================================================================

    @Test
    public void testMusaNullRetornaCeroParaTodos() {
        Map<Jugador, Integer> pts = puntuacionService.calcularPuntosMusa(null, jugadores.subList(0, 3));
        assertEquals(3, pts.size());
        assertEquals(0, pts.get(jugadores.get(0)));
    }

    @Test
    public void testTokensColocadosNullRetornaCeroParaTodos() {
        Musa musa = buildMusa(TipoMusa.CLIO);
        musa.setTokensColocados(null);

        Map<Jugador, Integer> pts = puntuacionService.calcularPuntosMusa(musa, jugadores.subList(0, 3));
        assertEquals(3, pts.size());
        assertEquals(0, pts.get(jugadores.get(0)));
    }

    @Test
    public void testListaJugadoresVaciaRetornaMapaVacio() {
        Musa musa = buildMusa(TipoMusa.CLIO);
        Map<Jugador, Integer> pts = puntuacionService.calcularPuntosMusa(musa, List.of());
        assertTrue(pts.isEmpty());
    }

    @Test
    public void testTokenConJugadorNullEnMusaNoLanzaExcepcion() {
        Musa musa = buildMusa(TipoMusa.CLIO);
        Token tCorrupto = new Token();
        tCorrupto.setJugador(null);
        musa.getTokensColocados().add(tCorrupto);

        asignarTokens(musa, jugadores.get(0), 2);

        Map<Jugador, Integer> pts = puntuacionService.calcularPuntosMusa(musa, jugadores.subList(0, 2));
        assertEquals(7, pts.get(jugadores.get(0)));
        assertEquals(0, pts.get(jugadores.get(1)));
    }

    @Test
    public void testTokenDeJugadorAjenoNoAfectaRecuento() {
        Musa musa = buildMusa(TipoMusa.CLIO);
        Jugador ajeno = buildJugador(999L, "Ajeno", null);
        asignarTokens(musa, ajeno, 10);
        asignarTokens(musa, jugadores.get(0), 1);

        Map<Jugador, Integer> pts = puntuacionService.calcularPuntosMusa(musa, jugadores.subList(0, 1));
        assertEquals(7, pts.get(jugadores.get(0)));
    }

    // =========================================================================
    // 8. WINNER DETERMINATION EDGE CASES
    // =========================================================================

    @Test
    public void testDeterminarGanadoresConEmpateTotalCeroPuntos() {
        Partida partida = new Partida();
        jugadores.get(0).setPuntuacionTotal(0);
        jugadores.get(1).setPuntuacionTotal(0);
        jugadores.get(2).setPuntuacionTotal(0);
        partida.setJugadores(jugadores.subList(0, 3));

        List<Usuario> ganadores = puntuacionService.determinarGanadores(partida);
        assertEquals(3, ganadores.size());
        assertTrue(ganadores.contains(usuarios.get(0)));
        assertTrue(ganadores.contains(usuarios.get(1)));
        assertTrue(ganadores.contains(usuarios.get(2)));
    }

    @Test
    public void testDeterminarGanadoresConPartidaNullOJugadoresVacios() {
        assertTrue(puntuacionService.determinarGanadores(null).isEmpty());

        Partida partida = new Partida();
        partida.setJugadores(List.of());
        assertTrue(puntuacionService.determinarGanadores(partida).isEmpty());
    }

    // =========================================================================
    // 9. HELPER METHODS
    // =========================================================================

    private Musa buildMusa(TipoMusa tipo) {
        Musa musa = new Musa();
        musa.setNombre(tipo);
        musa.setTokensColocados(new ArrayList<>());
        return musa;
    }

    private void asignarTokens(Musa musa, Jugador jugador, int cantidad) {
        for (int i = 0; i < cantidad; i++) {
            Token token = new Token();
            token.setColocado(true);
            token.setJugador(jugador);
            musa.getTokensColocados().add(token);
        }
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
