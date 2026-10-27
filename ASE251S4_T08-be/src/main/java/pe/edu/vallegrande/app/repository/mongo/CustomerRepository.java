package pe.edu.vallegrande.app.repository.mongo;

import pe.edu.vallegrande.app.model.Customer;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import org.springframework.data.mongodb.repository.ReactiveMongoRepository;

public interface CustomerRepository extends ReactiveMongoRepository<Customer, String> {

    Flux<Customer> findByState(String state);

}
