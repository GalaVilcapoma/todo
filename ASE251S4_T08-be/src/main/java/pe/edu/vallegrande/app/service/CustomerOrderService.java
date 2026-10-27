package pe.edu.vallegrande.app.service;

import pe.edu.vallegrande.app.dto.CustomerOrderRequest;
import pe.edu.vallegrande.app.dto.CustomerOrderResponse;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

public interface CustomerOrderService {

    /** Create complete order: header + detail in one reactive operation */
    Mono<CustomerOrderResponse> createOrder(CustomerOrderRequest request);

    /** List all active orders */
    Flux<CustomerOrderResponse> listAll();

    /** Get order by ID (header + details) */
    Mono<CustomerOrderResponse> findById(Long id);

    /** Find order by order number */
    Mono<CustomerOrderResponse> findByOrderNumber(String orderNumber);

    /** List orders of a specific customer */
    Flux<CustomerOrderResponse> listByCustomer(String customerId);

    /** Update order status */
    Mono<CustomerOrderResponse> updateStatus(Long id, String newStatus);

    /** Edit complete order: header + detail */
    Mono<CustomerOrderResponse> editOrder(Long id, CustomerOrderRequest request);

    /** Cancel order and return stock to MongoDB */
    Mono<CustomerOrderResponse> cancelOrder(Long id);
}