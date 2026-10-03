package tfg.muses.puntuacion;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import tfg.muses.estadisticas.Estadisticas;
import tfg.muses.estadisticas.EstadisticasRepository;
import tfg.muses.jugador.Jugador;
import tfg.muses.jugador.JugadorRepository;
import tfg.muses.musa.Musa;
import tfg.muses.partida.Partida;
import tfg.muses.partida.PartidaRepository;
import tfg.muses.token.Token;
import tfg.muses.usuario.Usuario;

@Service
public class PuntuacionService {

    @Autowired
    private EstadisticasRepository estadisticasRepository;

    @Autowired
    private JugadorRepository jugadorRepository;

    @Autowired
    private PartidaRepository partidaRepository;

    /**
     * F15: Contabilizar tokens de devoción colocados por cada jugador en la musa.
     */
    public Map<Jugador, Integer> contarTokensPorJugador(Musa musa, List<Jugador> jugadores) {
        Map<Jugador, Integer> recuento = new HashMap<>();
        for (Jugador j : jugadores) {
            recuento.put(j, 0);
        }

        if (musa != null && musa.getTokensColocados() != null) {
            for (Token token : musa.getTokensColocados()) {
                if (token.getJugador() != null && recuento.containsKey(token.getJugador())) {
                    recuento.put(token.getJugador(), recuento.get(token.getJugador()) + 1);
                }
            }
        }
        return recuento;
    }

    /**
     * F16 & F17: Calcular puntos obtenidos por cada jugador en una musa resolviendo empates.
     */
    public Map<Jugador, Integer> calcularPuntosMusa(Musa musa, List<Jugador> jugadores) {
        Map<Jugador, Integer> puntos = new HashMap<>();
        for (Jugador j : jugadores) {
            puntos.put(j, 0);
        }

        if (musa == null) {
            return puntos;
        }

        int n1 = musa.getPuntos(1);
        int n2 = musa.getPuntos(2);
        int n3 = musa.getPuntos(3);

        Map<Jugador, Integer> recuento = contarTokensPorJugador(musa, jugadores);

        // Agrupar únicamente jugadores con tokens > 0 ordenados por cantidad de tokens descendente
        Map<Integer, List<Jugador>> gruposPorTokens = recuento.entrySet().stream()
                .filter(entry -> entry.getValue() > 0)
                .collect(Collectors.groupingBy(
                        Map.Entry::getValue,
                        () -> new LinkedHashMap<Integer, List<Jugador>>(),
                        Collectors.mapping(Map.Entry::getKey, Collectors.toList())
                ));

        List<List<Jugador>> gruposOrdenados = gruposPorTokens.entrySet().stream()
                .sorted(Map.Entry.<Integer, List<Jugador>>comparingByKey().reversed())
                .map(Map.Entry::getValue)
                .toList();

        if (gruposOrdenados.isEmpty()) {
            return puntos;
        }

        List<Jugador> g1 = gruposOrdenados.get(0);
        int k1 = g1.size();

        if (k1 >= 3) {
            // Empate de 3 o más en 1er puesto: floor((n1 + n2 + n3) / n)
            int pts = (int) Math.floor((double) (n1 + n2 + n3) / k1);
            for (Jugador j : g1) {
                puntos.put(j, pts);
            }
            return puntos;
        } else if (k1 == 2) {
            // Empate de 2 en 1er puesto: floor((n1 + n2) / 2)
            int pts1 = (int) Math.floor((double) (n1 + n2) / 2);
            for (Jugador j : g1) {
                puntos.put(j, pts1);
            }
            // Siguiente puesto disponible es el 3º
            if (gruposOrdenados.size() > 1) {
                List<Jugador> g2 = gruposOrdenados.get(1);
                int k2 = g2.size();
                int pts3 = (int) Math.floor((double) n3 / k2);
                for (Jugador j : g2) {
                    puntos.put(j, pts3);
                }
            }
            return puntos;
        } else {
            // k1 == 1: 1er puesto en solitario
            puntos.put(g1.get(0), n1);

            if (gruposOrdenados.size() > 1) {
                List<Jugador> g2 = gruposOrdenados.get(1);
                int k2 = g2.size();
                if (k2 >= 3) {
                    // Empate de 3 o más en 2º puesto: floor((n2 + n3) / n)
                    int pts2 = (int) Math.floor((double) (n2 + n3) / k2);
                    for (Jugador j : g2) {
                        puntos.put(j, pts2);
                    }
                } else if (k2 == 2) {
                    // Empate de 2 en 2º puesto: floor((n2 + n3) / 2)
                    int pts2 = (int) Math.floor((double) (n2 + n3) / 2);
                    for (Jugador j : g2) {
                        puntos.put(j, pts2);
                    }
                } else {
                    // k2 == 1: 2º puesto en solitario
                    puntos.put(g2.get(0), n2);

                    if (gruposOrdenados.size() > 2) {
                        List<Jugador> g3 = gruposOrdenados.get(2);
                        int k3 = g3.size();
                        // 3er puesto (solitario o empate): floor(n3 / n)
                        int pts3 = (int) Math.floor((double) n3 / k3);
                        for (Jugador j : g3) {
                            puntos.put(j, pts3);
                        }
                    }
                }
            }
            return puntos;
        }
    }

    /**
     * F18: Calcular puntuación final acumulando los puntos de todas las musas en cada jugador.
     */
    public void calcularPuntuacionTotalPartida(Partida partida) {
        if (partida == null || partida.getTablero() == null || partida.getJugadores() == null) {
            return;
        }

        Map<Jugador, Integer> totales = new HashMap<>();
        for (Jugador j : partida.getJugadores()) {
            totales.put(j, 0);
        }

        List<Musa> grid = partida.getTablero().getGrid();
        if (grid != null) {
            for (Musa musa : grid) {
                Map<Jugador, Integer> puntosMusa = calcularPuntosMusa(musa, partida.getJugadores());
                for (Map.Entry<Jugador, Integer> entry : puntosMusa.entrySet()) {
                    totales.put(entry.getKey(), totales.get(entry.getKey()) + entry.getValue());
                }
            }
        }

        for (Jugador j : partida.getJugadores()) {
            j.setPuntuacionTotal(totales.getOrDefault(j, 0));
        }

        jugadorRepository.saveAll(partida.getJugadores());
    }

    /**
     * F19: Determinar ganador(es) de la partida (soporta empates múltiples).
     */
    public List<Usuario> determinarGanadores(Partida partida) {
        if (partida == null || partida.getJugadores() == null || partida.getJugadores().isEmpty()) {
            return new ArrayList<>();
        }

        int maxPuntos = partida.getJugadores().stream()
                .mapToInt(Jugador::getPuntuacionTotal)
                .max()
                .orElse(0);

        List<Usuario> ganadores = partida.getJugadores().stream()
                .filter(j -> j.getPuntuacionTotal() == maxPuntos)
                .map(Jugador::getUsuario)
                .filter(u -> u != null)
                .distinct()
                .collect(Collectors.toCollection(ArrayList::new));

        partida.setGanadores(ganadores);
        return ganadores;
    }

    /**
     * Actualización de estadísticas al finalizar la partida.
     */
    public void actualizarEstadisticas(Partida partida, List<Usuario> ganadores) {
        if (partida == null || partida.getJugadores() == null) {
            return;
        }

        for (Jugador jugador : partida.getJugadores()) {
            Usuario usuario = jugador.getUsuario();
            if (usuario == null) {
                continue;
            }

            Estadisticas stats = usuario.getEstadisticas();
            if (stats == null) {
                stats = new Estadisticas();
                usuario.setEstadisticas(stats);
            }

            stats.setPartidasJugadas(stats.getPartidasJugadas() + 1);

            if (ganadores != null && ganadores.contains(usuario)) {
                stats.setVictorias(stats.getVictorias() + 1);
            } else {
                stats.setDerrotas(stats.getDerrotas() + 1);
            }

            stats.setPuntuacionTotal(stats.getPuntuacionTotal() + jugador.getPuntuacionTotal());

            int tokensColocados = 0;
            if (jugador.getTokens() != null) {
                tokensColocados = (int) jugador.getTokens().stream()
                        .filter(Token::isColocado)
                        .count();
            }
            stats.setTokensColocados(stats.getTokensColocados() + tokensColocados);

            if (jugador.getCartaInspiracion() != null && jugador.getCartaInspiracion().isUsada()) {
                stats.setCartasUtilizadas(stats.getCartasUtilizadas() + 1);
            }

            stats.setTiempoTotalJuego(stats.getTiempoTotalJuego() + partida.getDuracionTotal());

            estadisticasRepository.save(stats);
        }
    }

    /**
     * Orquestación completa del cierre de partida.
     */
    public void procesarFinPartida(Partida partida) {
        calcularPuntuacionTotalPartida(partida);
        List<Usuario> ganadores = determinarGanadores(partida);
        actualizarEstadisticas(partida, ganadores);
        partidaRepository.save(partida);
    }
}
