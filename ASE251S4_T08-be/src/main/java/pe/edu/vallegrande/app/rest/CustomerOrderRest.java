package pe.edu.vallegrande.app.rest;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import pe.edu.vallegrande.app.dto.CustomerOrderRequest;
import pe.edu.vallegrande.app.dto.CustomerOrderResponse;
import pe.edu.vallegrande.app.service.CustomerOrderService;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@RestController
@RequestMapping("/v1/api/customer-orders")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
@Tag(name = "Customer Orders API",
     description = "Transactional: orders with header (SQL Server) + detail (SQL Server). " +
                   "Masters: customer and products from MongoDB. Reactive with Spring WebFlux.")
public class CustomerOrderRest {

    private final CustomerOrderService customerOrderService;

    // =========================================================================
    // POST /v1/api/customer-orders
    // Create complete order (header + detail) in a single operation
    // =========================================================================
    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE,
                 produces = MediaType.APPLICATION_JSON_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(
        summary = "Create customer order (full transaction)",
        description = """
            Registers header and detail in a single reactive operation.
            - Validates active customer in MongoDB
            - Validates available stock for each product in MongoDB
            - Automatically deducts stock
            - Calculates subtotal, IGV 18% and total
            - Saves header and detail in SQL Server (R2DBC)
            
            Request body example:
            {
              "customerId": "<ObjectId of the customer in MongoDB>",
              "estimatedDeliveryDate": "2026-10-01",
              "remarks": "Urgent delivery",
              "details": [
                { "productId": "<product ObjectId>", "quantity": 2, "remark": "optional" }
              ]
            }
            """
    )
    public Mono<CustomerOrderResponse> createOrder(@RequestBody CustomerOrderRequest request) {
        return customerOrderService.createOrder(request);
    }

    // =========================================================================
    // GET /v1/api/customer-orders
    // List all active orders with their details
    // =========================================================================
    @GetMapping(produces = MediaType.APPLICATION_JSON_VALUE)
    @Operation(
        summary = "List all active orders",
        description = "Returns all active orders with their header and detail lines, " +
                      "ordered from most recent to oldest."
    )
    public Flux<CustomerOrderResponse> listAll() {
        return customerOrderService.listAll();
    }

    // =========================================================================
    // GET /v1/api/customer-orders/{id}
    // Get order by ID
    // =========================================================================
    @GetMapping(value = "/{id}", produces = MediaType.APPLICATION_JSON_VALUE)
    @Operation(
        summary = "Get order by ID",
        description = "Returns the header and complete detail of a specific order."
    )
    public Mono<CustomerOrderResponse> findById(@PathVariable Long id) {
        return customerOrderService.findById(id);
    }

    // =========================================================================
    // GET /v1/api/customer-orders/number/{orderNumber}
    // Find by order number (e.g.: ORD-20260916-001)
    // =========================================================================
    @GetMapping(value = "/number/{orderNumber}", produces = MediaType.APPLICATION_JSON_VALUE)
    @Operation(
        summary = "Find order by number",
        description = "Finds an order by its auto-generated number (format ORD-YYYYMMDD-NNN)."
    )
    public Mono<CustomerOrderResponse> findByOrderNumber(@PathVariable String orderNumber) {
        return customerOrderService.findByOrderNumber(orderNumber);
    }

    // =========================================================================
    // GET /v1/api/customer-orders/customer/{customerId}
    // List orders of a specific customer
    // =========================================================================
    @GetMapping(value = "/customer/{customerId}", produces = MediaType.APPLICATION_JSON_VALUE)
    @Operation(
        summary = "List orders of a customer",
        description = "Returns all active orders of a customer, using its MongoDB ObjectId."
    )
    public Flux<CustomerOrderResponse> listByCustomer(@PathVariable String customerId) {
        return customerOrderService.listByCustomer(customerId);
    }

    // =========================================================================
    // PUT /v1/api/customer-orders/{id}
    // Edit complete order (header + detail)
    // =========================================================================
    @PutMapping(value = "/{id}", consumes = MediaType.APPLICATION_JSON_VALUE,
                produces = MediaType.APPLICATION_JSON_VALUE)
    @Operation(
        summary = "Edit complete order (header + detail)",
        description = """
            Modifies an existing order: updates the header and replaces all details.
            - Returns the stock of the previous products to MongoDB
            - Validates available stock of the new products
            - Automatically deducts the new stock
            - Recalculates subtotal, IGV 18% and total
            - CANCELLED or DELIVERED orders cannot be edited
            
            Request body example:
            {
              "customerId": "<ObjectId of the customer in MongoDB>",
              "estimatedDeliveryDate": "2026-10-15",
              "remarks": "Modified order",
              "details": [
                { "productId": "<product ObjectId>", "quantity": 5, "remark": "optional" }
              ]
            }
            """
    )
    public Mono<CustomerOrderResponse> editOrder(
            @PathVariable Long id,
            @RequestBody CustomerOrderRequest request) {
        return customerOrderService.editOrder(id, request);
    }

    // =========================================================================
    // PUT /v1/api/customer-orders/{id}/status/{newStatus}
    // Update order status
    // =========================================================================
    @PutMapping(value = "/{id}/status/{newStatus}", produces = MediaType.APPLICATION_JSON_VALUE)
    @Operation(
        summary = "Update order status",
        description = "Changes the order status. Valid values: PENDING, CONFIRMED, IN_PROCESS, DELIVERED, CANCELLED."
    )
    public Mono<CustomerOrderResponse> updateStatus(
            @PathVariable Long id,
            @PathVariable String newStatus) {
        return customerOrderService.updateStatus(id, newStatus);
    }

    // =========================================================================
    // PUT /v1/api/customer-orders/{id}/cancel
    // Cancel order and return stock
    // =========================================================================
    @PutMapping(value = "/{id}/cancel", produces = MediaType.APPLICATION_JSON_VALUE)
    @Operation(
        summary = "Cancel order",
        description = "Cancels an order and automatically returns the stock of each product to MongoDB. " +
                      "A DELIVERED order cannot be cancelled."
    )
    public Mono<CustomerOrderResponse> cancelOrder(@PathVariable Long id) {
        return customerOrderService.cancelOrder(id);
    }
}