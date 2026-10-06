package tfg.muses.config;

import java.time.LocalDateTime;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import tfg.muses.estadisticas.Estadisticas;
import tfg.muses.usuario.Usuario;
import tfg.muses.usuario.UsuarioRepository;

@Component
public class DatabaseSeeder implements CommandLineRunner {

    private static final Logger logger = LoggerFactory.getLogger(DatabaseSeeder.class);

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private org.springframework.security.crypto.password.PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        seedUsers();
    }

    private void seedUsers() {
        for (int i = 1; i <= 4; i++) {
            String username = "User " + i;
            String usernameNoSpace = "User" + i;
            String email = "user" + i + "@user" + i + ".com";
            String password = "user1";

            boolean exists = usuarioRepository.findByUsername(username).isPresent()
                    || usuarioRepository.findByUsername(usernameNoSpace).isPresent()
                    || usuarioRepository.findByEmail(email).isPresent();

            if (!exists) {
                Usuario usuario = new Usuario();
                usuario.setUsername(username);
                usuario.setEmail(email);
                usuario.setPassword(passwordEncoder.encode(password));
                usuario.setFechaRegistro(LocalDateTime.now());

                Estadisticas stats = new Estadisticas();
                stats.setPartidasJugadas(0);
                stats.setVictorias(0);
                stats.setDerrotas(0);
                stats.setPuntuacionTotal(0);
                stats.setTokensColocados(0);
                stats.setCartasUtilizadas(0);
                stats.setTiempoTotalJuego(0);

                usuario.setEstadisticas(stats);
                usuarioRepository.save(usuario);
                logger.info("Seeder: Usuario '{}' ({}) creado con éxito.", username, email);
            }
        }
    }
}
