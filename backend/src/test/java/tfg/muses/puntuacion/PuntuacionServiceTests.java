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

public class PuntuacionServiceTests {

    private PuntuacionService puntuacionService;
    private EstadisticasRepository estadisticasRepository;
    private JugadorRepository jugadorRepository;
    private PartidaRepository partidaRepository;

    private Jugador jugador1;
    private Jugador jugador2;
    private Jugador jugador3;
    private Jugador jugador4;

    private Usuario usuario1;
    private Usuario usuario2;
    private Usuario usuario3;
    private Usuario usuario4;

    @BeforeEach
    public void setUp() throws Exception {
        estadisticasRepository = mock(EstadisticasRepository.class);
        jugadorRepository = mock(JugadorRepository.class);
        partidaRepository = mock(PartidaRepository.class);

        puntuacionService = new PuntuacionService();
        injectField(puntuacionService, "estadisticasRepository", estadisticasRepository);
        injectField(puntuacionService, "jugadorRepository", jugadorRepository);
        injectField(puntuacionService, "partidaRepository", partidaRepository);

        usuario1 = buildUsuario(1L, "user1");
        usuario2 = buildUsuario(2L, "user2");
        usuario3 = buildUsuario(3L, "user3");
        usuario4 = buildUsuario(4L, "user4");

        jugador1 = buildJugador(1L, "Jugador1", usuario1);
        jugador2 = buildJugador(2L, "Jugador2", usuario2);
        jugador3 = buildJugador(3L, "Jugador3", usuario3);
        jugador4 = buildJugador(4L, "Jugador4", usuario4);
    }

    // ── F15: Contar tokens por jugador ────────────────────────────────────────

    @Test
    public void contarTokensPorJugadorEnMusa() {
        Musa musa = buildMusa(TipoMusa.CLIO);
        asignarTokensAMusa(musa, jugador1, 3);
        asignarTokensAMusa(musa, jugador2, 1);

        List<Jugador> jugadores = List.of(jugador1, jugador2, jugador3);
        Map<Jugador, Integer> resultado = puntuacionService.contarTokensPorJugador(musa, jugadores);

        assertEquals(3, resultado.get(jugador1));
        assertEquals(1, resultado.get(jugador2));
        assertEquals(0, resultado.get(jugador3));
    }

    // ── F16 & F17: Puntuación por musa y resolución de empates ────────────────

    @Test
    public void calcularPuntosMusaSinEmpates() {
        // CLIO: 1º=7, 2º=5, 3º=3
        Musa musa = buildMusa(TipoMusa.CLIO);
        asignarTokensAMusa(musa, jugador1, 4);
        asignarTokensAMusa(musa, jugador2, 2);
        asignarTokensAMusa(musa, jugador3, 1);

        List<Jugador> jugadores = List.of(jugador1, jugador2, jugador3);
        Map<Jugador, Integer> puntos = puntuacionService.calcularPuntosMusa(musa, jugadores);

        assertEquals(7, puntos.get(jugador1));
        assertEquals(5, puntos.get(jugador2));
        assertEquals(3, puntos.get(jugador3));
    }

    @Test
    public void calcularPuntosMusaEmpateDosJugadoresPrimerPuesto() {
        // CLIO: 1º=7, 2º=5, 3º=3. Empate 2 en 1º: floor((7+5)/2) = 6. 3º recibe 3.
        Musa musa = buildMusa(TipoMusa.CLIO);
        asignarTokensAMusa(musa, jugador1, 3);
        asignarTokensAMusa(musa, jugador2, 3);
        asignarTokensAMusa(musa, jugador3, 1);

        List<Jugador> jugadores = List.of(jugador1, jugador2, jugador3);
        Map<Jugador, Integer> puntos = puntuacionService.calcularPuntosMusa(musa, jugadores);

        assertEquals(6, puntos.get(jugador1));
        assertEquals(6, puntos.get(jugador2));
        assertEquals(3, puntos.get(jugador3));
    }

    @Test
    public void calcularPuntosMusaEmpateTresJugadoresPrimerPuesto() {
        // CLIO: 7, 5, 3. Suma = 15. Empate 3 en 1º: floor(15/3) = 5 cada uno. 4º recibe 0.
        Musa musa = buildMusa(TipoMusa.CLIO);
        asignarTokensAMusa(musa, jugador1, 2);
        asignarTokensAMusa(musa, jugador2, 2);
        asignarTokensAMusa(musa, jugador3, 2);
        asignarTokensAMusa(musa, jugador4, 1);

        List<Jugador> jugadores = List.of(jugador1, jugador2, jugador3, jugador4);
        Map<Jugador, Integer> puntos = puntuacionService.calcularPuntosMusa(musa, jugadores);

        assertEquals(5, puntos.get(jugador1));
        assertEquals(5, puntos.get(jugador2));
        assertEquals(5, puntos.get(jugador3));
        assertEquals(0, puntos.get(jugador4));
    }

    @Test
    public void calcularPuntosMusaEmpateCuatroJugadoresPrimerPuesto() {
        // CLIO: 7, 5, 3. Suma = 15. Empate 4 en 1º: floor(15/4) = 3 cada uno.
        Musa musa = buildMusa(TipoMusa.CLIO);
        asignarTokensAMusa(musa, jugador1, 2);
        asignarTokensAMusa(musa, jugador2, 2);
        asignarTokensAMusa(musa, jugador3, 2);
        asignarTokensAMusa(musa, jugador4, 2);

        List<Jugador> jugadores = List.of(jugador1, jugador2, jugador3, jugador4);
        Map<Jugador, Integer> puntos = puntuacionService.calcularPuntosMusa(musa, jugadores);

        assertEquals(3, puntos.get(jugador1));
        assertEquals(3, puntos.get(jugador2));
        assertEquals(3, puntos.get(jugador3));
        assertEquals(3, puntos.get(jugador4));
    }

    @Test
    public void calcularPuntosMusaEmpateDosJugadoresSegundoPuesto() {
        // CLIO: 7, 5, 3. 1º=7. Empate 2 en 2º: floor((5+3)/2) = 4. 4º recibe 0.
        Musa musa = buildMusa(TipoMusa.CLIO);
        asignarTokensAMusa(musa, jugador1, 5);
        asignarTokensAMusa(musa, jugador2, 3);
        asignarTokensAMusa(musa, jugador3, 3);
        asignarTokensAMusa(musa, jugador4, 1);

        List<Jugador> jugadores = List.of(jugador1, jugador2, jugador3, jugador4);
        Map<Jugador, Integer> puntos = puntuacionService.calcularPuntosMusa(musa, jugadores);

        assertEquals(7, puntos.get(jugador1));
        assertEquals(4, puntos.get(jugador2));
        assertEquals(4, puntos.get(jugador3));
        assertEquals(0, puntos.get(jugador4));
    }

    @Test
    public void calcularPuntosMusaEmpateTresJugadoresSegundoPuesto() {
        // CLIO: 7, 5, 3. 1º=7. Empate 3 en 2º: floor((5+3)/3) = 2.
        Musa musa = buildMusa(TipoMusa.CLIO);
        asignarTokensAMusa(musa, jugador1, 5);
        asignarTokensAMusa(musa, jugador2, 2);
        asignarTokensAMusa(musa, jugador3, 2);
        asignarTokensAMusa(musa, jugador4, 2);

        List<Jugador> jugadores = List.of(jugador1, jugador2, jugador3, jugador4);
        Map<Jugador, Integer> puntos = puntuacionService.calcularPuntosMusa(musa, jugadores);

        assertEquals(7, puntos.get(jugador1));
        assertEquals(2, puntos.get(jugador2));
        assertEquals(2, puntos.get(jugador3));
        assertEquals(2, puntos.get(jugador4));
    }

    @Test
    public void calcularPuntosMusaEmpateTercerPuesto() {
        // CLIO: 7, 5, 3. 1º=7, 2º=5. Empate 2 en 3º: floor(3/2) = 1.
        Musa musa = buildMusa(TipoMusa.CLIO);
        asignarTokensAMusa(musa, jugador1, 6);
        asignarTokensAMusa(musa, jugador2, 4);
        asignarTokensAMusa(musa, jugador3, 2);
        asignarTokensAMusa(musa, jugador4, 2);

        List<Jugador> jugadores = List.of(jugador1, jugador2, jugador3, jugador4);
        Map<Jugador, Integer> puntos = puntuacionService.calcularPuntosMusa(musa, jugadores);

        assertEquals(7, puntos.get(jugador1));
        assertEquals(5, puntos.get(jugador2));
        assertEquals(1, puntos.get(jugador3));
        assertEquals(1, puntos.get(jugador4));
    }

    @Test
    public void calcularPuntosMusaJugadorConCeroTokensObtieneCeroPuntos() {
        // Solo jugador1 tiene tokens. Los demás tienen 0 y no deben recibir puntos aunque queden puestos vacíos.
        Musa musa = buildMusa(TipoMusa.CLIO);
        asignarTokensAMusa(musa, jugador1, 3);

        List<Jugador> jugadores = List.of(jugador1, jugador2, jugador3);
        Map<Jugador, Integer> puntos = puntuacionService.calcularPuntosMusa(musa, jugadores);

        assertEquals(7, puntos.get(jugador1));
        assertEquals(0, puntos.get(jugador2));
        assertEquals(0, puntos.get(jugador3));
    }

    // ── F18: Calcular puntuación total de la partida ───────────────────────────

    @Test
    public void calcularPuntuacionTotalPartidaAcumulaTodasLasMusas() {
        Partida partida = new Partida();
        Tablero tablero = new Tablero();
        List<Musa> grid = new ArrayList<>();

        for (TipoMusa tipo : TipoMusa.values()) {
            grid.add(buildMusa(tipo));
        }
        tablero.setGrid(grid);
        partida.setTablero(tablero);

        List<Jugador> jugadores = List.of(jugador1, jugador2);
        partida.setJugadores(jugadores);

        // Colocar tokens en la primera musa (grid.get(0))
        asignarTokensAMusa(grid.get(0), jugador1, 5);
        asignarTokensAMusa(grid.get(0), jugador2, 2);

        // Colocar tokens en la segunda musa (grid.get(1))
        asignarTokensAMusa(grid.get(1), jugador1, 1);
        asignarTokensAMusa(grid.get(1), jugador2, 4);

        when(jugadorRepository.saveAll(any())).thenAnswer(i -> i.getArgument(0));

        puntuacionService.calcularPuntuacionTotalPartida(partida);

        int esperadoJ1 = grid.get(0).getPuntos(1) + grid.get(1).getPuntos(2);
        int esperadoJ2 = grid.get(0).getPuntos(2) + grid.get(1).getPuntos(1);

        assertEquals(esperadoJ1, jugador1.getPuntuacionTotal());
        assertEquals(esperadoJ2, jugador2.getPuntuacionTotal());
        verify(jugadorRepository).saveAll(jugadores);
    }

    // ── F19: Determinar ganadores (soporte para empates) ───────────────────────

    @Test
    public void determinarGanadoresSoportaGanadorUnico() {
        Partida partida = new Partida();
        jugador1.setPuntuacionTotal(35);
        jugador2.setPuntuacionTotal(28);
        partida.setJugadores(List.of(jugador1, jugador2));

        List<Usuario> ganadores = puntuacionService.determinarGanadores(partida);

        assertEquals(1, ganadores.size());
        assertTrue(ganadores.contains(usuario1));
        assertEquals(List.of(usuario1), partida.getGanadores());
    }

    @Test
    public void determinarGanadoresSoportaEmpates() {
        Partida partida = new Partida();
        jugador1.setPuntuacionTotal(30);
        jugador2.setPuntuacionTotal(30);
        jugador3.setPuntuacionTotal(20);
        partida.setJugadores(List.of(jugador1, jugador2, jugador3));

        List<Usuario> ganadores = puntuacionService.determinarGanadores(partida);

        assertEquals(2, ganadores.size());
        assertTrue(ganadores.contains(usuario1));
        assertTrue(ganadores.contains(usuario2));
        assertFalse(ganadores.contains(usuario3));
        assertEquals(2, partida.getGanadores().size());
    }

    // ── Estadísticas ─────────────────────────────────────────────────────────

    @Test
    public void actualizarEstadisticasCalculaYGuardaDatos() {
        Partida partida = new Partida();
        partida.setDuracionTotal(40);

        jugador1.setPuntuacionTotal(30);
        jugador2.setPuntuacionTotal(25);

        // Configurar tokens para verificar acumulación de tokensColocados
        List<Token> tokensJ1 = new ArrayList<>();
        Token t1 = new Token();
        t1.setColocado(true);
        Token t2 = new Token();
        t2.setColocado(false);
        tokensJ1.add(t1);
        tokensJ1.add(t2);
        jugador1.setTokens(tokensJ1);

        List<Token> tokensJ2 = new ArrayList<>();
        Token t3 = new Token();
        t3.setColocado(true);
        tokensJ2.add(t3);
        jugador2.setTokens(tokensJ2);

        partida.setJugadores(List.of(jugador1, jugador2));
        List<Usuario> ganadores = List.of(usuario1);
        partida.setGanadores(ganadores);

        when(estadisticasRepository.save(any(Estadisticas.class))).thenAnswer(i -> i.getArgument(0));

        puntuacionService.actualizarEstadisticas(partida, ganadores);

        // Usuario 1 (Ganador)
        Estadisticas stats1 = usuario1.getEstadisticas();
        assertEquals(1, stats1.getPartidasJugadas());
        assertEquals(1, stats1.getVictorias());
        assertEquals(0, stats1.getDerrotas());
        assertEquals(30, stats1.getPuntuacionTotal());
        assertEquals(1, stats1.getTokensColocados());
        assertEquals(40, stats1.getTiempoTotalJuego());

        // Usuario 2 (Derrotado)
        Estadisticas stats2 = usuario2.getEstadisticas();
        assertEquals(1, stats2.getPartidasJugadas());
        assertEquals(0, stats2.getVictorias());
        assertEquals(1, stats2.getDerrotas());
        assertEquals(25, stats2.getPuntuacionTotal());
        assertEquals(1, stats2.getTokensColocados());
        assertEquals(40, stats2.getTiempoTotalJuego());

        verify(estadisticasRepository, times(2)).save(any(Estadisticas.class));
    }

    // ── Helper methods ────────────────────────────────────────────────────────

    private Musa buildMusa(TipoMusa tipo) {
        Musa musa = new Musa();
        musa.setNombre(tipo);
        musa.setTokensColocados(new ArrayList<>());
        return musa;
    }

    private void asignarTokensAMusa(Musa musa, Jugador jugador, int cantidad) {
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
