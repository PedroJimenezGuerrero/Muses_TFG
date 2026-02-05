package tfg.muses.musa;

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
@RequestMapping("musa")
public class MusaController {

    @Autowired
    private MusaService musaService;

    @GetMapping("{id}")
    public Musa getById(@PathVariable Long id) {
        Musa musa = musaService.getById(id);
        return musa;
    }

    @GetMapping("/byPartida/{partidaId}")
    public List<Musa> getAllByPartida(@PathVariable Long partidaId) {
        return musaService.getAllByPartida(partidaId);
    }

    @PostMapping
    public Musa create(@RequestBody Musa musa) {
        Musa newMusa = musaService.create(musa);
        return newMusa;
    }

    @PutMapping("{id}")
    public Musa update(@PathVariable Long id, @RequestBody Musa musa) {
        return musaService.update(id, musa);
    }

    @DeleteMapping("{id}")
    public void delete(@PathVariable Long id) {
        musaService.delete(id);
    }
}
