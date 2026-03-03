package tfg.muses.carta;

import lombok.Getter;

@Getter
public enum TipoAccion {
    DEVOCION_SOL(2),
    REVOLUCION_SOL(3),
    REVOLUCION_LUNA(4),
    DEVOCION_LUNA(5);

    private final int prioridad;

    TipoAccion(int prioridad) {
        this.prioridad = prioridad;
    }
}
