package tfg.muses.token;

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
@RequestMapping("token")
public class TokenController {

    @Autowired
    private TokenService tokenService;

    @GetMapping("{id}")
    public Token getById(@PathVariable Long id) {
        Token token = tokenService.getById(id);
        return token;
    }

    @GetMapping("/byPartida/{partidaId}")
    public List<Token> getAllByPartida(@PathVariable Long partidaId) {
        return tokenService.getAllByPartida(partidaId);
    }

    @PostMapping
    public Token create(@RequestBody Token token) {
        Token newToken = tokenService.create(token);
        return newToken;
    }

    @PutMapping("{id}")
    public Token update(@PathVariable Long id, @RequestBody Token token) {
        return tokenService.update(id, token);
    }

    @DeleteMapping("{id}")
    public void delete(@PathVariable Long id) {
        tokenService.delete(id);
    }
}
