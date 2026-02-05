package tfg.muses.estadisticas;

import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class EstadisticasService {

    @Autowired
    private EstadisticasRepository estadisticasRepository;

    /**
     * Crear nuevas estadísticas
     */
    public Estadisticas create(Estadisticas estadisticas) {
        return estadisticasRepository.save(estadisticas);
    }

    /**
     * Obtener estadísticas por su ID
     */
    public Estadisticas getById(Long id) {
        return estadisticasRepository.findById(id).orElse(null);
    }

    /**
     * Obtener todas las estadísticas
     */
    public List<Estadisticas> getAll() {
        return estadisticasRepository.findAll();
    }

    /**
     * Actualizar estadísticas existentes
     */
    public Estadisticas update(Long id, Estadisticas estadisticasActualizadas) {
        return estadisticasRepository.findById(id).map(estadisticas -> {
            estadisticas.setPartidasJugadas(estadisticasActualizadas.getPartidasJugadas());
            estadisticas.setVictorias(estadisticasActualizadas.getVictorias());
            estadisticas.setDerrotas(estadisticasActualizadas.getDerrotas());
            estadisticas.setTiempoTotalJuego(estadisticasActualizadas.getTiempoTotalJuego());
            estadisticas.setCartasUtilizadas(estadisticasActualizadas.getCartasUtilizadas());
            estadisticas.setTokensColocados(estadisticasActualizadas.getTokensColocados());
            estadisticas.setPuntuacionTotal(estadisticasActualizadas.getPuntuacionTotal());
            return estadisticasRepository.save(estadisticas);
        }).orElse(null);
    }

    /**
     * Eliminar estadísticas por su ID
     */
    public void delete(Long id) {
        estadisticasRepository.deleteById(id);
    }

    /**
     * Eliminar todas las estadísticas
     */
    public void deleteAll() {
        estadisticasRepository.deleteAll();
    }
}
