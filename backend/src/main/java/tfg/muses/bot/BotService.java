package tfg.muses.bot;

import tfg.muses.carta.CartaBase;
import tfg.muses.jugador.Jugador;
import tfg.muses.partida.Partida;

/**
 * Servicio de inteligencia artificial para la toma de decisiones y ejecución
 * automatizada de turnos de jugadores bot.
 */
public interface BotService {

    /**
     * F31: Evalúa el estado actual de la partida mediante heurística codiciosa y determina
     * la mejor carta para jugar en el turno del bot.
     *
     * @param partida Estado actual de la partida
     * @param bot     Jugador bot que debe seleccionar carta
     * @return La carta óptima según la función de utilidad (CartaAccion o CartaInspiracion), o null si inválido
     */
    CartaBase calcularMejorJugada(Partida partida, Jugador bot);

    /**
     * F32: Ejecuta automáticamente la selección de carta para el turno del bot
     * e invoca a PartidaService para registrar la jugada de forma idempotente.
     *
     * @param partida Estado actual de la partida
     * @param bot     Jugador bot
     */
    void ejecutarTurnoBot(Partida partida, Jugador bot);
}
