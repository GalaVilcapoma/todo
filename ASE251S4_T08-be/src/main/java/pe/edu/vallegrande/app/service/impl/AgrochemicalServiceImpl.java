package pe.edu.vallegrande.app.service.impl;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import pe.edu.vallegrande.app.model.Agrochemical;
import pe.edu.vallegrande.app.repository.mongo.AgrochemicalRepository;
import pe.edu.vallegrande.app.service.AgrochemicalService;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import java.time.LocalDateTime;

@Service
public class AgrochemicalServiceImpl implements AgrochemicalService {

    @Autowired
    private AgrochemicalRepository agrochemicalRepository;

    @Override
    public Flux<Agrochemical> findAll() {
        return agrochemicalRepository.findAll();
    }

    @Override
    public Flux<Agrochemical> findAllActive() {
        return agrochemicalRepository.findByActiveTrue();
    }

    @Override
    public Flux<Agrochemical> findAllInactive() {
        return agrochemicalRepository.findByActiveFalse();
    }

    @Override
    public Mono<Agrochemical> findById(String id) {
        return agrochemicalRepository.findById(id);
    }

    @Override
    public Mono<Agrochemical> create(Agrochemical agrochemical) {
        agrochemical.setId(null);
        agrochemical.setActive(true);
        agrochemical.setCreatedAt(LocalDateTime.now());
        agrochemical.setDeletedAt(null);
        agrochemical.setRestoredAt(null);
        return agrochemicalRepository.save(agrochemical);
    }

    @Override
    public Mono<Agrochemical> update(String id, Agrochemical incoming) {
        return agrochemicalRepository.findById(id)
                .flatMap(existing -> {
                    existing.setCommercialName(incoming.getCommercialName());
                    existing.setActiveIngredient(incoming.getActiveIngredient());
                    existing.setCategory(incoming.getCategory());
                    existing.setSenasaRegistrationNumber(incoming.getSenasaRegistrationNumber());
                    existing.setRegistrationExpiry(incoming.getRegistrationExpiry());
                    existing.setMaxDose(incoming.getMaxDose());
                    existing.setWaitingPeriodDays(incoming.getWaitingPeriodDays());
                    existing.setManufacturer(incoming.getManufacturer());
                    existing.setUpdatedAt(LocalDateTime.now());
                    return agrochemicalRepository.save(existing);
                })
                .switchIfEmpty(Mono.error(new RuntimeException("Agrochemical not found: " + id)));
    }

    @Override
    public Mono<Agrochemical> delete(String id) {
        return agrochemicalRepository.findById(id)
                .flatMap(agrochemical -> {
                    if (!agrochemical.getActive()) {
                        return Mono.error(new RuntimeException("Agrochemical already inactive: " + id));
                    }
                    agrochemical.setActive(false);
                    agrochemical.setDeletedAt(LocalDateTime.now());
                    return agrochemicalRepository.save(agrochemical);
                })
                .switchIfEmpty(Mono.error(new RuntimeException("Agrochemical not found: " + id)));
    }

    @Override
    public Mono<Agrochemical> restore(String id) {
        return agrochemicalRepository.findById(id)
                .flatMap(agrochemical -> {
                    if (agrochemical.getActive()) {
                        return Mono.error(new RuntimeException("Agrochemical already active: " + id));
                    }
                    agrochemical.setActive(true);
                    agrochemical.setRestoredAt(LocalDateTime.now());
                    agrochemical.setDeletedAt(null);
                    return agrochemicalRepository.save(agrochemical);
                })
                .switchIfEmpty(Mono.error(new RuntimeException("Agrochemical not found: " + id)));
    }
}
