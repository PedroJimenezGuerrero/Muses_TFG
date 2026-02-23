package tfg.muses.tablero;

import org.springframework.web.bind.annotation.RestController;

import tfg.muses.jugador.Jugador;
import tfg.muses.jugador.JugadorService;
import tfg.muses.musa.Musa;

import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;

import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.PostMapping;

@RestController
@RequestMapping("tablero")
public class TableroController {

    @Autowired
    private TableroService tableroService;

    @Autowired
    private JugadorService jugadorService;

    @PutMapping("rotarAstros/{id}")
    public Tablero rotarAstros(@PathVariable Long id) {
        Tablero tablero = tableroService.getById(id);
        return tableroService.rotarAstros(tablero);
    }

    @PutMapping("revolucionSolar/{jugadorId}")
    public Tablero revolucionSolar(@PathVariable Long jugadorId) {
        Tablero tablero = tableroService.getByPlayerId(jugadorId);
        Jugador jugador = jugadorService.getById(jugadorId);
        try {
            tablero = tableroService.revolucionSolar(tablero, jugador);
        } catch (Exception e) {
            e.printStackTrace();
        }
        return tablero;
    }

    @PutMapping("revolucionLunar/{jugadorId}")
    public Tablero revolucionLunar(@PathVariable Long jugadorId) {
        Tablero tablero = tableroService.getByPlayerId(jugadorId);
        Jugador jugador = jugadorService.getById(jugadorId);
        try {
            tablero = tableroService.revolucionLunar(tablero, jugador);
        } catch (Exception e) {
            e.printStackTrace();
        }
        return tablero;
    }

    @GetMapping("{id}")
    public Tablero getById(@RequestParam Long id) {
        Tablero tablero = tableroService.getById(id);
        return tablero;
    }

    @GetMapping("/byPartida/{partidaId}")
    public Tablero getByPartidaId(@RequestParam Long partidaId) {
        Tablero tablero = tableroService.getByPartidaId(partidaId);
        return tablero;
    }

    @PostMapping
    public Tablero createTablero(@RequestBody Tablero tablero) {
        Tablero newTablero = tableroService.save(tablero);
        return newTablero;
    }

    @GetMapping("/getMusasEnAstros/{id}")
    public Map<String, Musa> getMusasEnAstros(@PathVariable Long id) {
        return tableroService.getMusasEnAstros(id);
    }

}
