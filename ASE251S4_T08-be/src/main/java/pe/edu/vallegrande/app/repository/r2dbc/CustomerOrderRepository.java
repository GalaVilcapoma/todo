package pe.edu.vallegrande.app.repository.r2dbc;

import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.r2dbc.repository.R2dbcRepository;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import pe.edu.vallegrande.app.model.CustomerOrder;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Repository
public interface CustomerOrderRepository extends R2dbcRepository<CustomerOrder, Long> {

    @Query("SELECT * FROM customer_orders_s4 WHERE active = 1 ORDER BY created_at DESC")
    Flux<CustomerOrder> findAllActive();

    @Query("SELECT * FROM customer_orders_s4 WHERE customer_id = @P0 AND active = 1 ORDER BY created_at DESC")
    Flux<CustomerOrder> findByCustomerId(@Param("customerId") String customerId);

    @Query("SELECT * FROM customer_orders_s4 WHERE order_number = @P0")
    Mono<CustomerOrder> findByOrderNumber(@Param("orderNumber") String orderNumber);

    @Query("SELECT COUNT(*) FROM customer_orders_s4 WHERE CAST(order_date AS DATE) = CAST(GETDATE() AS DATE)")
    Mono<Long> countByOrderDateToday();
}
