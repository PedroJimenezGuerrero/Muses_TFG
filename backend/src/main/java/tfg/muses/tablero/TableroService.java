package tfg.muses.tablero;

import org.springframework.stereotype.Service;

@Service
public class TableroService {
    public void rotarAstros(TableroModel tablero){
        Integer nuevaPosicionSol = tablero.getSolPos();
        Integer nuevaPosicionLuna = tablero.getLunaPos();

        nuevaPosicionLuna = (nuevaPosicionLuna + 1) % 8;
        nuevaPosicionSol = (nuevaPosicionSol + 1) % 8;

        tablero.setSolPos(nuevaPosicionSol);
        tablero.setLunaPos(nuevaPosicionLuna);
    }

}