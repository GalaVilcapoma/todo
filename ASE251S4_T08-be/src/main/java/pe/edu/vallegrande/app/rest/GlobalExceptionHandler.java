package pe.edu.vallegrande.app.rest;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;
import reactor.core.publisher.Mono;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;

/**
 * Traduce las excepciones de los servicios a códigos HTTP con sentido.
 *
 * <p>Sin este advice, Spring respondía 500 a cualquier fallo de validación y los
 * servicios se veían obligados a "tragarse" el error para poder enviar un mensaje
 * legible, lo que convertía los fallos en respuestas HTTP 200.
 */
@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(ResponseStatusException.class)
    public Mono<ResponseEntity<Map<String, Object>>> handleResponseStatus(ResponseStatusException ex) {
        return responder(ex.getStatusCode().value(), ex.getReason(), ex);
    }

    /** Datos inválidos en la petición: cantidades negativas, estados desconocidos, etc. */
    @ExceptionHandler(IllegalArgumentException.class)
    public Mono<ResponseEntity<Map<String, Object>>> handleBadRequest(IllegalArgumentException ex) {
        return responder(HttpStatus.BAD_REQUEST.value(), ex.getMessage(), ex);
    }

    /**
     * Reglas de negocio incumplidas: stock insuficiente, entidad inactiva,
     * pedido ya cancelado. Son errores del cliente (4xx), no fallos del servidor.
     */
    @ExceptionHandler(IllegalStateException.class)
    public Mono<ResponseEntity<Map<String, Object>>> handleConflict(IllegalStateException ex) {
        return responder(HttpStatus.CONFLICT.value(), ex.getMessage(), ex);
    }

    /**
     * Los servicios lanzan {@code RuntimeException("... not found ...")} al no encontrar
     * un recurso, así que se clasifican por mensaje en lugar de obligar a revisar cada
     * servicio. El resto se registra como fallo real del servidor.
     */
    @ExceptionHandler(RuntimeException.class)
    public Mono<ResponseEntity<Map<String, Object>>> handleRuntime(RuntimeException ex) {
        if (esNoEncontrado(ex.getMessage())) {
            return responder(HttpStatus.NOT_FOUND.value(), ex.getMessage(), ex);
        }
        log.error("Error no controlado", ex);
        return responder(HttpStatus.INTERNAL_SERVER_ERROR.value(),
                "Ocurrió un error inesperado en el servidor.", ex);
    }

    @ExceptionHandler(Exception.class)
    public Mono<ResponseEntity<Map<String, Object>>> handleUnexpected(Exception ex) {
        log.error("Error no controlado", ex);
        return responder(HttpStatus.INTERNAL_SERVER_ERROR.value(),
                "Ocurrió un error inesperado en el servidor.", ex);
    }

    private Mono<ResponseEntity<Map<String, Object>>> responder(int status, String mensaje, Exception origen) {
        if (status >= HttpStatus.INTERNAL_SERVER_ERROR.value()) {
            log.error("{} -> {}: {}", origen.getClass().getSimpleName(), status, mensaje, origen);
        } else {
            log.warn("{} -> {}: {}", origen.getClass().getSimpleName(), status, mensaje);
        }

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("error", mensaje != null ? mensaje : "Error desconocido.");
        body.put("status", status);
        body.put("timestamp", LocalDateTime.now());

        return Mono.just(ResponseEntity.status(status).body(body));
    }

    private boolean esNoEncontrado(String mensaje) {
        if (mensaje == null) {
            return false;
        }
        String normalizado = mensaje.toLowerCase(Locale.ROOT);
        return normalizado.contains("not found") || normalizado.contains("no encontrado");
    }
}
