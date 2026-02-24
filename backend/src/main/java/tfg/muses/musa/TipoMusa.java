package tfg.muses.musa;

public enum TipoMusa {
    // Puntos por nivel (del primer al tercer puesto)
    CLIO(7, 5, 3, TipoInspiracion.LADOS),
    EUTERPE(7, 6, 5, TipoInspiracion.LADOS),
    TALIA(8, 6, 4, TipoInspiracion.LADOS),
    MELPOMENE(9, 6, 3, TipoInspiracion.LADOS),
    TERPSICORE(5, 4, 3, TipoInspiracion.VERTICES),
    ERATO(7, 4, 1, TipoInspiracion.VERTICES),
    POLIMNIA(6, 5, 4, TipoInspiracion.VERTICES),
    URANIA(6, 4, 2, TipoInspiracion.VERTICES),
    CALIOPE(8, 5, 2, TipoInspiracion.LADOS);

    private final int nivel1;
    private final int nivel2;
    private final int nivel3;
    private final TipoInspiracion tipoInspiracion;

    TipoMusa(int n1, int n2, int n3, TipoInspiracion tipoInspiracion) {
        this.nivel1 = n1;
        this.nivel2 = n2;
        this.nivel3 = n3;
        this.tipoInspiracion = tipoInspiracion;
    }

    public int getPuntos(int nivel) {
        return switch (nivel) {
            case 1 -> nivel1;
            case 2 -> nivel2;
            case 3 -> nivel3;
            default -> throw new IllegalArgumentException("Nivel inválido: " + nivel);
        };
    }

    public TipoInspiracion getTipoInspiracion() {
        return tipoInspiracion;
    }
}
