package tfg.muses.Tablero;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import java.lang.reflect.Field;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import tools.jackson.databind.ObjectMapper;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import tfg.muses.jugador.Jugador;
import tfg.muses.jugador.JugadorService;
import tfg.muses.musa.Musa;
import tfg.muses.musa.TipoMusa;
import tfg.muses.tablero.Tablero;
import tfg.muses.tablero.TableroController;
import tfg.muses.tablero.TableroService;

@WebMvcTest(TableroController.class)
@WithMockUser
public class TableroControllerTests {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private TableroService tableroService;

    @MockitoBean
    private JugadorService jugadorService;

    @Autowired
    private ObjectMapper objectMapper;

    // ── PUT /tablero/rotarAstros/{id} ─────────────────────────────────────────

    @Test
    public void rotarAstrosRetornaTableroActualizado() throws Exception {
        Tablero tablero = buildTablero(2, 6);
        when(tableroService.getById(1L)).thenReturn(tablero);
        when(tableroService.rotarAstros(tablero)).thenReturn(tablero);

        mockMvc.perform(put("/tablero/rotarAstros/1").with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.solPos").value(2))
                .andExpect(jsonPath("$.lunaPos").value(6));
    }

    @Test
    public void rotarAstrosConTableroInexistenteRetornaNullBody() throws Exception {
        when(tableroService.getById(99L)).thenReturn(null);
        when(tableroService.rotarAstros(isNull())).thenReturn(null);

        mockMvc.perform(put("/tablero/rotarAstros/99").with(csrf()))
                .andExpect(status().isOk());
    }

    // ── PUT /tablero/revolucionSolar/{jugadorId} ──────────────────────────────

    @Test
    public void revolucionSolarRetornaTableroActualizado() throws Exception {
        Tablero tablero = buildTablero(1, 5);
        Jugador jugador = buildJugador(1L);
        when(tableroService.getByPlayerId(1L)).thenReturn(tablero);
        when(jugadorService.getById(1L)).thenReturn(jugador);
        when(tableroService.revolucionSolar(tablero, jugador)).thenReturn(tablero);

        mockMvc.perform(put("/tablero/revolucionSolar/1").with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.solPos").value(1));
    }

    @Test
    public void revolucionSolarSigueRetornandoTableroAunqueLanceExcepcion() throws Exception {
        Tablero tablero = buildTablero(1, 5);
        Jugador jugador = buildJugador(1L);
        when(tableroService.getByPlayerId(1L)).thenReturn(tablero);
        when(jugadorService.getById(1L)).thenReturn(jugador);
        when(tableroService.revolucionSolar(tablero, jugador)).thenThrow(new RuntimeException("Error simulado"));

        // El controlador captura la excepción y retorna el tablero sin modificar
        mockMvc.perform(put("/tablero/revolucionSolar/1").with(csrf()))
                .andExpect(status().isOk());
    }

    // ── PUT /tablero/revolucionLunar/{jugadorId} ──────────────────────────────

    @Test
    public void revolucionLunarRetornaTableroActualizado() throws Exception {
        Tablero tablero = buildTablero(1, 5);
        Jugador jugador = buildJugador(1L);
        when(tableroService.getByPlayerId(1L)).thenReturn(tablero);
        when(jugadorService.getById(1L)).thenReturn(jugador);
        when(tableroService.revolucionLunar(tablero, jugador)).thenReturn(tablero);

        mockMvc.perform(put("/tablero/revolucionLunar/1").with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.lunaPos").value(5));
    }

    @Test
    public void revolucionLunarSigueRetornandoTableroAunqueLanceExcepcion() throws Exception {
        Tablero tablero = buildTablero(1, 5);
        Jugador jugador = buildJugador(1L);
        when(tableroService.getByPlayerId(1L)).thenReturn(tablero);
        when(jugadorService.getById(1L)).thenReturn(jugador);
        when(tableroService.revolucionLunar(tablero, jugador)).thenThrow(new RuntimeException("Error simulado"));

        mockMvc.perform(put("/tablero/revolucionLunar/1").with(csrf()))
                .andExpect(status().isOk());
    }

    // ── POST /tablero ─────────────────────────────────────────────────────────

    @Test
    public void createTableroRetornaNuevoTablero() throws Exception {
        Tablero tablero = buildTablero(0, 4);
        when(tableroService.save(any(Tablero.class))).thenReturn(tablero);

        mockMvc.perform(post("/tablero")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(tablero)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.solPos").value(0))
                .andExpect(jsonPath("$.lunaPos").value(4));
    }

    // ── GET /tablero/getMusasEnAstros/{id} ────────────────────────────────────

    @Test
    public void getMusasEnAstrosRetornaMapDeMusas() throws Exception {
        Musa musaSol = buildMusa(TipoMusa.CALIOPE);
        Musa musaLuna = buildMusa(TipoMusa.CLIO);
        Map<String, Musa> musas = new HashMap<>();
        musas.put("sol", musaSol);
        musas.put("luna", musaLuna);
        when(tableroService.getMusasEnAstros(1L)).thenReturn(musas);

        mockMvc.perform(get("/tablero/getMusasEnAstros/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.sol.nombre").value("CALIOPE"))
                .andExpect(jsonPath("$.luna.nombre").value("CLIO"));
    }

    @Test
    public void getMusasEnAstrosRetorna400CuandoTableroNoExiste() throws Exception {
        when(tableroService.getMusasEnAstros(99L))
                .thenThrow(new IllegalArgumentException("El tablero con id 99 no existe."));

        mockMvc.perform(get("/tablero/getMusasEnAstros/99"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("El tablero con id 99 no existe."));
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private Tablero buildTablero(int solPos, int lunaPos) {
        Tablero t = new Tablero();
        t.setSolPos(solPos);
        t.setLunaPos(lunaPos);
        List<Musa> grid = new ArrayList<>();
        for (TipoMusa tipo : TipoMusa.values()) {
            grid.add(buildMusa(tipo));
        }
        t.setGrid(grid);
        return t;
    }

    private Musa buildMusa(TipoMusa tipo) {
        Musa m = new Musa();
        m.setNombre(tipo);
        return m;
    }

    private Jugador buildJugador(Long id) {
        Jugador j = new Jugador();
        j.setNombre("Jugador " + id);
        try {
            Field f = getIdField(j.getClass());
            f.setAccessible(true);
            f.set(j, id);
        } catch (Exception ignored) {
        }
        return j;
    }

    private Field getIdField(Class<?> clazz) throws NoSuchFieldException {
        while (clazz != null) {
            try {
                return clazz.getDeclaredField("id");
            } catch (NoSuchFieldException e) {
                clazz = clazz.getSuperclass();
            }
        }
        throw new NoSuchFieldException("id");
    }
}
