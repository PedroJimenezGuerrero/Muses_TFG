package tfg.muses.carta;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface CartaRepository extends JpaRepository<CartaBase, Long> {

    @Query("SELECT c FROM CartaAccion c WHERE c.tipo = :tipo")
    Optional<CartaAccion> findCartaAccionByTipo(@Param("tipo") TipoAccion tipo);
}
