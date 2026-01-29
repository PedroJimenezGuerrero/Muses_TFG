package tfg.muses.carta;

import lombok.Data;
import lombok.EqualsAndHashCode;
import tfg.muses.baseEntity.BaseEntity;

@Data
@EqualsAndHashCode(callSuper = true)
public abstract class CartaBase extends BaseEntity {
    private String nombre;
    private String descripcion;
}
