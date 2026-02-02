package tfg.muses.carta;

import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import lombok.Data;
import lombok.EqualsAndHashCode;
import tfg.muses.musa.TipoMusa;

@Entity
@DiscriminatorValue("INSPIRACION")
@Data
@EqualsAndHashCode(callSuper = true)
public class CartaInspiracion extends CartaBase {

    @Enumerated(EnumType.STRING)
    private TipoMusa musaObjetivo;

    private boolean usada;
}
