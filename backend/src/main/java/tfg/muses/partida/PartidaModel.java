package tfg.muses.partida;

import jakarta.persistence.Entity;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OneToOne;
import java.time.LocalDateTime;
import java.util.List;
import lombok.Data;
import lombok.EqualsAndHashCode;
import tfg.muses.baseEntity.BaseEntity;
import tfg.muses.jugador.JugadorModel;
import tfg.muses.tablero.TableroModel;
import tfg.muses.usuario.UsuarioModel;

@Entity
@Data
@EqualsAndHashCode(callSuper = true)
public class PartidaModel extends BaseEntity {

    private int rondaActual;
    private int maxRondas = 9;
    private int duracionTotal;

    private LocalDateTime fechaInicio;

    private LocalDateTime fechaFin;

    @OneToOne
    private TableroModel tablero;

    @OneToMany
    private List<JugadorModel> jugadores;

    @ManyToOne
    private UsuarioModel ganador;
}
