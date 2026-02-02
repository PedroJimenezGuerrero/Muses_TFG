package tfg.muses.tablero;

import java.util.List;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Entity;
import jakarta.persistence.OneToMany;
import lombok.Data;
import lombok.EqualsAndHashCode;
import tfg.muses.baseEntity.BaseEntity;
import tfg.muses.musa.Musa;

@Entity
@Data
@EqualsAndHashCode(callSuper = true)
public class Tablero extends BaseEntity {

    /*
    El índice de los tokens empieza en el 0 en la esquina superior izquierda

    0   1   2
    7       3
    6   5   4
    
    */
    private int solPos; 
    private int lunaPos;   

    @OneToMany(cascade = CascadeType.ALL)
    private List<Musa> grid;
}
