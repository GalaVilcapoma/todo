package pe.edu.vallegrande.app.service;

import pe.edu.vallegrande.app.dto.ProductStockMovementRequest;
import pe.edu.vallegrande.app.dto.ProductStockMovementResponse;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

public interface ProductStockMovementService {

    /** Movimiento de entrada de stock (IN) */
    Mono<ProductStockMovementResponse> entradaStock(ProductStockMovementRequest request);

    /** Movimiento de salida de stock (OUT) */
    Mono<ProductStockMovementResponse> salidaStock(ProductStockMovementRequest request);

    /** Listar todos los movimientos activos */
    Flux<ProductStockMovementResponse> listarTodos();

    /** Listar movimientos por producto (MongoDB id) */
    Flux<ProductStockMovementResponse> listarPorProducto(String productId);

    /** Listar movimientos por tipo (IN / OUT) */
    Flux<ProductStockMovementResponse> listarPorTipo(String movementType);

    /** Obtener movimiento por ID */
    Mono<ProductStockMovementResponse> obtenerPorId(Long id);
}