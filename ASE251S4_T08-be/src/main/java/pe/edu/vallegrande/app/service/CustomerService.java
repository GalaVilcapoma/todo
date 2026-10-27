package pe.edu.vallegrande.app.service;

import pe.edu.vallegrande.app.model.Customer;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

public interface CustomerService {

    // Listar todos
    Flux<Customer> findAll();

    // Listar por estado (A o I)
    Flux<Customer> findByState(String state);

    // Listar por ID
    Mono<Customer> findById(String id);

    // Crear
    Mono<Customer> save(Customer customer);

    // Editar
    Mono<Customer> update(String id, Customer customer);

    // Eliminar lógico (state = "I")
    Mono<Customer> delete(String id);

    // Restaurar lógico (state = "A")
    Mono<Customer> restore(String id);

}
