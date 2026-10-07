package tfg.muses.sala;

import java.util.ArrayList;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToOne;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.ToString;
import tfg.muses.baseEntity.BaseEntity;
import tfg.muses.jugador.Jugador;
import tfg.muses.partida.Partida;

/**
 * Sala de juego multijugador. Cada sala tiene un código alfanumérico único
 * (ej. MUS-4821), un estado (ESPERANDO/EN_CURSO/FINALIZADA), un jugador
 * anfitrión, y una lista de jugadores conectados.
 */
@Entity
@Data
@EqualsAndHashCode(callSuper = true)
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Sala extends BaseEntity {

    @Column(nullable = false, unique = true, length = 10)
    private String codigo;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private EstadoSala estado = EstadoSala.ESPERANDO;

    @Column(nullable = false)
    private int maxJugadores = 4;

    @ManyToOne(fetch = FetchType.EAGER)
    private Jugador anfitrion;

    @ManyToMany(fetch = FetchType.EAGER, cascade = CascadeType.MERGE)
    @EqualsAndHashCode.Exclude
    @ToString.Exclude
    private List<Jugador> jugadores = new ArrayList<>();

    @OneToOne(fetch = FetchType.EAGER)
    private Partida partida;
}
