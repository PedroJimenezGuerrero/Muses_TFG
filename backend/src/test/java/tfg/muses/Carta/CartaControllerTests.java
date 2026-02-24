package tfg.muses.Carta;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import java.lang.reflect.Field;
import java.util.List;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import tfg.muses.carta.CartaAccion;
import tfg.muses.carta.CartaBase;
import tfg.muses.carta.CartaController;
import tfg.muses.carta.CartaInspiracion;
import tfg.muses.carta.CartaService;
import tfg.muses.carta.TipoAccion;

@WebMvcTest(CartaController.class)
@WithMockUser
public class CartaControllerTests {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private CartaService cartaService;

    // ── GET /carta/{id} ───────────────────────────────────────────────────────

    @Test
    public void getByIdRetornaCartaExistente() throws Exception {
        CartaAccion carta = buildCartaAccion(1L, "Revolución Solar", TipoAccion.REVOLUCION_SOL);
        when(cartaService.getById(1L)).thenReturn(carta);

        mockMvc.perform(get("/carta/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.nombre").value("Revolución Solar"));
    }

    @Test
    public void getByIdRetornaNullCuandoNoExiste() throws Exception {
        when(cartaService.getById(99L)).thenReturn(null);

        mockMvc.perform(get("/carta/99"))
                .andExpect(status().isOk())
                .andExpect(content().string(""));
    }

    // ── GET /carta/byPartida/{partidaId} ──────────────────────────────────────

    @Test
    public void getAllByPartidaRetornaListaDeCartas() throws Exception {
        CartaAccion carta1 = buildCartaAccion(1L, "Carta 1", TipoAccion.DEVOCION_SOL);
        CartaAccion carta2 = buildCartaAccion(2L, "Carta 2", TipoAccion.REVOLUCION_LUNA);
        when(cartaService.getAllByPartida(1L)).thenReturn(List.of(carta1, carta2));

        mockMvc.perform(get("/carta/byPartida/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2));
    }

    @Test
    public void getAllByPartidaRetornaListaVaciaCuandoNoHayCartas() throws Exception {
        when(cartaService.getAllByPartida(1L)).thenReturn(List.of());

        mockMvc.perform(get("/carta/byPartida/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(0));
    }

    // ── POST /carta ───────────────────────────────────────────────────────────

    @Test
    public void createCartaAccionConDiscriminadorCorrecto() throws Exception {
        CartaAccion guardada = buildCartaAccion(1L, "Nueva Carta", TipoAccion.REVOLUCION_SOL);
        when(cartaService.create(any(CartaBase.class))).thenReturn(guardada);

        // Con @JsonTypeInfo en CartaBase, el campo "tipoCarta" indica la subclase a
        // instanciar
        String cartaAccionJson = """
                {
                    "tipoCarta": "ACCION",
                    "tipo": "REVOLUCION_SOL",
                    "nombre": "Nueva Carta",
                    "descripcion": null
                }
                """;

        mockMvc.perform(post("/carta")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(cartaAccionJson))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.nombre").value("Nueva Carta"));
    }

    @Test
    public void createCartaInspiracionConDiscriminadorCorrecto() throws Exception {
        CartaInspiracion guardada = new CartaInspiracion();
        guardada.setNombre("Carta Inspiración");
        when(cartaService.create(any(CartaBase.class))).thenReturn(guardada);

        String cartaInspiracionJson = """
                {
                    "tipoCarta": "INSPIRACION",
                    "musaObjetivo": "CALIOPE",
                    "nombre": "Carta Inspiración",
                    "descripcion": null
                }
                """;

        mockMvc.perform(post("/carta")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(cartaInspiracionJson))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.nombre").value("Carta Inspiración"));
    }

    // ── DELETE /carta/{id} ────────────────────────────────────────────────────

    @Test
    public void deleteInvocaServicioYRetorna200() throws Exception {
        doNothing().when(cartaService).delete(1L);

        mockMvc.perform(delete("/carta/1")
                .with(csrf()))
                .andExpect(status().isOk());

        verify(cartaService).delete(1L);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private CartaAccion buildCartaAccion(Long id, String nombre, TipoAccion tipo) {
        CartaAccion carta = new CartaAccion();
        try {
            Field f = getIdField(carta.getClass());
            f.setAccessible(true);
            f.set(carta, id);
        } catch (Exception ignored) {
        }
        carta.setNombre(nombre);
        carta.setTipo(tipo);
        return carta;
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
