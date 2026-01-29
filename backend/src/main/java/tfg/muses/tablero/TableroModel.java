package tfg.muses.tablero;

import java.util.List;

import jakarta.persistence.Entity;
import jakarta.persistence.OneToMany;
import lombok.Data;
import lombok.EqualsAndHashCode;
import tfg.muses.baseEntity.BaseEntity;
import tfg.muses.musa.MusaModel;

@Entity
@Data
@EqualsAndHashCode(callSuper = true)
public class TableroModel extends BaseEntity {

    private int solPos; // Representamos posición como índice o valor
    private int lunaPos;

    @OneToMany
    private List<MusaModel> grid;
}
