package tfg.muses.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.web.SecurityFilterChain;

import static org.springframework.security.config.Customizer.withDefaults;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .cors(withDefaults()) // Uses the configuration from WebConfig
                .csrf(AbstractHttpConfigurer::disable) // Disable CSRF for simplicity in development
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/status").permitAll()
                        .requestMatchers("/ws/**").permitAll()
                        .requestMatchers("/partida/**").permitAll()
                        .requestMatchers("/api/v1/partida/**").permitAll()
                        .requestMatchers("/api/v1/salas/**").permitAll()
                        .requestMatchers("/api/v1/**").permitAll()
                        .requestMatchers("/ronda/**").permitAll()
                        .requestMatchers("/usuario/**").permitAll()
                        .requestMatchers("/tablero/**").permitAll()
                        .requestMatchers("/jugador/**").permitAll()
                        .requestMatchers("/estadisticas/**").permitAll()
                        .anyRequest().permitAll());

        return http.build();
    }
}
