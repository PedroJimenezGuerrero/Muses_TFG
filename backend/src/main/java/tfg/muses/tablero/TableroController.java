package tfg.muses.tablero;

import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
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

    @PutMapping("rotarAstros/{id}")
    public Tablero rotarAstros(@PathVariable Long id) {
        Tablero tablero = tableroService.getById(id);
        return tableroService.rotarAstros(tablero);
    }

    @PutMapping("revolucionSolar/{id}")
    public Tablero revolucionSolar(@PathVariable Long id) {
        Tablero tablero = tableroService.getById(id);
        try {
            tablero = tableroService.revolucionSolar(tablero);
        } catch (Exception e) {
            e.printStackTrace();
        }
        return tablero;
    }

    @PutMapping("revolucionLunar/{id}")
    public Tablero revolucionLunar(@PathVariable Long id) {
        Tablero tablero = tableroService.getById(id);
        try {
            tablero = tableroService.revolucionLunar(tablero);
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

}
