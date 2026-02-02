package tfg.muses.partida;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OneToOne;
import java.time.LocalDateTime;
import java.util.List;
import lombok.Data;
import lombok.EqualsAndHashCode;
import tfg.muses.baseEntity.BaseEntity;
import tfg.muses.jugador.Jugador;
import tfg.muses.tablero.Tablero;
import tfg.muses.usuario.Usuario;

@Entity
@Data
@EqualsAndHashCode(callSuper = true)
public class Partida extends BaseEntity {

    private int rondaActual;
    private int maxRondas = 9;
    private int duracionTotal;

    @Column(nullable = false)
    private LocalDateTime fechaInicio;

    private LocalDateTime fechaFin;

    @OneToOne(cascade = CascadeType.ALL)
    private Tablero tablero;

    @OneToMany(cascade = CascadeType.ALL)
    private List<Jugador> jugadores;

    @ManyToOne
    private Usuario ganador;
}
