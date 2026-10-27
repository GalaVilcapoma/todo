package pe.edu.vallegrande.app.repository.r2dbc;

import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.r2dbc.repository.R2dbcRepository;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import pe.edu.vallegrande.app.model.ProductStockMovement;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Repository
public interface ProductStockMovementRepository extends R2dbcRepository<ProductStockMovement, Long> {

    @Query("SELECT * FROM product_stock_movements WHERE active = 1 ORDER BY created_at DESC")
    Flux<ProductStockMovement> findAllActive();

    @Query("SELECT * FROM product_stock_movements WHERE product_id = @P0 AND active = 1 ORDER BY movement_date DESC, created_at DESC")
    Flux<ProductStockMovement> findByProductId(@Param("productId") String productId);

    @Query("SELECT * FROM product_stock_movements WHERE movement_type = @P0 AND active = 1 ORDER BY movement_date DESC, created_at DESC")
    Flux<ProductStockMovement> findByMovementType(@Param("movementType") String movementType);

    @Query("SELECT * FROM product_stock_movements WHERE movement_number = @P0")
    Mono<ProductStockMovement> findByMovementNumber(@Param("movementNumber") String movementNumber);

    @Query("SELECT COUNT(*) FROM product_stock_movements WHERE CAST(movement_date AS DATE) = CAST(GETDATE() AS DATE)")
    Mono<Long> countByMovementDateToday();
}
