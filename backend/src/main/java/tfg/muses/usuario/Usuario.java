package tfg.muses.usuario;

import java.time.LocalDateTime;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.OneToOne;
import lombok.Data;
import lombok.EqualsAndHashCode;
import tfg.muses.baseEntity.BaseEntity;
import tfg.muses.estadisticas.Estadisticas;

@Entity
@Data
@EqualsAndHashCode(callSuper = true)
public class Usuario extends BaseEntity {

    @Column(unique = true, nullable = false)
    private String username;

    @Column(nullable = false)
    private String password; // Debería estar encriptada

    @Column(unique = true, nullable = false)
    private String email;

    @Column(nullable = false)
    private LocalDateTime fechaRegistro;

    @OneToOne(cascade = CascadeType.ALL)
    private Estadisticas estadisticas;
}
