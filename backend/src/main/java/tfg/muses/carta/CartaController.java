package tfg.muses.carta;

import java.util.List;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.RequestBody;

@RestController
@RequestMapping("carta")
public class CartaController {

    @Autowired
    private CartaService cartaService;

    @GetMapping("{id}")
    public CartaBase getById(@PathVariable Long id) {
        CartaBase carta = cartaService.getById(id);
        return carta;
    }

    @GetMapping("/byPartida/{partidaId}")
    public List<CartaBase> getAllByPartida(@PathVariable Long partidaId) {
        return cartaService.getAllByPartida(partidaId);
    }

    @PostMapping
    public CartaBase create(@RequestBody CartaBase carta) {
        CartaBase newCarta = cartaService.create(carta);
        return newCarta;
    }

    @DeleteMapping("{id}")
    public void delete(@PathVariable Long id) {
        cartaService.delete(id);
    }
}
