package pe.edu.vallegrande.app.repository.r2dbc;

import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import org.springframework.stereotype.Repository;
import pe.edu.vallegrande.app.model.AgrochemicalApplication;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Repository
public interface AgrochemicalApplicationRepository extends ReactiveCrudRepository<AgrochemicalApplication, Long> {

    @Query("SELECT * FROM agrochemical_applications WHERE active = 1 ORDER BY created_at DESC")
    Flux<AgrochemicalApplication> findByActiveTrue();

    Mono<AgrochemicalApplication> findByApplicationNumber(String applicationNumber);

    @Query("SELECT COUNT(*) FROM agrochemical_applications WHERE CAST(application_date AS DATE) = CAST(GETDATE() AS DATE)")
    Mono<Long> countByApplicationDateToday();
}
