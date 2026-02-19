package tfg.muses.tablero;

import java.security.InvalidParameterException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import tfg.muses.jugador.Jugador;
import tfg.muses.musa.Musa;
import tfg.muses.musa.TipoMusa;
import tfg.muses.partida.Partida;
import tfg.muses.partida.PartidaRepository;
import tfg.muses.partida.PartidaService;
import tfg.muses.musa.MusaService;

@Service
public class TableroService {

    @Autowired
    private TableroRepository tableroRepository;

    @Autowired
    private PartidaRepository partidaRepository;

    @Autowired
    private PartidaService partidaService;

    @Autowired
    private MusaService musaService;

    public Tablero rotarAstros(Tablero tablero) {
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
        return tablero;
    }

    private Tablero revolucion(Tablero tablero, Integer posicionAstro) throws Exception {
        List<Musa> grid = tablero.getGrid();
        List<Musa> newGrid = null;
        switch (posicionAstro) {
            case 0:
                newGrid = rotacionDiagonalDominanteSuperior(grid);
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
        save(tablero);
        return tablero;
    }

    public Tablero revolucionLunar(Tablero tablero) {
        Integer posicionLuna = tablero.getLunaPos();
        try {
            tablero = revolucion(tablero, posicionLuna);
        } catch (Exception e) {
            e.printStackTrace();
        }
        save(tablero);
        return tablero;
    }

    public void devocionSol(Tablero tablero, Jugador jugador) {
        Musa musaSol = getMusasEnAstros(tablero).get("sol");
        musaService.colocarTokens(musaSol, 2, jugador);
        save(tablero);
    }

    public void devocionLuna(Tablero tablero, Jugador jugador) {
        Musa musaLuna = getMusasEnAstros(tablero).get("luna");
        musaService.colocarTokens(musaLuna, 2, jugador);
        save(tablero);
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

    private List<Musa> rotacionGeneral(List<Musa> grid, int[] indices) {
        Musa temp = grid.get(indices[0]);
        for (int i = 0; i < indices.length - 1; i++) {
            grid.set(indices[i], grid.get(indices[i + 1]));
        }
        grid.set(indices[indices.length - 1], temp);
        return grid;
    }

    public Tablero getById(Long id) {
        return tableroRepository.findById(id).orElse(null);
    }

    public Tablero getByPartidaId(Long partidaId) {
        Partida partida = partidaRepository.findById(partidaId).orElse(null);
        if (partida != null) {
            return partida.getTablero();
        }
        return null;
    }

    public Tablero save(Tablero tablero) {
        return tableroRepository.save(tablero);
    }

    /**
     * Obtener todos los tableros
     */
    public List<Tablero> getAll() {
        return tableroRepository.findAll();
    }

    /**
     * Actualizar un tablero existente
     */
    public Tablero update(Long id, Tablero tableroActualizado) {
        return tableroRepository.findById(id).map(tablero -> {
            tablero.setSolPos(tableroActualizado.getSolPos());
            tablero.setLunaPos(tableroActualizado.getLunaPos());
            tablero.setGrid(tableroActualizado.getGrid());
            return tableroRepository.save(tablero);
        }).orElse(null);
    }

    /**
     * Eliminar un tablero por su ID
     */
    public void delete(Long id) {
        tableroRepository.deleteById(id);
    }

    /**
     * Eliminar el tablero de una partida
     */
    public void deleteAllByPartida(Long partidaId) {
        Tablero tablero = partidaService.getTableroByPartida(partidaId);
        if (tablero != null) {
            tableroRepository.delete(tablero);
        }
    }

    /**
     * Obtener las musas en las posiciones del sol y la luna por ID
     */
    public Map<String, Musa> getMusasEnAstros(Long tableroId) {
        Tablero tablero = getById(tableroId);
        if (tablero == null) {
            throw new IllegalArgumentException("El tablero con id " + tableroId + " no existe.");
        }
        return getMusasEnAstros(tablero);
    }

    /**
     * Obtener las musas en las posiciones del sol y la luna
     */
    public Map<String, Musa> getMusasEnAstros(Tablero tablero) {
        int solGridIndex = mapAstroToGrid(tablero.getSolPos());
        int lunaGridIndex = mapAstroToGrid(tablero.getLunaPos());

        Musa musaSol = tablero.getGrid().get(solGridIndex);
        Musa musaLuna = tablero.getGrid().get(lunaGridIndex);

        Map<String, Musa> result = new HashMap<>();
        result.put("sol", musaSol);
        result.put("luna", musaLuna);

        return result;
    }

    /**
     * Mapear la posición del astro a la posición en el grid
     * 
     * @param astroPos Posición del astro (0-7)
     * @return Posición en el grid (0-8)
     */
    private int mapAstroToGrid(int astroPos) {
        switch (astroPos) {
            case 0:
                return 0;
            case 1:
                return 1;
            case 2:
                return 2;
            case 3:
                return 5;
            case 4:
                return 8;
            case 5:
                return 7;
            case 6:
                return 6;
            case 7:
                return 3;
            default:
                throw new InvalidParameterException("Posición de astro inválida: " + astroPos);
        }
    }

    public void inspiracion(Tablero tablero, TipoMusa caliope) {
        // TODO Auto-generated method stub
        throw new UnsupportedOperationException("Unimplemented method 'inspiracion'");
    }
}