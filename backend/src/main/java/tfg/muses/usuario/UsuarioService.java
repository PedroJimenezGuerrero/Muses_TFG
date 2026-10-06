package tfg.muses.usuario;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import tfg.muses.estadisticas.Estadisticas;

@Service
public class UsuarioService {

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    /**
     * Crear un nuevo usuario con contraseña encriptada con BCrypt,
     * fecha de registro automática y estadísticas inicializadas.
     */
    public Usuario create(Usuario usuario) {
        if (usuario.getFechaRegistro() == null) {
            usuario.setFechaRegistro(LocalDateTime.now());
        }
        if (usuario.getEstadisticas() == null) {
            Estadisticas stats = new Estadisticas();
            stats.setPartidasJugadas(0);
            stats.setVictorias(0);
            stats.setDerrotas(0);
            stats.setPuntuacionTotal(0);
            stats.setTokensColocados(0);
            stats.setCartasUtilizadas(0);
            stats.setTiempoTotalJuego(0);
            usuario.setEstadisticas(stats);
        }
        if (usuario.getPassword() != null && !usuario.getPassword().trim().isEmpty()) {
            if (!usuario.getPassword().startsWith("$2a$") && !usuario.getPassword().startsWith("$2b$")) {
                usuario.setPassword(passwordEncoder.encode(usuario.getPassword()));
            }
        }
        return usuarioRepository.save(usuario);
    }

    /**
     * Autenticar usuario verificando hash BCrypt o contraseña almacenada
     */
    public Optional<Usuario> authenticate(String identifier, String rawPassword) {
        if (identifier == null || identifier.trim().isEmpty()) {
            return Optional.empty();
        }
        String cleanId = identifier.trim().toLowerCase().replace(" ", "");
        List<Usuario> all = usuarioRepository.findAll();
        for (Usuario u : all) {
            String uName = u.getUsername() != null ? u.getUsername().trim().toLowerCase().replace(" ", "") : "";
            String uEmail = u.getEmail() != null ? u.getEmail().trim().toLowerCase() : "";
            if (uName.equals(cleanId) || uEmail.equals(identifier.trim().toLowerCase())) {
                if (rawPassword == null || rawPassword.isEmpty()) {
                    return Optional.of(u);
                }
                if (u.getPassword() == null || u.getPassword().isEmpty()) {
                    return Optional.of(u);
                }
                // Comprobación BCrypt o texto plano legado
                if (passwordEncoder.matches(rawPassword, u.getPassword()) || u.getPassword().equals(rawPassword)) {
                    return Optional.of(u);
                }
                return Optional.empty(); // Contraseña incorrecta
            }
        }
        return Optional.empty(); // Usuario no encontrado
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
            if (usuarioActualizado.getPassword() != null && !usuarioActualizado.getPassword().trim().isEmpty()) {
                if (!usuarioActualizado.getPassword().startsWith("$2a$") && !usuarioActualizado.getPassword().startsWith("$2b$")) {
                    usuario.setPassword(passwordEncoder.encode(usuarioActualizado.getPassword()));
                } else {
                    usuario.setPassword(usuarioActualizado.getPassword());
                }
            }
            usuario.setEmail(usuarioActualizado.getEmail());
            if (usuarioActualizado.getFechaRegistro() != null) {
                usuario.setFechaRegistro(usuarioActualizado.getFechaRegistro());
            }
            if (usuarioActualizado.getEstadisticas() != null) {
                usuario.setEstadisticas(usuarioActualizado.getEstadisticas());
            }
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
