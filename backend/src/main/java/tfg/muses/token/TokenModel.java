package tfg.muses.token;

import jakarta.persistence.Entity;
import lombok.Data;
import lombok.EqualsAndHashCode;
import tfg.muses.baseEntity.BaseEntity;

@Entity
@Data
@EqualsAndHashCode(callSuper = true)
public class TokenModel extends BaseEntity {
    // Entidad simple por ahora, se puede extender si los tokens tienen más
    // propiedades
}
