package tfg.muses.tablero;

import java.security.InvalidParameterException;
import java.util.List;

import org.springframework.stereotype.Service;

import tfg.muses.musa.Musa;

@Service
public class TableroService {
    public void rotarAstros(Tablero tablero) {
        Integer nuevaPosicionSol = tablero.getSolPos();
        Integer nuevaPosicionLuna = tablero.getLunaPos();

        nuevaPosicionLuna = (nuevaPosicionLuna + 1) % 8;
        nuevaPosicionSol = (nuevaPosicionSol + 1) % 8;

        tablero.setSolPos(nuevaPosicionSol);
        tablero.setLunaPos(nuevaPosicionLuna);

        // Si no están en índices opuestos, se toma el token del sol como
        // posición correcta y se ajusta la luna acorde con él
        if (tablero.getSolPos() - tablero.getLunaPos() != 4) {
            nuevaPosicionLuna = (tablero.getSolPos() + 4) % 8;
            tablero.setLunaPos(nuevaPosicionLuna);
        }
    }

    private Tablero revolucion(Tablero tablero, Integer posicionAstro) throws Exception {
        List<Musa> grid = tablero.getGrid();
        List<Musa> newGrid = null;
        switch (posicionAstro) {
            case 0:
                newGrid = rotacionDiagonalDominanteSuperior(newGrid);
                break;
            case 1:
                newGrid = rotacionVerticalDerecha(grid);
                break;
            case 2:
                newGrid = rotacionDiagonalSecundariaInferior(grid);
                break;
            case 3:
                newGrid = rotacionHorizontalAbajo(grid);
                break;
            case 4:
                newGrid = rotacionDiagonaDominanteInferior(grid);
                break;
            case 5:
                newGrid = rotacionVerticalIzquierda(grid);
                break;
            case 6:
                newGrid = rotacionDiagonalSecundariaSuperior(grid);
                break;
            case 7:
                newGrid = rotacionHorizontalArriba(grid);
                break;
            default:
                throw new InvalidParameterException("No se ha proporcionado una posición válida para el astro");

        }
        tablero.setGrid(newGrid);

        return tablero;

    }

    public Tablero revolucionSolar(Tablero tablero) {
        Integer posicionSol = tablero.getSolPos();
        try {
            tablero = revolucion(tablero, posicionSol);
        } catch (Exception e) {
            e.printStackTrace();
        }
        return tablero;
    }

    public Tablero revolucionLunar(Tablero tablero) {
        Integer posicionLuna = tablero.getLunaPos();
        try {
            tablero = revolucion(tablero, posicionLuna);
        } catch (Exception e) {
            e.printStackTrace();
        }
        return tablero;
    }

    private List<Musa> rotacionGeneral(List<Musa> grid, int[] indices) {
        Musa temp = grid.get(indices[0]);
        for (int i = 0; i < indices.length - 1; i++) {
            grid.set(indices[i], grid.get(indices[i + 1]));
        }
        grid.set(indices[indices.length - 1], temp);
        return grid;
    }

    /*
     * Las rotaciones se hacen en sentido horario, pero
     * los indices se sustituyen en orden contrario para
     * conservar sus datos.
     * 
     * Si tenemos una cuadrícula como la siguiente:
     * 
     * 0 1 2
     * 3 4 5
     * 6 7 8
     * 
     * Y queremos rotar los elementos de la derecha en sentido horario de la
     * siguiente forma:
     * 
     * 4 -> 1 -> 2 -> 5 -> 8 -> 7 -> 4
     * 
     * debemos pasarlos en el orden 4,7,8,5,2,1 para conservar sus datos.
     */

    // Rotación en el eje vertical, parte derecha
    private List<Musa> rotacionVerticalDerecha(List<Musa> grid) {
        int[] indices = { 4, 7, 8, 5, 2, 1 };
        grid = rotacionGeneral(grid, indices);
        return grid;
    }

    // Rotación en el eje vertical, parte izquierda
    private List<Musa> rotacionVerticalIzquierda(List<Musa> grid) {
        int[] indices = { 4, 1, 0, 3, 6, 7 };
        grid = rotacionGeneral(grid, indices);
        return grid;
    }

    // Rotación en el eje horizontal, parte de arriba
    private List<Musa> rotacionHorizontalArriba(List<Musa> grid) {
        int[] indices = { 4, 5, 2, 1, 0, 3 };
        grid = rotacionGeneral(grid, indices);
        return grid;
    }

    // Rotación en el eje horizontal, parte de abajo
    private List<Musa> rotacionHorizontalAbajo(List<Musa> grid) {
        int[] indices = { 4, 3, 0, 1, 2, 5 };
        grid = rotacionGeneral(grid, indices);
        return grid;
    }

    // Rotación en diagonal de arriba izquierda a abajo derecha, parte de abajo
    private List<Musa> rotacionDiagonaDominanteInferior(List<Musa> grid) {
        int[] indices = { 4, 0, 3, 6, 7, 8 };
        grid = rotacionGeneral(grid, indices);
        return grid;
    }

    // Rotación en diagonal de arriba izquierda a abajo derecha, parte de arriba
    private List<Musa> rotacionDiagonalDominanteSuperior(List<Musa> grid) {
        int[] indices = { 4, 8, 5, 2, 1, 0 };
        grid = rotacionGeneral(grid, indices);
        return grid;
    }

    // Rotación en diagonal de arriba derecha a abajo izquierda, parte de abajo
    private List<Musa> rotacionDiagonalSecundariaInferior(List<Musa> grid) {
        int[] indices = { 4, 6, 7, 8, 5, 2 };
        grid = rotacionGeneral(grid, indices);
        return grid;
    }

    // Rotación en diagonal de arriba derecha a abajo izquierda, parte de arriba
    private List<Musa> rotacionDiagonalSecundariaSuperior(List<Musa> grid) {
        int[] indices = { 4, 2, 1, 0, 3, 6 };
        grid = rotacionGeneral(grid, indices);
        return grid;
    }

}