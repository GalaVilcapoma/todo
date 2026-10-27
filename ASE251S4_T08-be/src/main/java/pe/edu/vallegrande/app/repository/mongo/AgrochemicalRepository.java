package pe.edu.vallegrande.app.repository.mongo;

import org.springframework.data.mongodb.repository.ReactiveMongoRepository;
import org.springframework.stereotype.Repository;
import pe.edu.vallegrande.app.model.Agrochemical;
import pe.edu.vallegrande.app.model.Agrochemical.AgrochemicalCategory;
import reactor.core.publisher.Flux;
import java.time.LocalDate;

@Repository
public interface AgrochemicalRepository extends ReactiveMongoRepository<Agrochemical, String> {

    Flux<Agrochemical> findByActiveTrue();

    Flux<Agrochemical> findByActiveFalse();

    Flux<Agrochemical> findByCategoryAndActiveTrue(AgrochemicalCategory category);

    Flux<Agrochemical> findByActiveTrueAndRegistrationExpiryBefore(LocalDate date);
}
