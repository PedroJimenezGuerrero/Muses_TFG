package tfg.muses.partida;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface PartidaRepository extends JpaRepository<Partida, Long>{
    Optional<Partida> findByJugadoresId(Long jugadorId);
}
