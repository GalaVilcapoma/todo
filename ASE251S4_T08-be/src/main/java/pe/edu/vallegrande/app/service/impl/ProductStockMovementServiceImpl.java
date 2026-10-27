package pe.edu.vallegrande.app.service.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.edu.vallegrande.app.dto.ProductStockMovementRequest;
import pe.edu.vallegrande.app.dto.ProductStockMovementResponse;
import pe.edu.vallegrande.app.model.ProductStockMovement;
import pe.edu.vallegrande.app.model.Producto;
import pe.edu.vallegrande.app.repository.mongo.ProductoRepository;
import pe.edu.vallegrande.app.repository.r2dbc.ProductStockMovementRepository;
import pe.edu.vallegrande.app.service.ProductStockMovementService;
import pe.edu.vallegrande.app.service.ProductoStockService;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@Slf4j
@Service
@RequiredArgsConstructor
public class ProductStockMovementServiceImpl implements ProductStockMovementService {

    private final ProductStockMovementRepository movementRepository;
    private final ProductoRepository productoRepository;
    private final ProductoStockService stockService;

    @Override
    public Flux<ProductStockMovementResponse> listarTodos() {
        return movementRepository.findAllActive()
                .map(this::toResponse);
    }

    @Override
    public Flux<ProductStockMovementResponse> listarPorProducto(String productId) {
        return movementRepository.findByProductId(productId)
                .map(this::toResponse);
    }

    @Override
    public Flux<ProductStockMovementResponse> listarPorTipo(String movementType) {
        return movementRepository.findByMovementType(movementType)
                .map(this::toResponse);
    }

    @Override
    public Mono<ProductStockMovementResponse> obtenerPorId(Long id) {
        return movementRepository.findById(id)
                .switchIfEmpty(Mono.error(new RuntimeException("Movimiento no encontrado con ID: " + id)))
                .map(this::toResponse);
    }

    @Override
    @Transactional
    public Mono<ProductStockMovementResponse> entradaStock(ProductStockMovementRequest request) {
        return registrarMovimiento(request, ProductStockMovement.MovementType.IN);
    }

    @Override
    @Transactional
    public Mono<ProductStockMovementResponse> salidaStock(ProductStockMovementRequest request) {
        return registrarMovimiento(request, ProductStockMovement.MovementType.OUT);
    }

    // =========================================================================
    // HELPERS PRIVADOS
    // =========================================================================

    private Mono<ProductStockMovementResponse> registrarMovimiento(ProductStockMovementRequest request,
                                                                    ProductStockMovement.MovementType type) {
        // Validar cantidad
        if (request.getQuantity() == null || request.getQuantity() <= 0) {
            return Mono.error(new IllegalArgumentException("La cantidad debe ser mayor a 0."));
        }
        if (request.getProductId() == null || request.getProductId().isBlank()) {
            return Mono.error(new IllegalArgumentException("El movimiento debe referenciar un productId."));
        }

        return productoRepository.findById(request.getProductId())
                .switchIfEmpty(Mono.error(new RuntimeException(
                        "Producto no encontrado con ID: " + request.getProductId())))
                .flatMap(producto -> {
                    if (!Boolean.TRUE.equals(producto.getActive())) {
                        return Mono.error(new IllegalStateException(
                                "El producto '" + producto.getName() + "' está inactivo."));
                    }
                    if (producto.getUnitPrice() == null) {
                        return Mono.error(new IllegalStateException(
                                "El producto '" + producto.getName() + "' no tiene precio registrado."));
                    }

                    boolean esSalida = type == ProductStockMovement.MovementType.OUT;
                    int delta = esSalida ? -request.getQuantity() : request.getQuantity();

                    // La salida descuenta con un $inc condicional: el filtro sobre
                    // currentStock se evalúa dentro de la misma operación, así que dos
                    // salidas concurrentes no pueden dejar el inventario en negativo.
                    Mono<Void> ajustarStock = esSalida
                            ? stockService.descontar(producto.getId(), request.getQuantity()).then()
                            : stockService.ajustar(producto.getId(), delta).then();

                    // La compensación se aplica solo a partir del punto en que el stock
                    // ya fue movido. Si el ajuste previo falla (por ejemplo, stock
                    // insuficiente), no hay nada que revertir y hacerlo volvería a sumar
                    // unidades que nunca se descontaron.
                    return ajustarStock
                            .then(generarNumeroMovimiento())
                            .flatMap(numero -> movementRepository.save(construirMovimiento(
                                    request, producto, type, numero))
                                    // Si el movimiento SQL no se registra, el stock ya
                                    // ajustado se revierte para que el inventario no
                                    // quede sin respaldo.
                                    .onErrorResume(error -> revertirStock(producto, delta, error)))
                            .map(this::toResponse)
                            .doOnSuccess(res -> log.info("Movimiento {} registrado: {}, producto='{}', cantidad={}",
                                    res.getMovementType(), res.getMovementNumber(),
                                    res.getProductName(), res.getQuantity()));
                });
    }

    /**
     * Deshace el ajuste de stock ya aplicado y propaga el error original. Un fallo al
     * revertir se registra, pero no sustituye al error que explica el problema real.
     */
    private <T> Mono<T> revertirStock(Producto producto, int deltaAplicado, Throwable error) {
        log.warn("Revirtiendo ajuste de {} unidades del producto {} tras fallo al registrar el movimiento",
                deltaAplicado, producto.getId());
        return stockService.ajustar(producto.getId(), -deltaAplicado)
                .doOnError(reversionError -> log.error(
                        "No se pudo revertir el stock del producto {}", producto.getId(), reversionError))
                .onErrorResume(reversionError -> Mono.empty())
                .then(Mono.error(error));
    }

    private ProductStockMovement construirMovimiento(ProductStockMovementRequest request,
                                                     Producto producto,
                                                     ProductStockMovement.MovementType type,
                                                     String numero) {
        ProductStockMovement movement = new ProductStockMovement();
        movement.setMovementNumber(numero);
        movement.setProductId(producto.getId());
        movement.setProductName(producto.getName());
        movement.setMovementType(type.name());
        movement.setQuantity(request.getQuantity());
        movement.setUnitMeasure(producto.getUnitMeasure());
        movement.setUnitCost(producto.getUnitPrice());
        movement.setTotalValue(producto.getUnitPrice()
                .multiply(BigDecimal.valueOf(request.getQuantity())));
        movement.setMovementDate(request.getMovementDate() != null
                ? request.getMovementDate() : LocalDate.now());
        movement.setReason(request.getReason());
        movement.setWarehouse(request.getWarehouse());
        movement.setResponsible(request.getResponsible());
        movement.setRemarks(request.getRemarks());
        movement.setActive(true);
        movement.setCreatedAt(LocalDateTime.now());
        movement.setUpdatedAt(LocalDateTime.now());
        return movement;
    }

    private Mono<String> generarNumeroMovimiento() {
        String fecha = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        return movementRepository.countByMovementDateToday()
                .map(count -> String.format("MOV-%s-%03d", fecha, count + 1));
    }

    private ProductStockMovementResponse toResponse(ProductStockMovement m) {
        return ProductStockMovementResponse.builder()
                .id(m.getId())
                .movementNumber(m.getMovementNumber())
                .productId(m.getProductId())
                .productName(m.getProductName())
                .unitMeasure(m.getUnitMeasure())
                .movementType(ProductStockMovement.MovementType.valueOf(m.getMovementType()))
                .quantity(m.getQuantity())
                .unitCost(m.getUnitCost())
                .totalValue(m.getTotalValue())
                .movementDate(m.getMovementDate())
                .reason(m.getReason())
                .warehouse(m.getWarehouse())
                .responsible(m.getResponsible())
                .remarks(m.getRemarks())
                .createdAt(m.getCreatedAt())
                .updatedAt(m.getUpdatedAt())
                .active(m.getActive())
                .build();
    }
}
