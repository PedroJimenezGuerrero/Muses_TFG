package tfg.muses.config;

import java.net.URI;
import javax.sql.DataSource;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.jdbc.DataSourceBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.core.env.Environment;

/**
 * Configuración dinámica de DataSource para compatibilidad con Render, Neon y local.
 * Convierte automáticamente la variable DATABASE_URL de proveedores en la nube al formato JDBC con SSL.
 */
@Configuration
public class DataSourceConfig {

    private static final Logger log = LoggerFactory.getLogger(DataSourceConfig.class);

    @Bean
    @Primary
    public DataSource dataSource(Environment env) {
        String databaseUrl = env.getProperty("DATABASE_URL");
        String springDatasourceUrl = env.getProperty("SPRING_DATASOURCE_URL");

        String jdbcUrl;
        String username = env.getProperty("spring.datasource.username", env.getProperty("DB_USER", "postgres"));
        String password = env.getProperty("spring.datasource.password", env.getProperty("DB_PASSWORD", "password"));

        if (springDatasourceUrl != null && !springDatasourceUrl.isBlank()) {
            jdbcUrl = springDatasourceUrl;
            log.info("Usando SPRING_DATASOURCE_URL para conexión a base de datos.");
        } else if (databaseUrl != null && !databaseUrl.isBlank()) {
            log.info("Detectada variable DATABASE_URL de Render / Cloud Provider.");
            try {
                URI uri = new URI(databaseUrl.replace("postgres://", "postgresql://"));
                String host = uri.getHost();
                int port = uri.getPort() > 0 ? uri.getPort() : 5432;
                String path = uri.getPath();
                String dbName = (path != null && path.startsWith("/")) ? path.substring(1) : path;

                if (uri.getUserInfo() != null) {
                    String[] userInfo = uri.getUserInfo().split(":");
                    username = userInfo[0];
                    if (userInfo.length > 1) {
                        password = userInfo[1];
                    }
                }

                jdbcUrl = "jdbc:postgresql://" + host + ":" + port + "/" + dbName + "?sslmode=require";
                log.info("DATABASE_URL parseada exitosamente hacia JDBC: host={}, port={}, db={}", host, port, dbName);
            } catch (Exception e) {
                log.warn("No se pudo parsear DATABASE_URL como URI, intentando prefijo jdbc: {}", e.getMessage());
                if (!databaseUrl.startsWith("jdbc:")) {
                    jdbcUrl = "jdbc:" + databaseUrl + (databaseUrl.contains("?") ? "&sslmode=require" : "?sslmode=require");
                } else {
                    jdbcUrl = databaseUrl;
                }
            }
        } else {
            String dbHost = env.getProperty("DB_HOST", "localhost");
            String dbPort = env.getProperty("DB_PORT", "5432");
            String dbName = env.getProperty("DB_NAME", "muses");
            jdbcUrl = "jdbc:postgresql://" + dbHost + ":" + dbPort + "/" + dbName;
            log.info("Usando configuración local: host={}, port={}, db={}", dbHost, dbPort, dbName);
        }

        return DataSourceBuilder.create()
                .driverClassName("org.postgresql.Driver")
                .url(jdbcUrl)
                .username(username)
                .password(password)
                .build();
    }
}
