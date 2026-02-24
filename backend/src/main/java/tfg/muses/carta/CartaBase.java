package tfg.muses.carta;

import com.fasterxml.jackson.annotation.JsonSubTypes;
import com.fasterxml.jackson.annotation.JsonTypeInfo;
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
@JsonTypeInfo(use = JsonTypeInfo.Id.NAME, property = "tipoCarta")
@JsonSubTypes({
        @JsonSubTypes.Type(value = CartaAccion.class, name = "ACCION"),
        @JsonSubTypes.Type(value = CartaInspiracion.class, name = "INSPIRACION")
})
@Data
@EqualsAndHashCode(callSuper = true)
public abstract class CartaBase extends BaseEntity {
    private String nombre;
    private String descripcion;
}
