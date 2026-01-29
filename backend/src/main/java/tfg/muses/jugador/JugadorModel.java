package tfg.muses.jugador;

import java.util.List;

import jakarta.persistence.Entity;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OneToOne;
import lombok.Data;
import lombok.EqualsAndHashCode;
import tfg.muses.baseEntity.BaseEntity;
import tfg.muses.carta.CartaBase;
import tfg.muses.carta.CartaInspiracionModel;
import tfg.muses.token.TokenModel;
import tfg.muses.usuario.UsuarioModel;

@Entity
@Data
@EqualsAndHashCode(callSuper = true)
public class JugadorModel extends BaseEntity {

    private String nombre; // Nickname in the game context
    private int numeroJugador;
    private int puntuacionTotal;

    @OneToOne
    private CartaInspiracionModel cartaInspiracion;

    @OneToMany
    private List<CartaBase> mano;

    @OneToMany
    private List<TokenModel> reservaTokens;

    @ManyToOne
    private UsuarioModel usuario;
}
