package tfg.muses.tablero;

import org.springframework.stereotype.Service;

@Service
public class TableroService {
    public void rotarAstros(Tablero tablero){
        Integer nuevaPosicionSol = tablero.getSolPos();
        Integer nuevaPosicionLuna = tablero.getLunaPos();

        nuevaPosicionLuna = (nuevaPosicionLuna + 1) % 8;
        nuevaPosicionSol = (nuevaPosicionSol + 1) % 8;

        tablero.setSolPos(nuevaPosicionSol);
        tablero.setLunaPos(nuevaPosicionLuna);

        // Si no están en índices opuestos, se toma el token del sol como 
        // posición correcta y se ajusta la luna acorde con él
        if (tablero.getSolPos() - tablero.getLunaPos() != 4){
            nuevaPosicionLuna = (tablero.getSolPos() + 4) % 8;
            tablero.setLunaPos(nuevaPosicionLuna);
        }
    }

}