package pe.edu.vallegrande.app.model;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Table("product_stock_movements")
public class ProductStockMovement {

    @Id
    private Long id;

    @Column("movement_number")
    private String movementNumber;

    /** MongoDB product id */
    @Column("product_id")
    private String productId;

    /** Product name (denormalized) */
    @Column("product_name")
    private String productName;

    /** IN = entrada de stock | OUT = salida de stock */
    @Column("movement_type")
    private String movementType;

    @Column("quantity")
    private Integer quantity;

    /** Unit measure (denormalized from product) */
    @Column("unit_measure")
    private String unitMeasure;

    /** Unit cost/value applied in the movement */
    @Column("unit_cost")
    private BigDecimal unitCost;

    /** total = quantity * unitCost */
    @Column("total_value")
    private BigDecimal totalValue;

    @Column("movement_date")
    private LocalDate movementDate;

    /** Reason of the movement (purchase, sale, return, adjustment...) */
    @Column("reason")
    private String reason;

    /** Warehouse or responsible area */
    @Column("warehouse")
    private String warehouse;

    @Column("responsible")
    private String responsible;

    @Column("remarks")
    private String remarks;

    @Column("active")
    private Boolean active;

    @Column("created_at")
    private LocalDateTime createdAt;

    @Column("updated_at")
    private LocalDateTime updatedAt;

    public enum MovementType {
        IN, OUT
    }
}