package pe.edu.vallegrande.app.repository.r2dbc;

import org.springframework.data.r2dbc.repository.Modifying;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import pe.edu.vallegrande.app.model.AgrochemicalApplicationDetail;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

public interface AgrochemicalApplicationDetailRepository extends ReactiveCrudRepository<AgrochemicalApplicationDetail, Long> {
    
    @Query("SELECT * FROM agrochemical_application_details WHERE application_id = @P0")
    Flux<AgrochemicalApplicationDetail> findByApplicationId(@Param("applicationId") Long applicationId);
    
    @Modifying
    @Query("DELETE FROM agrochemical_application_details WHERE application_id = @P0")
    Mono<Void> deleteByApplicationId(@Param("applicationId") Long applicationId);
}
