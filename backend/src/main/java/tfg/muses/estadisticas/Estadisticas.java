package tfg.muses.estadisticas;

import jakarta.persistence.Entity;
import lombok.Data;
import lombok.EqualsAndHashCode;
import tfg.muses.baseEntity.BaseEntity;

@Entity
@Data
@EqualsAndHashCode(callSuper = true)
public class Estadisticas extends BaseEntity {

    private int partidasJugadas;
    private int victorias;
    private int derrotas;
    private int tiempoTotalJuego; // en minutos
    private int cartasUtilizadas;
    private int tokensColocados;
    private int puntuacionTotal;
}
