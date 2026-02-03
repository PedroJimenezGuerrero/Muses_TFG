package tfg.muses.musa;

public enum TipoMusa {
    // Puntos por nivel (del primer al tercer puesto)
    CLIO(7, 5, 3),
    EUTERPE(7, 6, 5),
    TALIA(8, 6, 4),
    MELPOMENE(9, 6, 3),
    TERPSICORE(5, 4, 3),
    ERATO(7, 4, 1),
    POLIMNIA(6, 5, 4),
    URANIA(6, 4, 2),
    CALIOPE(8, 5, 2);

    private final int nivel1;
    private final int nivel2;
    private final int nivel3;

    TipoMusa(int n1, int n2, int n3) {
        this.nivel1 = n1;
        this.nivel2 = n2;
        this.nivel3 = n3;
    }

    public int getPuntos(int nivel) {
        return switch (nivel) {
            case 1 -> nivel1;
            case 2 -> nivel2;
            case 3 -> nivel3;
            default -> throw new IllegalArgumentException("Nivel inválido: " + nivel);
        };
    }
}
