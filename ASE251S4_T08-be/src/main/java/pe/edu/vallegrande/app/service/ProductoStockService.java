package pe.edu.vallegrande.app.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.mongodb.core.FindAndModifyOptions;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Service;
import pe.edu.vallegrande.app.model.Producto;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Ajustes de stock sobre el documento de MongoDB.
 *
 * <p>El inventario NO se modifica con el patrón leer → restar → guardar, porque dos
 * peticiones concurrentes leen el mismo valor y la segunda escritura pisa a la primera
 * (lost update). Cada ajuste se ejecuta como un único {@code $inc} condicional, de modo
 * que MongoDB lo aplica de forma atómica sobre el documento.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ProductoStockService {

    private final ReactiveMongoTemplate mongoTemplate;

    // =========================================================================
    // OPERACIONES UNITARIAS
    // =========================================================================

    /**
     * Resta stock verificando en la propia operación que hay existencias suficientes.
     * Si otro flujo consumió el stock entre la lectura y esta llamada, el filtro no
     * coincide y se devuelve un error en lugar de dejar el inventario en negativo.
     */
    public Mono<Producto> descontar(String productId, int cantidad) {
        if (cantidad <= 0) {
            return Mono.error(new IllegalArgumentException(
                    "La cantidad a descontar debe ser mayor a 0."));
        }
        Query query = Query.query(Criteria.where("_id").is(productId)
                .and("active").is(true)
                .and("currentStock").gte(cantidad));
        Update update = new Update()
                .inc("currentStock", -cantidad)
                .set("updatedAt", LocalDateTime.now());

        return mongoTemplate.findAndModify(query, update,
                        FindAndModifyOptions.options().returnNew(true), Producto.class)
                .switchIfEmpty(Mono.defer(() -> explicarFallo(productId, cantidad)))
                .doOnNext(producto -> log.info("[Stock] Descontadas {} unidades de '{}'. Stock actual={}",
                        cantidad, producto.getName(), producto.getCurrentStock()));
    }

    /**
     * Devuelve stock al inventario. Se usa tanto para una devolución real (pedido
     * cancelado) como para compensar un descuento aplicado.
     */
    public Mono<Producto> devolver(String productId, int cantidad) {
        return ajustar(productId, cantidad)
                .doOnNext(producto -> log.info("[Stock] Devueltas {} unidades a '{}'. Stock actual={}",
                        cantidad, producto.getName(), producto.getCurrentStock()));
    }

    /**
     * Ajuste crudo sin validación de existencias. delta positivo suma, delta negativo resta.
     * Solo debe usarse para devoluciones y compensaciones, donde el saldo ya es conocido.
     */
    public Mono<Producto> ajustar(String productId, int delta) {
        if (delta == 0) {
            return obtener(productId);
        }
        Query query = Query.query(Criteria.where("_id").is(productId));
        Update update = new Update()
                .inc("currentStock", delta)
                .set("updatedAt", LocalDateTime.now());

        return mongoTemplate.findAndModify(query, update,
                        FindAndModifyOptions.options().returnNew(true), Producto.class)
                .switchIfEmpty(Mono.error(new RuntimeException(
                        "Producto no encontrado con ID: " + productId)));
    }

    // =========================================================================
    // OPERACIONES POR LOTE
    // =========================================================================

    /**
     * Descuenta el stock de varios productos en un orden estable.
     *
     * <p>Devuelve el delta realmente descontado por producto (con signo negativo) para
     * que el llamador pueda compensar si la parte SQL Server falla. Si el descuento falla
     * a mitad del lote, revierte internamente lo aplicado hasta ese punto.
     */
    public Mono<Map<String, Integer>> descontarLote(Map<String, Integer> cantidadPorProducto) {
        if (cantidadPorProducto.isEmpty()) {
            return Mono.just(Map.of());
        }
        return Mono.defer(() -> {
            Map<String, Integer> aplicadas = new LinkedHashMap<>();
            return Flux.fromIterable(ordenEstable(cantidadPorProducto))
                    .concatMap(entry -> descontar(entry.getKey(), entry.getValue())
                            .doOnNext(producto -> aplicadas.put(entry.getKey(), -entry.getValue()))
                            .thenReturn(entry.getKey()))
                    .then(Mono.fromCallable(() -> Map.copyOf(aplicadas)))
                    .onErrorResume(error -> {
                        log.warn("[Stock] Descuento de lote incompleto, revirtiendo {} producto(s)",
                                aplicadas.size());
                        return revertirInterno(aplicadas, error);
                    });
        });
    }

    /**
     * Aplica ajustes crudos a varios productos en un orden estable.
     *
     * <p>Devuelve los deltas realmente aplicados para que el llamador pueda revertirlos
     * si la parte SQL Server falla. Si el lote falla a mitad, revierte internamente
     * lo aplicado hasta ese punto.
     */
    public Mono<Map<String, Integer>> ajustarLote(Map<String, Integer> deltaPorProducto) {
        if (deltaPorProducto.isEmpty()) {
            return Mono.just(Map.of());
        }
        return Mono.defer(() -> {
            Map<String, Integer> aplicados = new LinkedHashMap<>();
            return Flux.fromIterable(ordenEstable(deltaPorProducto))
                    .concatMap(entry -> ajustar(entry.getKey(), entry.getValue())
                            .doOnNext(producto -> aplicados.put(entry.getKey(), entry.getValue()))
                            .thenReturn(entry.getKey()))
                    .then(Mono.fromCallable(() -> Map.copyOf(aplicados)))
                    .onErrorResume(error -> {
                        log.warn("[Stock] Ajuste de lote incompleto, revirtiendo {} producto(s)",
                                aplicados.size());
                        return revertirInterno(aplicados, error);
                    });
        });
    }

    /**
     * Revierte los descuentos aplicados y conserva el error original, que es el que
     * explica el fallo de negocio. Si la reversión también falla se registra, porque
     * enmascararla con el error de stock dejaría sin explicar el fallo original.
     */
    public Mono<Map<String, Integer>> revertir(Map<String, Integer> aplicado) {
        return ajustarLote(negar(aplicado));
    }

    // =========================================================================
    // HELPERS
    // =========================================================================

    private Mono<Map<String, Integer>> revertirInterno(Map<String, Integer> aplicados, Throwable error) {
        return revertir(aplicados)
                .doOnError(reversionError -> log.error(
                        "[Stock] No se pudo revertir el ajuste parcial", reversionError))
                .onErrorResume(reversionError -> Mono.empty())
                .then(Mono.error(error));
    }

    /** Invierte el signo de cada delta para deshacer un ajuste. */
    private Map<String, Integer> negar(Map<String, Integer> mapa) {
        Map<String, Integer> invertido = new LinkedHashMap<>();
        mapa.forEach((productoId, delta) -> invertido.put(productoId, -delta));
        return invertido;
    }

    /**
     * Ordena por identificador para que dos lotes concurrentes sobre los mismos
     * productos apliquen siempre sus ajustes en el mismo orden.
     */
    private java.util.List<Map.Entry<String, Integer>> ordenEstable(Map<String, Integer> mapa) {
        return mapa.entrySet().stream()
                .sorted(Comparator.comparing(Map.Entry::getKey))
                .toList();
    }

    private Mono<Producto> obtener(String productId) {
        return mongoTemplate.findById(productId, Producto.class)
                .switchIfEmpty(Mono.error(new RuntimeException(
                        "Producto no encontrado con ID: " + productId)));
    }

    /**
     * El filtro del descuento no coincidió: o el producto no existe, o está inactivo,
     * o ya no quedan unidades suficientes. Se reconsulta solo para redactar un mensaje útil.
     */
    private Mono<Producto> explicarFallo(String productId, int cantidad) {
        return obtener(productId).flatMap(producto -> {
            if (!Boolean.TRUE.equals(producto.getActive())) {
                return Mono.error(new IllegalStateException(
                        "El producto '" + producto.getName() + "' está inactivo."));
            }
            return Mono.error(new IllegalStateException(
                    "Stock insuficiente para '" + producto.getName() + "'. Disponible: "
                            + producto.getCurrentStock() + ", solicitado: " + cantidad));
        });
    }
}
