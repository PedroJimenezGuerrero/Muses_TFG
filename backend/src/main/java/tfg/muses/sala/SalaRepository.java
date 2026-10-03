package tfg.muses.sala;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface SalaRepository extends JpaRepository<Sala, Long> {
    Optional<Sala> findByCodigo(String codigo);
    Optional<Sala> findByPartidaId(Long partidaId);
    boolean existsByCodigo(String codigo);
}
