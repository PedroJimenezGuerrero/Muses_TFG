package tfg.muses.musa;

import java.util.List;
import java.util.Map;

import jakarta.persistence.CascadeType;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.OneToMany;
import lombok.Data;
import lombok.EqualsAndHashCode;
import tfg.muses.baseEntity.BaseEntity;
import tfg.muses.token.Token;

@Entity
@Data
@EqualsAndHashCode(callSuper = true)
public class Musa extends BaseEntity {

    @Enumerated(EnumType.STRING)
    private TipoMusa nombre;

    @ElementCollection
    private Map<Integer, Integer> nivelesPuntuacion; // Nivel -> Puntos

    @OneToMany(cascade = CascadeType.ALL)
    private List<Token> tokensColocados;
}
