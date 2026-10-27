package pe.edu.vallegrande.app.service.impl;

import pe.edu.vallegrande.app.model.Customer;
import pe.edu.vallegrande.app.repository.mongo.CustomerRepository;
import pe.edu.vallegrande.app.service.CustomerService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import lombok.extern.slf4j.Slf4j;

import java.time.LocalDateTime;

@Slf4j
@Service
public class CustomerServiceImpl implements CustomerService {

    private final CustomerRepository customerRepository;

    @Autowired
    public CustomerServiceImpl(CustomerRepository customerRepository) {
        this.customerRepository = customerRepository;
    }

    @Override
    public Flux<Customer> findAll() {
        log.info("Listando todos los clientes");
        return customerRepository.findAll();
    }

    @Override
    public Flux<Customer> findByState(String state) {
        log.info("Listando clientes por estado: {}", state);
        return customerRepository.findByState(state);
    }

    @Override
    public Mono<Customer> findById(String id) {
        log.info("Buscando cliente por ID: {}", id);
        return customerRepository.findById(id);
    }

    @Override
    public Mono<Customer> save(Customer customer) {
        log.info("Registrando nuevo cliente: {}", customer.getBusinessName());
        customer.setState("A");
        customer.setCreatedAt(LocalDateTime.now());
        return customerRepository.save(customer);
    }

    @Override
    public Mono<Customer> update(String id, Customer customer) {
        log.info("Actualizando cliente con ID: {}", id);
        return customerRepository.findById(id)
                .flatMap(existing -> {
                    existing.setCode(customer.getCode());
                    existing.setBusinessName(customer.getBusinessName());
                    existing.setRuc(customer.getRuc());
                    existing.setDocumentType(customer.getDocumentType());
                    existing.setDocumentNumber(customer.getDocumentNumber());
                    existing.setCountry(customer.getCountry());
                    existing.setCity(customer.getCity());
                    existing.setAddress(customer.getAddress());
                    existing.setPhone(customer.getPhone());
                    existing.setEmail(customer.getEmail());
                    existing.setPrimaryContact(customer.getPrimaryContact());
                    existing.setCustomerType(customer.getCustomerType());
                    existing.setUpdatedAt(LocalDateTime.now());
                    return customerRepository.save(existing);
                });
    }

    @Override
    public Mono<Customer> delete(String id) {
        log.info("Eliminando lógicamente cliente con ID: {}", id);
        return customerRepository.findById(id)
                .flatMap(existing -> {
                    existing.setState("I");
                    existing.setDeletedAt(LocalDateTime.now());
                    existing.setRestoredAt(null);
                    return customerRepository.save(existing);
                });
    }

    @Override
    public Mono<Customer> restore(String id) {
        log.info("Restaurando cliente con ID: {}", id);
        return customerRepository.findById(id)
                .flatMap(existing -> {
                    existing.setState("A");
                    existing.setRestoredAt(LocalDateTime.now());
                    existing.setDeletedAt(null);
                    return customerRepository.save(existing);
                });
    }

}
