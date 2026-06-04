package tfg.muses.Partida;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import java.lang.reflect.Field;
import java.time.LocalDateTime;
import java.util.List;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import tfg.muses.exception.ResourceNotFoundException;
import tfg.muses.partida.Partida;
import tfg.muses.partida.PartidaController;
import tfg.muses.partida.PartidaService;

@WebMvcTest(PartidaController.class)
@WithMockUser
public class PartidaControllerTests {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private PartidaService partidaService;

    // ── GET /partida/{id} ────────────────────────────────────────────────────

    @Test
    public void getByIdRetornaPartidaExistente() throws Exception {
        Partida partida = buildPartida(1L);
        when(partidaService.getById(1L)).thenReturn(partida);

        mockMvc.perform(get("/partida/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.rondaActual").value(1));
    }

    @Test
    public void getByIdRetorna404CuandoNoExiste() throws Exception {
        when(partidaService.getById(99L)).thenThrow(new ResourceNotFoundException("Partida", 99L));

        mockMvc.perform(get("/partida/99"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("Partida con id 99 no encontrado"));
    }

    @Test
    public void getByIdConIdInvalidoRetorna400() throws Exception {
        mockMvc.perform(get("/partida/abc"))
                .andExpect(status().isBadRequest());
    }

    // ── GET /partida ─────────────────────────────────────────────────────────

    @Test
    public void getAllRetornaListaDePartidas() throws Exception {
        Partida partida1 = buildPartida(1L);
        Partida partida2 = buildPartida(2L);
        when(partidaService.getAll()).thenReturn(List.of(partida1, partida2));

        mockMvc.perform(get("/partida"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2));
    }

    @Test
    public void getAllRetornaListaVacia() throws Exception {
        when(partidaService.getAll()).thenReturn(List.of());

        mockMvc.perform(get("/partida"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(0));
    }

    // ── POST /partida ────────────────────────────────────────────────────────

    @Test
    public void createCreaPartida() throws Exception {
        Partida partida = buildPartida(1L);
        when(partidaService.create(any(Partida.class))).thenReturn(partida);

        String json = """
                {
                    "rondaActual": 1,
                    "maxRondas": 9,
                    "fechaInicio": "2026-03-02T12:00:00"
                }
                """;

        mockMvc.perform(post("/partida")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(json))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.rondaActual").value(1));

        verify(partidaService).create(any(Partida.class));
    }

    @Test
    public void createSinCsrfRetorna403() throws Exception {
        String json = """
                {
                    "rondaActual": 1,
                    "fechaInicio": "2026-03-02T12:00:00"
                }
                """;

        mockMvc.perform(post("/partida")
                .contentType(MediaType.APPLICATION_JSON)
                .content(json))
                .andExpect(status().isForbidden());
    }

    // ── PUT /partida/{id} ────────────────────────────────────────────────────

    @Test
    public void updateActualizaPartida() throws Exception {
        Partida partidaActualizada = buildPartida(1L);
        partidaActualizada.setRondaActual(5);
        when(partidaService.update(eq(1L), any(Partida.class))).thenReturn(partidaActualizada);

        String json = """
                {
                    "rondaActual": 5,
                    "maxRondas": 9,
                    "fechaInicio": "2026-03-02T12:00:00"
                }
                """;

        mockMvc.perform(put("/partida/1")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(json))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.rondaActual").value(5));
    }

    @Test
    public void updateRetorna404CuandoPartidaNoExiste() throws Exception {
        when(partidaService.update(eq(99L), any(Partida.class)))
                .thenThrow(new ResourceNotFoundException("Partida", 99L));

        String json = """
                {
                    "rondaActual": 1,
                    "fechaInicio": "2026-03-02T12:00:00"
                }
                """;

        mockMvc.perform(put("/partida/99")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(json))
                .andExpect(status().isNotFound());
    }

    // ── DELETE /partida/{id} ─────────────────────────────────────────────────

    @Test
    public void deleteInvocaServicioYRetorna200() throws Exception {
        doNothing().when(partidaService).delete(1L);

        mockMvc.perform(delete("/partida/1")
                .with(csrf()))
                .andExpect(status().isOk());

        verify(partidaService).delete(1L);
    }

    @Test
    public void deleteSinCsrfRetorna403() throws Exception {
        mockMvc.perform(delete("/partida/1"))
                .andExpect(status().isForbidden());
    }

    // ── POST /partida/{partidaId}/seleccionar-carta ──────────────────────────

    @Test
    public void seleccionarCartaInvocaServicio() throws Exception {
        doNothing().when(partidaService).seleccionarCarta(1L, 2L, 10L);

        mockMvc.perform(post("/partida/1/seleccionar-carta")
                .with(csrf())
                .param("jugadorId", "2")
                .param("cartaId", "10"))
                .andExpect(status().isOk());

        verify(partidaService).seleccionarCarta(1L, 2L, 10L);
    }

    @Test
    public void seleccionarCartaSinJugadorIdRetorna400() throws Exception {
        mockMvc.perform(post("/partida/1/seleccionar-carta")
                .with(csrf())
                .param("cartaId", "10"))
                .andExpect(status().isBadRequest());
    }

    @Test
    public void seleccionarCartaSinCartaIdRetorna400() throws Exception {
        mockMvc.perform(post("/partida/1/seleccionar-carta")
                .with(csrf())
                .param("jugadorId", "2"))
                .andExpect(status().isBadRequest());
    }

    @Test
    public void seleccionarCartaSinParametrosRetorna400() throws Exception {
        mockMvc.perform(post("/partida/1/seleccionar-carta")
                .with(csrf()))
                .andExpect(status().isBadRequest());
    }

    @Test
    public void seleccionarCartaSinCsrfRetorna403() throws Exception {
        mockMvc.perform(post("/partida/1/seleccionar-carta")
                .param("jugadorId", "2")
                .param("cartaId", "10"))
                .andExpect(status().isForbidden());
    }

    @Test
    public void seleccionarCartaRetorna404CuandoPartidaNoExiste() throws Exception {
        doThrow(new ResourceNotFoundException("Partida", 99L))
                .when(partidaService).seleccionarCarta(99L, 1L, 10L);

        mockMvc.perform(post("/partida/99/seleccionar-carta")
                .with(csrf())
                .param("jugadorId", "1")
                .param("cartaId", "10"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("Partida con id 99 no encontrado"));
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private Partida buildPartida(Long id) {
        Partida partida = new Partida();
        try {
            Field field = getFieldInHierarchy(partida.getClass(), "id");
            field.setAccessible(true);
            field.set(partida, id);
        } catch (Exception ignored) {
        }
        partida.setRondaActual(1);
        partida.setMaxRondas(9);
        partida.setFechaInicio(LocalDateTime.of(2026, 3, 2, 12, 0));
        return partida;
    }

    private Field getFieldInHierarchy(Class<?> clazz, String fieldName) throws NoSuchFieldException {
        while (clazz != null) {
            try {
                return clazz.getDeclaredField(fieldName);
            } catch (NoSuchFieldException e) {
                clazz = clazz.getSuperclass();
            }
        }
        throw new NoSuchFieldException("Field '" + fieldName + "' not found");
    }
}
