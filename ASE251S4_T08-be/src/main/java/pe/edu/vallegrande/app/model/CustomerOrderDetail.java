package pe.edu.vallegrande.app.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Order detail line — SQL Server table: customer_order_details_s4
 * Linked to CustomerOrder (header) and Producto (MongoDB)
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table("customer_order_details_s4")
public class CustomerOrderDetail {

    @Id
    private Long id;

    /** FK → customer_orders_s4.id */
    @Column("order_id")
    private Long orderId;

    /** MongoDB product id */
    @Column("product_id")
    private String productId;

    /** Product name (denormalized to avoid cross-DB joins) */
    @Column("product_name")
    private String productName;

    /** Product unit measure (denormalized) */
    /** La columna se llama product_unit en el esquema SQL. */
    @Column("product_unit")
    private String productUnitMeasure;

    @Column("quantity")
    private Integer quantity;

    /** Unit price at order time (taken from MongoDB product) */
    @Column("unit_price")
    private BigDecimal unitPrice;

    /** subtotal = quantity * unitPrice */
    @Column("subtotal")
    private BigDecimal subtotal;

    @Column("remark")
    private String remark;

    @Column("created_at")
    private LocalDateTime createdAt;
}