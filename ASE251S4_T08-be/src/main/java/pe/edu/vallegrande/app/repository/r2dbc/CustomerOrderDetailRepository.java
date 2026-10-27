package pe.edu.vallegrande.app.repository.r2dbc;

import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import org.springframework.stereotype.Repository;
import pe.edu.vallegrande.app.model.CustomerOrderDetail;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Repository
public interface CustomerOrderDetailRepository extends ReactiveCrudRepository<CustomerOrderDetail, Long> {

    /** Todos los detalles de un pedido por su order_id */
    Flux<CustomerOrderDetail> findByOrderId(Long orderId);

    /** Eliminar todos los detalles de un pedido (para re-crear al editar) */
    Mono<Void> deleteByOrderId(Long orderId);
}

