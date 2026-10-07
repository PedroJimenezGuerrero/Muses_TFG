package tfg.muses.sala;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import tfg.muses.jugador.Jugador;
import tfg.muses.jugador.JugadorService;

/**
 * Controlador REST para la gestión de salas de juego multijugador.
 * <p>
 * Endpoints expuestos:
 * <ul>
 *   <li>POST /api/v1/salas/crear          — Crea una nueva sala (F33).</li>
 *   <li>POST /api/v1/salas/{codigo}/unirse — Un jugador se une a la sala (F34).</li>
 *   <li>POST /api/v1/salas/{codigo}/iniciar — El anfitrión inicia la partida (F34).</li>
 *   <li>POST /api/v1/salas/{codigo}/desconectar/{jugadorId} — Marca jugador desconectado (F35).</li>
 *   <li>POST /api/v1/salas/{codigo}/reconectar/{jugadorId}  — Restaura la conexión (F35).</li>
 *   <li>GET  /api/v1/salas/{codigo}        — Obtiene el estado actual de la sala.</li>
 *   <li>GET  /api/v1/salas                 — Lista todas las salas.</li>
 * </ul>
 */
@RestController
@RequestMapping("/salas")
public class SalaController {

    @Autowired
    private SalaService salaService;

    @Autowired
    private JugadorService jugadorService;

    @Autowired(required = false)
    private tfg.muses.usuario.UsuarioService usuarioService;

    // --- DTOs ---

    public static class CrearSalaRequest {
        public Long anfitrionId;
        public String anfitrionNombre;
        public int maxJugadores = 4;
    }

    public static class UnirseRequest {
        public Long jugadorId;
        public String jugadorNombre;
    }

    // --- Endpoints ---

    @PostMapping("/crear")
    public ResponseEntity<Sala> crear(@RequestBody CrearSalaRequest req) {
        Jugador anfitrion = null;
        if (req.anfitrionId != null) {
            anfitrion = jugadorService.getById(req.anfitrionId);
        }
        if (anfitrion == null) {
            anfitrion = new Jugador();
            String nombre = (req.anfitrionNombre != null && !req.anfitrionNombre.isBlank())
                    ? req.anfitrionNombre : "Jugador 1";
            if (req.anfitrionId != null && usuarioService != null) {
                var usuario = usuarioService.getById(req.anfitrionId);
                if (usuario != null) {
                    anfitrion.setUsuario(usuario);
                    nombre = usuario.getUsername();
                }
            }
            anfitrion.setNombre(nombre);
            anfitrion.setNumeroJugador(1);
            anfitrion = jugadorService.create(anfitrion);
        }
        Sala sala = salaService.crearSala(anfitrion, req.maxJugadores);
        return ResponseEntity.ok(sala);
    }

    @PostMapping("/{codigo}/unirse")
    public ResponseEntity<Sala> unirse(@PathVariable String codigo, @RequestBody UnirseRequest req) {
        Sala salaExistente = salaService.obtenerPorCodigo(codigo);
        Jugador jugador = null;
        if (req.jugadorId != null) {
            jugador = jugadorService.getById(req.jugadorId);
        }
        if (jugador == null) {
            jugador = new Jugador();
            int num = salaExistente.getJugadores().size() + 1;
            String nombre = (req.jugadorNombre != null && !req.jugadorNombre.isBlank())
                    ? req.jugadorNombre : "Jugador " + num;
            if (req.jugadorId != null && usuarioService != null) {
                var usuario = usuarioService.getById(req.jugadorId);
                if (usuario != null) {
                    jugador.setUsuario(usuario);
                    nombre = usuario.getUsername();
                }
            }
            jugador.setNombre(nombre);
            jugador.setNumeroJugador(num);
            jugador = jugadorService.create(jugador);
        }
        Sala sala = salaService.unirseASala(codigo, jugador);
        return ResponseEntity.ok(sala);
    }

    @PostMapping("/{codigo}/agregar-bot")
    public ResponseEntity<Sala> agregarBot(@PathVariable String codigo) {
        Sala sala = salaService.agregarBotASala(codigo);
        return ResponseEntity.ok(sala);
    }

    @PostMapping("/{codigo}/llenar-bots")
    public ResponseEntity<Sala> llenarBots(@PathVariable String codigo) {
        Sala sala = salaService.llenarBotsASala(codigo);
        return ResponseEntity.ok(sala);
    }

    @PostMapping("/{codigo}/iniciar")
    public ResponseEntity<Sala> iniciar(@PathVariable String codigo) {
        Sala sala = salaService.iniciarPartida(codigo);
        return ResponseEntity.ok(sala);
    }

    @PostMapping("/{codigo}/abandonar/{jugadorId}")
    public ResponseEntity<Sala> abandonar(@PathVariable String codigo, @PathVariable Long jugadorId) {
        Sala sala = salaService.abandonarSala(codigo, jugadorId);
        if (sala == null) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.ok(sala);
    }

    @PostMapping("/{codigo}/desconectar/{jugadorId}")
    public ResponseEntity<Void> desconectar(@PathVariable String codigo, @PathVariable Long jugadorId) {
        salaService.marcarDesconectado(codigo, jugadorId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{codigo}/reconectar/{jugadorId}")
    public ResponseEntity<Sala> reconectar(@PathVariable String codigo, @PathVariable Long jugadorId) {
        Sala sala = salaService.marcarConectado(codigo, jugadorId);
        return ResponseEntity.ok(sala);
    }

    @GetMapping("/{codigo}")
    public ResponseEntity<Sala> obtener(@PathVariable String codigo) {
        return ResponseEntity.ok(salaService.obtenerPorCodigo(codigo));
    }

    @GetMapping
    public ResponseEntity<List<Sala>> listar() {
        return ResponseEntity.ok(salaService.obtenerTodas());
    }
}
