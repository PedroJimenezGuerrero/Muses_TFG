package tfg.muses.carta;

import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Entity
@DiscriminatorValue("ACCION")
@Data
@EqualsAndHashCode(callSuper = true)
public class CartaAccion extends CartaBase {

    @Enumerated(EnumType.STRING)
    private TipoAccion tipo;

    private int prioridad;
}
