package tfg.muses.usuario;

import java.time.LocalDateTime;

import jakarta.persistence.OneToOne;
import jakarta.persistence.Entity;
import lombok.Data;
import lombok.EqualsAndHashCode;
import tfg.muses.baseEntity.BaseEntity;
import tfg.muses.estadisticas.EstadisticasModel;

@Entity
@Data
@EqualsAndHashCode(callSuper = true)
public class UsuarioModel extends BaseEntity {

    private String username;
    private String password; // Debería estar encriptada
    private String email;

    private LocalDateTime fechaRegistro;

    @OneToOne
    private EstadisticasModel estadisticas;
}
