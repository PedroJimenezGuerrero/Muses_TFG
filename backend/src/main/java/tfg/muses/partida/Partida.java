package tfg.muses.partida;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import jakarta.persistence.CascadeType;
import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.JoinTable;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.MapKeyColumn;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Version;
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

    @ManyToMany
    @JoinTable(
        name = "partida_ganadores",
        joinColumns = @JoinColumn(name = "partida_id"),
        inverseJoinColumns = @JoinColumn(name = "usuario_id")
    )
    private List<Usuario> ganadores = new ArrayList<>();

    @ElementCollection
    @CollectionTable(name = "partida_selecciones_ronda", joinColumns = @JoinColumn(name = "partida_id"))
    @MapKeyColumn(name = "jugador_id")
    @Column(name = "carta_id")
    private Map<Long, Long> seleccionesRonda = new HashMap<>();

    @Version
    private int version;
}
