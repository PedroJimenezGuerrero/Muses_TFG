package tfg.muses.carta;

import jakarta.persistence.DiscriminatorColumn;
import jakarta.persistence.Entity;
import jakarta.persistence.Inheritance;
import jakarta.persistence.InheritanceType;
import lombok.Data;
import lombok.EqualsAndHashCode;
import tfg.muses.baseEntity.BaseEntity;

@Entity
@Inheritance(strategy = InheritanceType.JOINED)
@DiscriminatorColumn(name = "tipo_carta")
@Data
@EqualsAndHashCode(callSuper = true)
public abstract class CartaBase extends BaseEntity {
    private String nombre;
    private String descripcion;
}
