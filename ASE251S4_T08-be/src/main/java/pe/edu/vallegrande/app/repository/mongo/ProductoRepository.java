package pe.edu.vallegrande.app.repository.mongo;

import pe.edu.vallegrande.app.model.Producto;
import org.springframework.data.mongodb.repository.ReactiveMongoRepository;
import reactor.core.publisher.Flux;

public interface ProductoRepository extends ReactiveMongoRepository<Producto, String> {

    Flux<Producto> findByActive(Boolean active);

}
