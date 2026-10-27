package pe.edu.vallegrande.app.service;

import pe.edu.vallegrande.app.model.Agrochemical;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

public interface AgrochemicalService {
    Flux<Agrochemical> findAll();
    Flux<Agrochemical> findAllActive();
    Flux<Agrochemical> findAllInactive();
    Mono<Agrochemical> findById(String id);
    Mono<Agrochemical> create(Agrochemical agrochemical);
    Mono<Agrochemical> update(String id, Agrochemical agrochemical);
    Mono<Agrochemical> delete(String id);
    Mono<Agrochemical> restore(String id);
}
