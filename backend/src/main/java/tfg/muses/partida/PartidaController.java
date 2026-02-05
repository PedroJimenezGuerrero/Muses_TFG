package tfg.muses.partida;

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
@RequestMapping("partida")
public class PartidaController {

    @Autowired
    private PartidaService partidaService;

    @GetMapping("{id}")
    public Partida getById(@PathVariable Long id) {
        Partida partida = partidaService.getById(id);
        return partida;
    }

    @GetMapping
    public List<Partida> getAll() {
        return partidaService.getAll();
    }

    @PostMapping
    public Partida create(@RequestBody Partida partida) {
        Partida newPartida = partidaService.create(partida);
        return newPartida;
    }

    @PutMapping("{id}")
    public Partida update(@PathVariable Long id, @RequestBody Partida partida) {
        return partidaService.update(id, partida);
    }

    @DeleteMapping("{id}")
    public void delete(@PathVariable Long id) {
        partidaService.delete(id);
    }
}
