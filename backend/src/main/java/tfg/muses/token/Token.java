package tfg.muses.token;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.Entity;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import lombok.Data;
import lombok.EqualsAndHashCode;
import tfg.muses.baseEntity.BaseEntity;
import tfg.muses.jugador.Jugador;

@Entity
@Data
@EqualsAndHashCode(callSuper = true)
public class Token extends BaseEntity {
    boolean colocado;

    @ManyToOne
    @JoinColumn(name = "jugador_id")
    @JsonIgnoreProperties({"tokens", "cartaInspiracion"})
    private Jugador jugador;
}
