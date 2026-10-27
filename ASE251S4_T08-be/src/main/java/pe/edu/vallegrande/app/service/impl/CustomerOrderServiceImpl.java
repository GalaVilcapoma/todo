package pe.edu.vallegrande.app.service.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.edu.vallegrande.app.dto.*;
import pe.edu.vallegrande.app.model.Customer;
import pe.edu.vallegrande.app.model.CustomerOrder;
import pe.edu.vallegrande.app.model.CustomerOrderDetail;
import pe.edu.vallegrande.app.model.CustomerOrder.OrderStatus;
import pe.edu.vallegrande.app.model.Producto;
import pe.edu.vallegrande.app.repository.r2dbc.CustomerOrderRepository;
import pe.edu.vallegrande.app.repository.mongo.CustomerRepository;
import pe.edu.vallegrande.app.repository.mongo.ProductoRepository;
import pe.edu.vallegrande.app.repository.r2dbc.CustomerOrderDetailRepository;
import pe.edu.vallegrande.app.service.CustomerOrderService;
import pe.edu.vallegrande.app.service.ProductoStockService;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Gestión de pedidos sobre SQL Server (R2DBC) con inventario en MongoDB.
 *
 * <p>{@code @Transactional} cubre únicamente SQL Server: una transacción R2DBC no puede
 * incluir una escritura en MongoDB. Por eso el stock se ajusta con operaciones atómicas
 * de un solo documento ({@link ProductoStockService}) y, si la parte SQL Server falla
 * después, el descuento se revierte explícitamente antes de propagar el error.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class CustomerOrderServiceImpl implements CustomerOrderService {

    private static final BigDecimal TAX_RATE = new BigDecimal("0.18");

    // R2DBC repositories (SQL Server)
    private final CustomerOrderRepository       orderRepository;
    private final CustomerOrderDetailRepository detailRepository;

    // MongoDB repositories (masters)
    private final CustomerRepository  customerRepository;
    private final ProductoRepository  productoRepository;

    // Ajustes atómicos de inventario (MongoDB)
    private final ProductoStockService stockService;

    // =========================================================================
    // CREATE ORDER — Full transaction header + detail
    // Flow: validar cliente (MongoDB) → resolver líneas (MongoDB) →
    //       descontar stock (MongoDB, atómico y compensable) →
    //       crear cabecera + detalle (SQL Server, transaccional)
    // =========================================================================
    @Override
    @Transactional
    public Mono<CustomerOrderResponse> createOrder(CustomerOrderRequest request) {
        log.info("[CustomerOrder] Creating order for customerId={}", request.getCustomerId());

        if (isVacio(request.getDetails())) {
            return Mono.error(sinDetalles());
        }

        return buscarClienteActivo(request.getCustomerId())
                .flatMap(customer -> resolverLineas(request.getDetails())
                        .flatMap(lineas -> {
                            BigDecimal subtotal = lineas.subtotal();
                            BigDecimal tax = subtotal.multiply(TAX_RATE).setScale(2, RoundingMode.HALF_UP);
                            BigDecimal total = subtotal.add(tax).setScale(2, RoundingMode.HALF_UP);

                            return stockService.descontarLote(lineas.cantidadPorProducto())
                                    .flatMap(descuentoAplicado -> generateOrderNumber()
                                            .flatMap(orderNumber -> {
                                                CustomerOrder order = CustomerOrder.builder()
                                                        .orderNumber(orderNumber)
                                                        .customerId(customer.getId())
                                                        .customerBusinessName(customer.getBusinessName())
                                                        .orderDate(LocalDate.now())
                                                        .estimatedDeliveryDate(request.getEstimatedDeliveryDate())
                                                        .status(OrderStatus.CONFIRMED.name())
                                                        .remarks(request.getRemarks())
                                                        .subtotal(subtotal)
                                                        .taxAmount(tax)
                                                        .total(total)
                                                        .active(true)
                                                        .createdAt(LocalDateTime.now())
                                                        .build();

                                                return persistirPedido(order, lineas.detalles());
                                            })
                                            .doOnSuccess(res -> log.info("[CustomerOrder] Order created: {}, total={}",
                                                    res.getOrderNumber(), res.getTotal()))
                                            .onErrorResume(error -> compensar(descuentoAplicado, error,
                                                    "creación de pedido " + lineas.cantidadPorProducto().size()
                                                            + " línea(s)")));
                        }));
    }

    // =========================================================================
    // LIST ALL active orders with their details
    // =========================================================================
    @Override
    public Flux<CustomerOrderResponse> listAll() {
        return orderRepository.findAllActive()
                .flatMap(this::loadDetails);
    }

    // =========================================================================
    // FIND BY ID
    // =========================================================================
    @Override
    public Mono<CustomerOrderResponse> findById(Long id) {
        return orderRepository.findById(id)
                .switchIfEmpty(Mono.<CustomerOrder>error(pedidoNoEncontrado(id)))
                .flatMap(this::loadDetails);
    }

    // =========================================================================
    // FIND BY ORDER NUMBER
    // =========================================================================
    @Override
    public Mono<CustomerOrderResponse> findByOrderNumber(String orderNumber) {
        return orderRepository.findByOrderNumber(orderNumber)
                .switchIfEmpty(Mono.error(new RuntimeException("Order not found: " + orderNumber)))
                .flatMap(this::loadDetails);
    }
    // =========================================================================
    // LIST BY CUSTOMER
    // =========================================================================
    @Override
    public Flux<CustomerOrderResponse> listByCustomer(String customerId) {
        return orderRepository.findByCustomerId(customerId)
                .flatMap(this::loadDetails);
    }

    // =========================================================================
    // UPDATE STATUS
    // =========================================================================
    @Override
    @Transactional
    public Mono<CustomerOrderResponse> updateStatus(Long id, String newStatus) {
        return orderRepository.findById(id)
                .switchIfEmpty(Mono.<CustomerOrder>error(pedidoNoEncontrado(id)))
                .flatMap(order -> {
                    OrderStatus status;
                    try {
                        status = OrderStatus.valueOf(newStatus);
                    } catch (IllegalArgumentException e) {
                        return Mono.<CustomerOrderResponse>error(new IllegalArgumentException(
                                "Invalid status: " + newStatus +
                                ". Valid values: PENDING, CONFIRMED, IN_PROCESS, DELIVERED, CANCELLED"));
                    }

                    // Cancelar por cambio de estado debe devolver el stock igual que
                    // cancelOrder; de lo contrario el inventario queda descuadrado.
                    if (status == OrderStatus.CANCELLED) {
                        return cancelar(order);
                    }

                    order.setStatus(status.name());
                    order.setUpdatedAt(LocalDateTime.now());
                    return orderRepository.save(order)
                            .flatMap(this::loadDetails);
                });
    }

    // =========================================================================
    // CANCEL ORDER — returns stock to MongoDB
    // =========================================================================
    @Override
    @Transactional
    public Mono<CustomerOrderResponse> cancelOrder(Long id) {
        return orderRepository.findById(id)
                .switchIfEmpty(Mono.<CustomerOrder>error(pedidoNoEncontrado(id)))
                .flatMap(this::cancelar);
    }

    // =========================================================================
    // EDIT ORDER — Updates header + replaces complete details
    // Flow: calcular el delta de stock por producto (MongoDB) →
    //       descontar lo que aumenta y devolver lo que disminuye (MongoDB, atómico) →
    //       reemplazar detalle y recalcular cabecera (SQL Server, transaccional)
    // =========================================================================
    @Override
    @Transactional
    public Mono<CustomerOrderResponse> editOrder(Long id, CustomerOrderRequest request) {
        log.info("[CustomerOrder] Editing order id={}", id);

        if (isVacio(request.getDetails())) {
            return Mono.error(sinDetalles());
        }

        return orderRepository.findById(id)
                .switchIfEmpty(Mono.<CustomerOrder>error(pedidoNoEncontrado(id)))
                .flatMap(order -> {
                    if (OrderStatus.CANCELLED.name().equals(order.getStatus())) {
                        return Mono.error(new IllegalStateException("Cannot edit a cancelled order."));
                    }
                    if (OrderStatus.DELIVERED.name().equals(order.getStatus())) {
                        return Mono.error(new IllegalStateException("Cannot edit a delivered order."));
                    }

                    return quantityPorProductoDeDetalle(detailRepository.findByOrderId(order.getId()))
                            .flatMap(cantidadPrevia -> resolverLineas(request.getDetails())
                                    .flatMap(lineas -> {
                                        Map<String, Integer> aDescontar = new LinkedHashMap<>();
                                        Map<String, Integer> aDevolver = new LinkedHashMap<>();
                                        calcularDelta(cantidadPrevia, lineas.cantidadPorProducto(),
                                                aDescontar, aDevolver);

                                        // El descuento va primero porque valida existencias
                                        // en la propia operación; si falla, no hay nada que
                                        // revertir todavía.
                                        return stockService.descontarLote(aDescontar)
                                                .flatMap(descontado -> stockService.ajustarLote(aDevolver)
                                                        .flatMap(devuelto -> {
                                                            BigDecimal subtotal = lineas.subtotal();
                                                            BigDecimal tax = subtotal.multiply(TAX_RATE)
                                                                    .setScale(2, RoundingMode.HALF_UP);
                                                            BigDecimal total = subtotal.add(tax)
                                                                    .setScale(2, RoundingMode.HALF_UP);

                                                            return reemplazarDetalle(order, lineas.detalles(),
                                                                    subtotal, tax, total, request)
                                                                    .doOnSuccess(res -> log.info(
                                                                            "[CustomerOrder] Order edited: {}, new total={}",
                                                                            res.getOrderNumber(), res.getTotal()))
                                                                    .onErrorResume(error ->
                                                                            compensar(combinar(descontado, devuelto),
                                                                                    error,
                                                                                    "edición de pedido " + id));
                                                        }));
                                    }));
                });
    }

    // =========================================================================
    // PRIVATE HELPERS
    // =========================================================================

    /**
     * Cancela un pedido ya cargado: devuelve el stock de sus líneas y marca la cabecera.
     * El orden es stock primero y SQL después; si SQL falla, el stock se revierte.
     */
    private Mono<CustomerOrderResponse> cancelar(CustomerOrder order) {
        if (OrderStatus.CANCELLED.name().equals(order.getStatus())) {
            return Mono.error(new IllegalStateException("The order is already cancelled."));
        }
        if (OrderStatus.DELIVERED.name().equals(order.getStatus())) {
            return Mono.error(new IllegalStateException("Cannot cancel a delivered order."));
        }

        return quantityPorProductoDeDetalle(detailRepository.findByOrderId(order.getId()))
                .flatMap(cantidades -> stockService.ajustarLote(cantidades)
                        .flatMap(devuelto -> {
                            order.setStatus(OrderStatus.CANCELLED.name());
                            order.setUpdatedAt(LocalDateTime.now());
                            return orderRepository.save(order)
                                    .flatMap(saved -> {
                                        log.info("[CustomerOrder] Order cancelled: {}, {} producto(s) repuestos",
                                                saved.getOrderNumber(), devuelto.size());
                                        return loadDetails(saved);
                                    })
                                    .onErrorResume(error ->
                                            compensar(devuelto, error, "cancelación de pedido " + order.getId()));
                        }));
    }

    /**
     * Resuelve y valida las líneas solicitadas contra el catálogo, sin tocar el stock.
     *
     * <p>Las líneas repetidas del mismo producto se suman para el descuento: validarlas
     * por separado permitía pedir 3 + 3 unidades de un producto con 5 en stock, y el
     * descuento concurrente aplicaba dos veces el mismo valor leído.
     */
    private Mono<LineasResueltas> resolverLineas(List<CustomerOrderDetailRequest> detalleRequests) {
        Map<String, Integer> idsUnicos = new LinkedHashMap<>();
        for (CustomerOrderDetailRequest detalleReq : detalleRequests) {
            if (detalleReq.getProductId() == null || detalleReq.getProductId().isBlank()) {
                return Mono.error(new IllegalArgumentException("Every detail line must reference a productId."));
            }
            if (detalleReq.getQuantity() == null || detalleReq.getQuantity() <= 0) {
                return Mono.error(new IllegalArgumentException(
                        "The quantity for product '" + detalleReq.getProductId() + "' must be greater than 0."));
            }
            idsUnicos.merge(detalleReq.getProductId(), 1, Integer::sum);
        }

        return Flux.fromIterable(idsUnicoKeys(detalleRequests))
                .concatMap(productId -> productoRepository.findById(productId)
                        .switchIfEmpty(Mono.error(new RuntimeException(
                                "Product not found with ID: " + productId))))
                .collectMap(Producto::getId, producto -> producto)
                .flatMap(catalogo -> {
                    Map<String, Integer> cantidadPorProducto = new LinkedHashMap<>();
                    List<CustomerOrderDetail> detalles = new java.util.ArrayList<>();

                    for (CustomerOrderDetailRequest detalleReq : detalleRequests) {
                        Producto producto = catalogo.get(detalleReq.getProductId());
                        if (!Boolean.TRUE.equals(producto.getActive())) {
                            return Mono.error(new IllegalStateException(
                                    "The product '" + producto.getName() + "' is inactive."));
                        }
                        cantidadPorProducto.merge(producto.getId(), detalleReq.getQuantity(), Integer::sum);

                        BigDecimal precio = producto.getUnitPrice();
                        if (precio == null) {
                            return Mono.error(new IllegalStateException(
                                    "The product '" + producto.getName() + "' has no registered price."));
                        }
                        detalles.add(CustomerOrderDetail.builder()
                                .productId(producto.getId())
                                .productName(producto.getName())
                                .productUnitMeasure(producto.getUnitMeasure())
                                .quantity(detalleReq.getQuantity())
                                .unitPrice(precio)
                                .subtotal(precio.multiply(BigDecimal.valueOf(detalleReq.getQuantity()))
                                        .setScale(2, RoundingMode.HALF_UP))
                                .remark(detalleReq.getRemark())
                                .createdAt(LocalDateTime.now())
                                .build());
                    }

                    return Mono.just(new LineasResueltas(detalles, cantidadPorProducto));
                });
    }

    /** Guarda cabecera y detalle en SQL Server; ambos dentro de la transacción activa. */
    private Mono<CustomerOrderResponse> persistirPedido(CustomerOrder order,
                                                         List<CustomerOrderDetail> detalles) {
        return orderRepository.save(order)
                .flatMap(savedOrder -> {
                    List<CustomerOrderDetail> detallesConId = detalles.stream()
                            .map(detalle -> {
                                detalle.setOrderId(savedOrder.getId());
                                return detalle;
                            })
                            .toList();
                    return detailRepository.saveAll(detallesConId)
                            .collectList()
                            .map(savedDetails -> toResponse(savedOrder, savedDetails));
                });
    }

    /** Reemplaza el detalle de un pedido y recalcula la cabecera. */
    private Mono<CustomerOrderResponse> reemplazarDetalle(CustomerOrder order,
                                                          List<CustomerOrderDetail> nuevosDetalles,
                                                          BigDecimal subtotal,
                                                          BigDecimal tax,
                                                          BigDecimal total,
                                                          CustomerOrderRequest request) {
        // resolverLineas deja orderId sin asignar porque el id de cabecera todavía no
        // existe al validar; insertar sin él viola el NOT NULL de la tabla de detalle.
        List<CustomerOrderDetail> detallesConId = nuevosDetalles.stream()
                .map(detalle -> {
                    detalle.setOrderId(order.getId());
                    return detalle;
                })
                .toList();

        return detailRepository.deleteByOrderId(order.getId())
                .thenMany(detailRepository.saveAll(detallesConId))
                .collectList()
                .flatMap(savedDetails -> {
                    order.setEstimatedDeliveryDate(request.getEstimatedDeliveryDate());
                    order.setRemarks(request.getRemarks());
                    order.setSubtotal(subtotal);
                    order.setTaxAmount(tax);
                    order.setTotal(total);
                    order.setUpdatedAt(LocalDateTime.now());

                    // Update customer if changed
                    if (request.getCustomerId() != null
                            && !request.getCustomerId().equals(order.getCustomerId())) {
                        return customerRepository.findById(request.getCustomerId())
                                .switchIfEmpty(Mono.error(new RuntimeException(
                                        "Customer not found with ID: " + request.getCustomerId())))
                                .flatMap(customer -> {
                                    order.setCustomerId(customer.getId());
                                    order.setCustomerBusinessName(customer.getBusinessName());
                                    return orderRepository.save(order);
                                })
                                .map(savedOrder -> toResponse(savedOrder, savedDetails));
                    }

                    return orderRepository.save(order)
                            .map(savedOrder -> toResponse(savedOrder, savedDetails));
                });
    }

    /**
     * Revierte los ajustes de stock aplicados y propaga el error original, que es el
     * que explica el fallo. Un error al compensar se registra pero no reemplaza al
     * original, para no ocultar la causa real.
     */
    private <T> Mono<T> compensar(Map<String, Integer> ajusteAplicado, Throwable error, String contexto) {
        if (ajusteAplicado.isEmpty()) {
            return Mono.error(error);
        }
        log.warn("[CustomerOrder] Revirtiendo {} ajuste(s) de stock tras fallo en {}",
                ajusteAplicado.size(), contexto);
        return stockService.revertir(ajusteAplicado)
                .doOnError(reversionError -> log.error(
                        "[CustomerOrder] No se pudo revertir el stock tras fallo en {}: {}",
                        contexto, reversionError.getMessage()))
                .onErrorResume(reversionError -> Mono.empty())
                .then(Mono.error(error));
    }

    /** Une dos mapas de ajustes; un producto no puede aparecer en ambos. */
    private Map<String, Integer> combinar(Map<String, Integer> descuento, Map<String, Integer> devolucion) {
        Map<String, Integer> combinado = new LinkedHashMap<>(descuento);
        devolucion.forEach(combinado::put);
        return combinado;
    }

    /**
     * Calcula el saldo de stock por producto entre los detalles previos y los nuevos.
     * Solo se toca lo que realmente cambia: un producto cuya cantidad se mantiene
     * conserva su stock intacto durante la edición.
     */
    private void calcularDelta(Map<String, Integer> cantidadPrevia,
                               Map<String, Integer> cantidadNueva,
                               Map<String, Integer> aDescontar,
                               Map<String, Integer> aDevolver) {
        Map<String, Integer> productos = new LinkedHashMap<>(cantidadPrevia);
        productos.putAll(cantidadNueva);

        productos.forEach((productoId, cantidadNuevaTotal) -> {
            int previa = cantidadPrevia.getOrDefault(productoId, 0);
            int nueva = cantidadNueva.getOrDefault(productoId, 0);
            int delta = nueva - previa;
            if (delta > 0) {
                // El pedido pide más de lo que ya tenía descontado: hay que restar.
                aDescontar.put(productoId, delta);
            } else if (delta < 0) {
                // El pedido pide menos: el excedente descontado vuelve al inventario.
                aDevolver.put(productoId, -delta);
            }
        });
    }

    /** Identificadores de producto distintos, conservando el orden de aparición. */
    private List<String> idsUnicoKeys(List<CustomerOrderDetailRequest> detalleRequests) {
        return detalleRequests.stream()
                .map(CustomerOrderDetailRequest::getProductId)
                .distinct()
                .toList();
    }

    private Mono<Map<String, Integer>> quantityPorProductoDeDetalle(Flux<CustomerOrderDetail> detalles) {
        return detalles.collectList()
                .map(lista -> {
                    Map<String, Integer> cantidades = new LinkedHashMap<>();
                    lista.forEach(detalle ->
                            cantidades.merge(detalle.getProductId(), detalle.getQuantity(), Integer::sum));
                    return cantidades;
                });
    }

    private Mono<Customer> buscarClienteActivo(String customerId) {
        if (customerId == null || customerId.isBlank()) {
            return Mono.error(new IllegalArgumentException("The order must reference a customerId."));
        }
        return customerRepository.findById(customerId)
                .switchIfEmpty(Mono.error(new RuntimeException(
                        "Customer not found with ID: " + customerId)))
                .flatMap(customer -> {
                    boolean isActive = Boolean.TRUE.equals(customer.getActive())
                            || "A".equals(customer.getState());
                    if (!isActive) {
                        return Mono.error(new IllegalStateException(
                                "The customer '" + customer.getBusinessName() + "' is inactive."));
                    }
                    return Mono.just(customer);
                });
    }

    private boolean isVacio(List<CustomerOrderDetailRequest> detalles) {
        return detalles == null || detalles.isEmpty();
    }

    private IllegalArgumentException sinDetalles() {
        return new IllegalArgumentException("The order must have at least one product in the detail.");
    }

    private RuntimeException pedidoNoEncontrado(Long id) {
        return new RuntimeException("Order not found with ID: " + id);
    }

    /**
     * Loads the details of an order and builds the complete CustomerOrderResponse.
     */
    private Mono<CustomerOrderResponse> loadDetails(CustomerOrder order) {
        return detailRepository.findByOrderId(order.getId())
                .collectList()
                .map(details -> toResponse(order, details));
    }

    /**
     * Generates order number with format ORD-YYYYMMDD-NNN
     * Example: ORD-20260916-001
     */
    private Mono<String> generateOrderNumber() {
        String date = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        return orderRepository.countByOrderDateToday()
                .map(count -> String.format("ORD-%s-%03d", date, count + 1));
    }

    /**
     * Maps CustomerOrder + detail list → CustomerOrderResponse
     */
    private CustomerOrderResponse toResponse(CustomerOrder order, List<CustomerOrderDetail> details) {
        List<CustomerOrderDetailResponse> detailResponses = details.stream()
                .map(d -> CustomerOrderDetailResponse.builder()
                        .id(d.getId())
                        .productId(d.getProductId())
                        .productName(d.getProductName())
                        .productUnitMeasure(d.getProductUnitMeasure())
                        .quantity(d.getQuantity())
                        .unitPrice(d.getUnitPrice())
                        .subtotal(d.getSubtotal())
                        .remark(d.getRemark())
                        .createdAt(d.getCreatedAt())
                        .build())
                .toList();

        return CustomerOrderResponse.builder()
                .id(order.getId())
                .orderNumber(order.getOrderNumber())
                .customerId(order.getCustomerId())
                .customerBusinessName(order.getCustomerBusinessName())
                .orderDate(order.getOrderDate())
                .estimatedDeliveryDate(order.getEstimatedDeliveryDate())
                .status(OrderStatus.valueOf(order.getStatus()))
                .remarks(order.getRemarks())
                .subtotal(order.getSubtotal())
                .taxAmount(order.getTaxAmount())
                .total(order.getTotal())
                .createdAt(order.getCreatedAt())
                .updatedAt(order.getUpdatedAt())
                .active(order.getActive())
                .details(detailResponses)
                .build();
    }

    /**
     * Detalles ya validados contra el catálogo, con las cantidades agregadas por producto
     * que son las que deben descontarse del inventario.
     */
    private record LineasResueltas(List<CustomerOrderDetail> detalles,
                                   Map<String, Integer> cantidadPorProducto) {

        BigDecimal subtotal() {
            return detalles.stream()
                    .map(CustomerOrderDetail::getSubtotal)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
        }
    }
}
