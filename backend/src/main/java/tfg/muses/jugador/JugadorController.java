package tfg.muses.jugador;

import java.util.List;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.RequestBody;

@RestController
@RequestMapping("jugador")
public class JugadorController {

    @Autowired
    private JugadorService jugadorService;

    @GetMapping("{id}")
    public Jugador getById(@PathVariable Long id) {
        Jugador jugador = jugadorService.getById(id);
        return jugador;
    }

    @GetMapping("/byPartida/{partidaId}")
    public List<Jugador> getAllByPartida(@PathVariable Long partidaId) {
        return jugadorService.getAllByPartida(partidaId);
    }

    @PostMapping
    public Jugador create(@RequestBody Jugador jugador) {
        Jugador newJugador = jugadorService.create(jugador);
        return newJugador;
    }

    @PutMapping("{id}")
    public Jugador update(@PathVariable Long id, @RequestBody Jugador jugador) {
        return jugadorService.update(id, jugador);
    }

    @DeleteMapping("{id}")
    public void delete(@PathVariable Long id) {
        jugadorService.delete(id);
    }
}
