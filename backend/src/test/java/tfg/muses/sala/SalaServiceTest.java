package tfg.muses.sala;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import java.lang.reflect.Field;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import tfg.muses.bot.BotService;
import tfg.muses.exception.ResourceNotFoundException;
import tfg.muses.jugador.Jugador;
import tfg.muses.jugador.JugadorService;
import tfg.muses.partida.Partida;
import tfg.muses.partida.PartidaService;

/**
 * Tests unitarios para SalaService (F33, F34, F35).
 * Se usan mocks manuales para mantener la misma estructura que BotServiceTest.
 */
public class SalaServiceTest {

    private SalaService salaService;

    private SalaRepository salaRepository;
    private PartidaService partidaService;
    private JugadorService jugadorService;
    private BotService botService;

    private Jugador anfitrion;
    private Jugador jugador2;

    @BeforeEach
    void setUp() throws Exception {
        salaService = new SalaService();

        salaRepository = mock(SalaRepository.class);
        partidaService = mock(PartidaService.class);
        jugadorService = mock(JugadorService.class);
        botService = mock(BotService.class);

        injectField(salaService, "salaRepository", salaRepository);
        injectField(salaService, "partidaService", partidaService);
        injectField(salaService, "jugadorService", jugadorService);
        injectField(salaService, "botService", botService);
        injectField(salaService, "messagingTemplate", null);

        anfitrion = new Jugador();
        anfitrion.setNombre("Anfitrion");
        setId(anfitrion, 1L);

        jugador2 = new Jugador();
        jugador2.setNombre("Jugador2");
        setId(jugador2, 2L);

        when(salaRepository.existsByCodigo(any())).thenReturn(false);
        when(salaRepository.save(any(Sala.class))).thenAnswer(inv -> inv.getArgument(0));
    }

    // --- F33: Crear sala ---

    @Nested
    @DisplayName("F33: Crear sala")
    class CrearSalaTests {

        @Test
        @DisplayName("Crear sala genera código con prefijo MUS-")
        void crearSala_codigoConPrefijo() {
            Sala sala = salaService.crearSala(anfitrion, 4);

            assertNotNull(sala.getCodigo());
            assertTrue(sala.getCodigo().startsWith("MUS-"),
                    "El código debe empezar por MUS-");
            assertEquals(EstadoSala.ESPERANDO, sala.getEstado());
        }

        @Test
        @DisplayName("Crear sala con maxJugadores válido persiste el anfitrión")
        void crearSala_anfitrionEnListaJugadores() {
            Sala sala = salaService.crearSala(anfitrion, 3);

            assertEquals(anfitrion, sala.getAnfitrion());
            assertTrue(sala.getJugadores().contains(anfitrion));
            assertEquals(3, sala.getMaxJugadores());
        }

        @Test
        @DisplayName("Crear sala con anfitrión nulo lanza IllegalArgumentException")
        void crearSala_anfitrionNulo_lanzaExcepcion() {
            assertThrows(IllegalArgumentException.class,
                    () -> salaService.crearSala(null, 4));
        }

        @Test
        @DisplayName("Crear sala con maxJugadores fuera de rango (1) lanza IllegalArgumentException")
        void crearSala_maxJugadoresMenorDe2_lanzaExcepcion() {
            assertThrows(IllegalArgumentException.class,
                    () -> salaService.crearSala(anfitrion, 1));
        }

        @Test
        @DisplayName("Crear sala con maxJugadores fuera de rango (6) lanza IllegalArgumentException")
        void crearSala_maxJugadoresMayorDe5_lanzaExcepcion() {
            assertThrows(IllegalArgumentException.class,
                    () -> salaService.crearSala(anfitrion, 6));
        }
    }

    // --- F34: Unirse y empezar partida ---

    @Nested
    @DisplayName("F34: Unirse a sala e iniciar partida")
    class UnirseIniciarTests {

        private Sala salaEsperando;

        @BeforeEach
        void setUp() {
            salaEsperando = new Sala();
            salaEsperando.setCodigo("MUS-TEST");
            salaEsperando.setEstado(EstadoSala.ESPERANDO);
            salaEsperando.setMaxJugadores(4);
            salaEsperando.setAnfitrion(anfitrion);
            salaEsperando.getJugadores().add(anfitrion);

            when(salaRepository.findByCodigo("MUS-TEST")).thenReturn(Optional.of(salaEsperando));
        }

        @Test
        @DisplayName("Un segundo jugador puede unirse a la sala")
        void unirse_jugadorValido_seAgregaCorrectamente() {
            Sala resultado = salaService.unirseASala("MUS-TEST", jugador2);

            assertTrue(resultado.getJugadores().contains(jugador2));
            assertEquals(2, resultado.getJugadores().size());
        }

        @Test
        @DisplayName("Unirse a sala llena lanza IllegalStateException")
        void unirse_salaLlena_lanzaExcepcion() {
            salaEsperando.setMaxJugadores(1);
            assertThrows(IllegalStateException.class,
                    () -> salaService.unirseASala("MUS-TEST", jugador2));
        }

        @Test
        @DisplayName("Unirse a sala en curso lanza IllegalStateException")
        void unirse_salaEnCurso_lanzaExcepcion() {
            salaEsperando.setEstado(EstadoSala.EN_CURSO);
            assertThrows(IllegalStateException.class,
                    () -> salaService.unirseASala("MUS-TEST", jugador2));
        }

        @Test
        @DisplayName("El mismo jugador no se añade dos veces a la sala")
        void unirse_mismJugadorDosVeces_noSeDuplica() {
            salaService.unirseASala("MUS-TEST", anfitrion);
            assertEquals(1, salaEsperando.getJugadores().size());
        }

        @Test
        @DisplayName("Unirse a sala con código inexistente lanza ResourceNotFoundException")
        void unirse_codigoInexistente_lanzaExcepcion() {
            when(salaRepository.findByCodigo("MUS-XXXX")).thenReturn(Optional.empty());
            assertThrows(ResourceNotFoundException.class,
                    () -> salaService.unirseASala("MUS-XXXX", jugador2));
        }

        @Test
        @DisplayName("Iniciar partida con menos de 2 jugadores lanza IllegalStateException")
        void iniciarPartida_menosDeDosjugadores_lanzaExcepcion() {
            // La sala solo tiene el anfitrión (1 jugador)
            assertThrows(IllegalStateException.class,
                    () -> salaService.iniciarPartida("MUS-TEST"));
        }

        @Test
        @DisplayName("Iniciar partida con 2 jugadores cambia estado a EN_CURSO")
        void iniciarPartida_dosJugadores_estadoEnCurso() {
            salaEsperando.getJugadores().add(jugador2);

            Partida partida = new Partida();
            setIdPartida(partida, 99L);
            when(partidaService.create(any(Partida.class))).thenReturn(partida);
            when(partidaService.iniciarPartida(99L)).thenReturn(null);

            Sala resultado = salaService.iniciarPartida("MUS-TEST");

            assertEquals(EstadoSala.EN_CURSO, resultado.getEstado());
            assertNotNull(resultado.getPartida());
        }

        @Test
        @DisplayName("Agregar bot a sala añade un jugador bot")
        void agregarBotASala_agregaBotCorrectamente() {
            when(jugadorService.create(any(Jugador.class))).thenAnswer(inv -> {
                Jugador j = inv.getArgument(0);
                setId(j, 999L);
                return j;
            });

            Sala resultado = salaService.agregarBotASala("MUS-TEST");

            assertEquals(2, resultado.getJugadores().size());
            Jugador bot = resultado.getJugadores().get(1);
            assertTrue(bot.isBot());
            assertEquals("Bot 2", bot.getNombre());
        }

        @Test
        @DisplayName("Llenar bots a sala completa todos los huecos libres")
        void llenarBotsASala_completaTodosLosHuecos() {
            when(jugadorService.create(any(Jugador.class))).thenAnswer(inv -> {
                Jugador j = inv.getArgument(0);
                setId(j, 1000L + j.getNumeroJugador());
                return j;
            });

            Sala resultado = salaService.llenarBotsASala("MUS-TEST");

            assertEquals(4, resultado.getJugadores().size());
            assertEquals(3, resultado.getJugadores().stream().filter(Jugador::isBot).count());
        }
    }

    // --- F35: Desconexiones ---

    @Nested
    @DisplayName("F35: Gestión de desconexiones")
    class DesconexionTests {

        private Sala salaEnCurso;
        private Partida partida;

        @BeforeEach
        void setUp() {
            partida = new Partida();
            setIdPartida(partida, 10L);
            partida.setSeleccionesRonda(new HashMap<>());

            salaEnCurso = new Sala();
            salaEnCurso.setCodigo("MUS-GAME");
            salaEnCurso.setEstado(EstadoSala.EN_CURSO);
            salaEnCurso.setMaxJugadores(4);
            salaEnCurso.setPartida(partida);
            List<Jugador> jugadores = new ArrayList<>();
            jugadores.add(anfitrion);
            jugadores.add(jugador2);
            salaEnCurso.setJugadores(jugadores);

            when(salaRepository.findByCodigo("MUS-GAME")).thenReturn(Optional.of(salaEnCurso));
        }

        @Test
        @DisplayName("Marcar desconectado cambia conectado=false en el jugador")
        void marcarDesconectado_cambiaEstadoJugador() {
            assertTrue(anfitrion.isConectado());

            salaService.marcarDesconectado("MUS-GAME", 1L);

            assertFalse(anfitrion.isConectado());
            verify(jugadorService).update(eq(1L), any(Jugador.class));
        }

        @Test
        @DisplayName("Marcar desconectado invoca ejecutarTurnoBot si turno pendiente")
        void marcarDesconectado_invocaBotSiTurnoPendiente() {
            salaService.marcarDesconectado("MUS-GAME", 1L);

            verify(botService).ejecutarTurnoBot(partida, anfitrion);
        }

        @Test
        @DisplayName("Marcar desconectado NO invoca bot si jugador ya seleccionó carta")
        void marcarDesconectado_noInvocaBotSiYaSelecciono() {
            partida.getSeleccionesRonda().put(1L, 42L); // ya votó

            salaService.marcarDesconectado("MUS-GAME", 1L);

            verify(botService, never()).ejecutarTurnoBot(any(), any());
        }

        @Test
        @DisplayName("Reconectar restaura conectado=true en el jugador")
        void reconectar_restauraConexion() {
            anfitrion.setConectado(false);

            Sala resultado = salaService.marcarConectado("MUS-GAME", 1L);

            assertTrue(anfitrion.isConectado());
            verify(jugadorService).update(eq(1L), any(Jugador.class));
        }

        @Test
        @DisplayName("Desconectar último humano programa eliminación de sala en 5 minutos")
        void marcarDesconectado_ultimoHumano_programaEliminacion() {
            // Desconectar jugador 2
            jugador2.setConectado(false);
            // Desconectar anfitrión (último humano)
            salaService.marcarDesconectado("MUS-GAME", 1L);

            assertTrue(salaService.tieneEliminacionProgramada("MUS-GAME"));
        }

        @Test
        @DisplayName("Reconectar cancela la eliminación programada de la sala")
        void reconectar_cancelaEliminacionProgramada() {
            jugador2.setConectado(false);
            salaService.marcarDesconectado("MUS-GAME", 1L);
            assertTrue(salaService.tieneEliminacionProgramada("MUS-GAME"));

            salaService.marcarConectado("MUS-GAME", 1L);

            assertFalse(salaService.tieneEliminacionProgramada("MUS-GAME"));
        }

        @Test
        @DisplayName("Eliminar sala por inactividad borra la sala y su partida")
        void eliminarSalaPorInactividad_borraSalaYPartida() {
            anfitrion.setConectado(false);
            jugador2.setConectado(false);

            salaService.eliminarSalaPorInactividad("MUS-GAME");

            verify(salaRepository).delete(salaEnCurso);
            verify(partidaService).delete(10L);
        }

        @Test
        @DisplayName("Eliminar sala por inactividad NO borra si hay un humano conectado")
        void eliminarSalaPorInactividad_noBorraSiHayHumanoConectado() {
            anfitrion.setConectado(true);
            jugador2.setConectado(false);

            salaService.eliminarSalaPorInactividad("MUS-GAME");

            verify(salaRepository, never()).delete(any(Sala.class));
            verify(partidaService, never()).delete(anyLong());
        }
    }

    // --- Helpers ---

    private void injectField(Object target, String fieldName, Object value) throws Exception {
        try {
            Field f = SalaService.class.getDeclaredField(fieldName);
            f.setAccessible(true);
            f.set(target, value);
        } catch (NoSuchFieldException e) {
            // Campo opcional (ej. messagingTemplate), ignorar si no existe
        }
    }

    private void setId(Jugador j, Long id) {
        try {
            Field f = j.getClass().getSuperclass().getDeclaredField("id");
            f.setAccessible(true);
            f.set(j, id);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    private void setIdPartida(Partida p, Long id) {
        try {
            Field f = p.getClass().getSuperclass().getDeclaredField("id");
            f.setAccessible(true);
            f.set(p, id);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }
}
