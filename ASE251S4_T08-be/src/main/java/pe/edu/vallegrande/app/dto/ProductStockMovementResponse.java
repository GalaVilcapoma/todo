package pe.edu.vallegrande.app.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import pe.edu.vallegrande.app.model.ProductStockMovement.MovementType;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Output DTO — product stock movement (IN / OUT).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductStockMovementResponse {

    private Long id;
    private String movementNumber;

    // Product data (from MongoDB)
    private String productId;
    private String productName;
    private String unitMeasure;

    // Movement data
    private MovementType movementType;
    private Integer quantity;
    private BigDecimal unitCost;
    private BigDecimal totalValue;
    private LocalDate movementDate;
    private String reason;
    private String warehouse;
    private String responsible;
    private String remarks;

    // Audit
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Boolean active;
}