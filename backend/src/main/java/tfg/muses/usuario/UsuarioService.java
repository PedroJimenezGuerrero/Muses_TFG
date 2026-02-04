package tfg.muses.usuario;

import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class UsuarioService {

    @Autowired
    private UsuarioRepository usuarioRepository;

    /**
     * Crear un nuevo usuario
     */
    public Usuario create(Usuario usuario) {
        return usuarioRepository.save(usuario);
    }

    /**
     * Obtener un usuario por su ID
     */
    public Usuario getById(Long id) {
        return usuarioRepository.findById(id).orElse(null);
    }

    /**
     * Obtener todos los usuarios
     */
    public List<Usuario> getAll() {
        return usuarioRepository.findAll();
    }

    /**
     * Actualizar un usuario existente
     */
    public Usuario update(Long id, Usuario usuarioActualizado) {
        return usuarioRepository.findById(id).map(usuario -> {
            usuario.setUsername(usuarioActualizado.getUsername());
            usuario.setPassword(usuarioActualizado.getPassword());
            usuario.setEmail(usuarioActualizado.getEmail());
            usuario.setFechaRegistro(usuarioActualizado.getFechaRegistro());
            usuario.setEstadisticas(usuarioActualizado.getEstadisticas());
            return usuarioRepository.save(usuario);
        }).orElse(null);
    }

    /**
     * Eliminar un usuario por su ID
     */
    public void delete(Long id) {
        usuarioRepository.deleteById(id);
    }

    /**
     * Eliminar todos los usuarios
     */
    public void deleteAll() {
        usuarioRepository.deleteAll();
    }
}
