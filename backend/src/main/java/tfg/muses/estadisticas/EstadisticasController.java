package tfg.muses.estadisticas;

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
@RequestMapping("estadisticas")
public class EstadisticasController {

    @Autowired
    private EstadisticasService estadisticasService;

    @GetMapping("{id}")
    public Estadisticas getById(@PathVariable Long id) {
        Estadisticas estadisticas = estadisticasService.getById(id);
        return estadisticas;
    }

    @GetMapping
    public List<Estadisticas> getAll() {
        return estadisticasService.getAll();
    }

    @PostMapping
    public Estadisticas create(@RequestBody Estadisticas estadisticas) {
        Estadisticas newEstadisticas = estadisticasService.create(estadisticas);
        return newEstadisticas;
    }

    @PutMapping("{id}")
    public Estadisticas update(@PathVariable Long id, @RequestBody Estadisticas estadisticas) {
        return estadisticasService.update(id, estadisticas);
    }

    @DeleteMapping("{id}")
    public void delete(@PathVariable Long id) {
        estadisticasService.delete(id);
    }
}
