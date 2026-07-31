package tfg.muses.sala;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import tfg.muses.bot.BotService;
import tfg.muses.exception.ResourceNotFoundException;
import tfg.muses.jugador.Jugador;
import tfg.muses.jugador.JugadorService;
import tfg.muses.partida.Partida;
import tfg.muses.partida.PartidaService;

/**
 * Servicio de gestión de salas de juego multijugador (F33, F34, F35).
 * <p>
 * Responsabilidades:
 * <ul>
 *   <li>Crear salas con código alfanumérico único (F33).</li>
 *   <li>Gestionar la incorporación de jugadores hasta el límite configurado (F34).</li>
 *   <li>Marcar jugadores desconectados y delegar su turno al Bot (F35).</li>
 * </ul>
 */
@Service
public class SalaService {

    private static final Logger log = LoggerFactory.getLogger(SalaService.class);
    private static final String PREFIJO = "MUS-";
    private static final String ALFANUMERICO = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    private static final int LONGITUD_CODIGO = 4;
    private static final SecureRandom RANDOM = new SecureRandom();

    @Autowired
    private SalaRepository salaRepository;

    @Autowired
    private PartidaService partidaService;

    @Autowired
    private JugadorService jugadorService;

    @Autowired
    private BotService botService;

    @Autowired(required = false)
    private SimpMessagingTemplate messagingTemplate;

    // --- F33: Crear sala ---

    /**
     * Crea una nueva sala con un código único y el jugador dado como anfitrión.
     *
     * @param anfitrion  el jugador que crea la sala
     * @param maxJugadores límite de jugadores (2-5)
     * @return la sala persistida
     */
    @Transactional
    public Sala crearSala(Jugador anfitrion, int maxJugadores) {
        if (anfitrion == null) {
            throw new IllegalArgumentException("El anfitrión no puede ser nulo");
        }
        if (maxJugadores < 2 || maxJugadores > 5) {
            throw new IllegalArgumentException("El número de jugadores debe estar entre 2 y 5");
        }

        Sala sala = new Sala();
        sala.setCodigo(generarCodigoUnico());
        sala.setEstado(EstadoSala.ESPERANDO);
        sala.setMaxJugadores(maxJugadores);
        sala.setAnfitrion(anfitrion);
        sala.getJugadores().add(anfitrion);

        Sala guardada = salaRepository.save(sala);
        log.info("Sala creada con código={} por anfitrión id={}", guardada.getCodigo(), anfitrion.getId());
        notificarSala(guardada);
        return guardada;
    }

    // --- F34: Unirse a sala ---

    /**
     * Añade un jugador a la sala identificada por el código dado.
     *
     * @param codigo    código alfanumérico de la sala
     * @param jugador   el jugador que se une
     * @return la sala actualizada
     */
    @Transactional
    public Sala unirseASala(String codigo, Jugador jugador) {
        Sala sala = obtenerPorCodigo(codigo);

        if (sala.getEstado() != EstadoSala.ESPERANDO) {
            throw new IllegalStateException("La sala " + codigo + " no está en estado ESPERANDO");
        }
        if (sala.getJugadores().size() >= sala.getMaxJugadores()) {
            throw new IllegalStateException("La sala " + codigo + " ya está llena (" + sala.getMaxJugadores() + " jugadores)");
        }
        boolean yaEsta = sala.getJugadores().stream()
                .anyMatch(j -> j.getId() != null && j.getId().equals(jugador.getId()));
        if (!yaEsta) {
            sala.getJugadores().add(jugador);
        }

        Sala actualizada = salaRepository.save(sala);
        log.info("Jugador id={} se unió a la sala código={}", jugador.getId(), codigo);
        notificarSala(actualizada);
        return actualizada;
    }

    /**
     * Inicia la partida de una sala: crea la Partida, la vincula a la Sala
     * y cambia el estado a EN_CURSO.
     *
     * @param codigo código alfanumérico de la sala
     * @return la sala actualizada con la partida en curso
     */
    @Transactional
    public Sala iniciarPartida(String codigo) {
        Sala sala = obtenerPorCodigo(codigo);

        if (sala.getEstado() != EstadoSala.ESPERANDO) {
            throw new IllegalStateException("Solo se puede iniciar una sala en estado ESPERANDO");
        }
        if (sala.getJugadores().size() < 2) {
            throw new IllegalStateException("Se necesitan al menos 2 jugadores para iniciar la partida");
        }

        // Crear la Partida base con los jugadores de la sala
        Partida partida = new Partida();
        partida.setFechaInicio(LocalDateTime.now());
        partida.setJugadores(new ArrayList<>(sala.getJugadores()));
        Partida guardada = partidaService.create(partida);

        // Inicializar tablero usando la lógica de la iteración 3
        partidaService.iniciarPartida(guardada.getId());

        sala.setPartida(guardada);
        sala.setEstado(EstadoSala.EN_CURSO);
        Sala actualizada = salaRepository.save(sala);

        log.info("Partida id={} iniciada en sala código={}", guardada.getId(), codigo);
        notificarSala(actualizada);
        return actualizada;
    }

    // --- F35: Gestión de desconexiones ---

    /**
     * Marca un jugador como desconectado. Si la partida está en curso,
     * delega su turno pendiente al BotService para no bloquear la mesa.
     *
     * @param codigo     código de la sala
     * @param jugadorId  id del jugador desconectado
     */
    @Transactional
    public void marcarDesconectado(String codigo, Long jugadorId) {
        Sala sala = obtenerPorCodigo(codigo);
        Jugador jugador = sala.getJugadores().stream()
                .filter(j -> j.getId() != null && j.getId().equals(jugadorId))
                .findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("Jugador", jugadorId));

        jugador.setConectado(false);
        jugadorService.update(jugador.getId(), jugador);
        log.info("Jugador id={} marcado como desconectado en sala código={}", jugadorId, codigo);

        // Si la partida está activa, el bot juega el turno pendiente del jugador
        if (sala.getEstado() == EstadoSala.EN_CURSO && sala.getPartida() != null) {
            Partida partida = sala.getPartida();
            boolean yaSelecionó = partida.getSeleccionesRonda() != null
                    && partida.getSeleccionesRonda().containsKey(jugadorId);
            if (!yaSelecionó) {
                log.info("Bot asume turno del jugador id={} en partida id={}", jugadorId, partida.getId());
                botService.ejecutarTurnoBot(partida, jugador);
            }
        }

        notificarSala(sala);
    }

    /**
     * Restaura la conexión de un jugador previamente desconectado.
     *
     * @param codigo     código de la sala
     * @param jugadorId  id del jugador que reconecta
     * @return la sala actualizada
     */
    @Transactional
    public Sala marcarConectado(String codigo, Long jugadorId) {
        Sala sala = obtenerPorCodigo(codigo);
        sala.getJugadores().stream()
                .filter(j -> j.getId() != null && j.getId().equals(jugadorId))
                .findFirst()
                .ifPresent(j -> {
                    j.setConectado(true);
                    jugadorService.update(j.getId(), j);
                    log.info("Jugador id={} reconectado a sala código={}", jugadorId, codigo);
                });

        Sala actualizada = salaRepository.save(sala);
        notificarSala(actualizada);
        return actualizada;
    }

    // --- Consultas ---

    public Sala obtenerPorCodigo(String codigo) {
        return salaRepository.findByCodigo(codigo)
                .orElseThrow(() -> new ResourceNotFoundException("Sala con codigo " + codigo, null));
    }

    public List<Sala> obtenerTodas() {
        return salaRepository.findAll();
    }

    // --- Helpers ---

    private String generarCodigoUnico() {
        String codigo;
        int intentos = 0;
        do {
            StringBuilder sb = new StringBuilder(PREFIJO);
            for (int i = 0; i < LONGITUD_CODIGO; i++) {
                sb.append(ALFANUMERICO.charAt(RANDOM.nextInt(ALFANUMERICO.length())));
            }
            codigo = sb.toString();
            intentos++;
            if (intentos > 1000) {
                throw new IllegalStateException("No se pudo generar un código de sala único tras 1000 intentos");
            }
        } while (salaRepository.existsByCodigo(codigo));
        return codigo;
    }

    private void notificarSala(Sala sala) {
        if (messagingTemplate != null && sala.getCodigo() != null) {
            messagingTemplate.convertAndSend("/topic/sala/" + sala.getCodigo(), sala);
        }
    }
}
