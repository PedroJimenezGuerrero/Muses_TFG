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
import lombok.ToString;
import tfg.muses.baseEntity.BaseEntity;
import tfg.muses.carta.CartaInspiracion;
import tfg.muses.token.Token;
import tfg.muses.usuario.Usuario;

@Entity
@Data
@EqualsAndHashCode(callSuper = true)
public class Jugador extends BaseEntity {

    @Column(nullable = false)
    private String nombre;

    private int numeroJugador;
    private int puntuacionTotal;

    @OneToOne(cascade = CascadeType.ALL)
    private CartaInspiracion cartaInspiracion;

    @OneToMany(cascade = CascadeType.ALL)
    @EqualsAndHashCode.Exclude
    @ToString.Exclude
    private List<Token> tokens;

    @ManyToOne
    private Usuario usuario;

    private boolean conectado = true;
    private boolean esBot = false;

    public boolean isBot() {
        return esBot;
    }

    public void setBot(boolean bot) {
        this.esBot = bot;
    }
}
