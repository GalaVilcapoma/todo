package pe.edu.vallegrande.app.rest;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import pe.edu.vallegrande.app.dto.ProductStockMovementRequest;
import pe.edu.vallegrande.app.dto.ProductStockMovementResponse;
import pe.edu.vallegrande.app.service.ProductStockMovementService;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@RestController
@RequestMapping("/v1/api/stock-movements")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
@Tag(name = "Movimientos de Stock API",
     description = "Transaccional: movimientos de inventario de productos (SQL Server) + " +
                   "actualización de stock del maestro products (MongoDB).")
public class ProductStockMovementRest {

    private final ProductStockMovementService movementService;

    @PostMapping(value = "/in", consumes = MediaType.APPLICATION_JSON_VALUE,
                 produces = MediaType.APPLICATION_JSON_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(
        summary = "Registrar entrada de stock (IN)",
        description = """
            Registra un movimiento de entrada de stock y lo suma al stock actual del producto en MongoDB.
            
            Body de ejemplo:
            {
              "productId": "<ObjectId producto>",
              "quantity": 20,
              "movementDate": "2026-09-24",
              "reason": "PURCHASE",
              "warehouse": "Almacén Central",
              "responsible": "Ana Torres",
              "remarks": "Compra a proveedor"
            }
            """
    )
    public Mono<ProductStockMovementResponse> entradaStock(@RequestBody ProductStockMovementRequest request) {
        return movementService.entradaStock(request);
    }

    @PostMapping(value = "/out", consumes = MediaType.APPLICATION_JSON_VALUE,
                 produces = MediaType.APPLICATION_JSON_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(
        summary = "Registrar salida de stock (OUT)",
        description = """
            Registra un movimiento de salida de stock y lo resta del stock actual del producto en MongoDB.
            Valida stock disponible antes de descontar.
            
            Body de ejemplo:
            {
              "productId": "<ObjectId producto>",
              "quantity": 5,
              "movementDate": "2026-09-24",
              "reason": "SALE",
              "warehouse": "Almacén Central",
              "responsible": "Ana Torres",
              "remarks": "Venta mostrador"
            }
            """
    )
    public Mono<ProductStockMovementResponse> salidaStock(@RequestBody ProductStockMovementRequest request) {
        return movementService.salidaStock(request);
    }

    @GetMapping(produces = MediaType.APPLICATION_JSON_VALUE)
    @Operation(summary = "Listar todos los movimientos activos",
               description = "Retorna todos los movimientos de stock activos, del más reciente al más antiguo.")
    public Flux<ProductStockMovementResponse> listarTodos() {
        return movementService.listarTodos();
    }

    @GetMapping(value = "/producto/{productId}", produces = MediaType.APPLICATION_JSON_VALUE)
    @Operation(summary = "Listar movimientos de un producto",
               description = "Retorna todos los movimientos de stock de un producto por su ObjectId de MongoDB.")
    public Flux<ProductStockMovementResponse> listarPorProducto(@PathVariable String productId) {
        return movementService.listarPorProducto(productId);
    }

    @GetMapping(value = "/tipo/{movementType}", produces = MediaType.APPLICATION_JSON_VALUE)
    @Operation(summary = "Listar movimientos por tipo",
               description = "Retorna los movimientos de un tipo específico: IN (entrada) u OUT (salida).")
    public Flux<ProductStockMovementResponse> listarPorTipo(@PathVariable String movementType) {
        return movementService.listarPorTipo(movementType);
    }

    @GetMapping(value = "/{id}", produces = MediaType.APPLICATION_JSON_VALUE)
    @Operation(summary = "Obtener movimiento por ID",
               description = "Retorna un movimiento de stock específico por su ID.")
    public Mono<ProductStockMovementResponse> obtenerPorId(@PathVariable Long id) {
        return movementService.obtenerPorId(id);
    }
}