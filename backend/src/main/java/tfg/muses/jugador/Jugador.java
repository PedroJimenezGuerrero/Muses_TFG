package tfg.muses.jugador;

import java.util.List;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OneToOne;
import lombok.Data;
import lombok.EqualsAndHashCode;
import tfg.muses.baseEntity.BaseEntity;
import tfg.muses.carta.CartaBase;
import tfg.muses.carta.CartaInspiracion;
import tfg.muses.token.Token;
import tfg.muses.usuario.Usuario;

@Entity
@Data
@EqualsAndHashCode(callSuper = true)
public class Jugador extends BaseEntity {

    @Column(nullable = false)
    private String nombre; // Nickname in the game context
    
    private int numeroJugador;
    private int puntuacionTotal;

    @OneToOne(cascade = CascadeType.ALL)
    private CartaInspiracion cartaInspiracion;

    @OneToMany(cascade = CascadeType.ALL)
    private List<CartaBase> mano;

    @OneToMany(cascade = CascadeType.ALL)
    private List<Token> reservaTokens;

    @ManyToOne(optional = false)
    private Usuario usuario;
}
