package tfg.muses.musa;

import java.util.List;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
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

    @Column(nullable = false)
    private Integer puntosNivel1;

    @Column(nullable = false)
    private Integer puntosNivel2;

    @Column(nullable = false)
    private Integer puntosNivel3;

    public Integer getPuntos(int nivel) {
        return switch (nivel) {
            case 1 -> puntosNivel1;
            case 2 -> puntosNivel2;
            case 3 -> puntosNivel3;
            default -> throw new IllegalArgumentException("Nivel no válido: " + nivel);
        };
    }

    @OneToMany(cascade = CascadeType.ALL)
    private List<Token> tokensColocados;
}
