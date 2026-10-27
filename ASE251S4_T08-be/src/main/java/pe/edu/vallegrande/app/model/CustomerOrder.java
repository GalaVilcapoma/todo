package pe.edu.vallegrande.app.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Order header — SQL Server table: customer_orders_s4
 * Linked to Customer (MongoDB) and CustomerOrderDetail (SQL Server)
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table("customer_orders_s4")
public class CustomerOrder {

    @Id
    private Long id;

    @Column("order_number")
    private String orderNumber;

    /** MongoDB customer id */
    @Column("customer_id")
    private String customerId;

    /**
     * Customer business name (denormalized to avoid cross-DB joins).
     * La columna se llama customer_name en el esquema SQL; el nombre de la propiedad
     * sigue siendo customerBusinessName porque es lo que consume la API.
     */
    @Column("customer_name")
    private String customerBusinessName;

    @Column("order_date")
    private LocalDate orderDate;

    @Column("estimated_delivery_date")
    private LocalDate estimatedDeliveryDate;

    @Column("status")
    private String status;

    @Column("remarks")
    private String remarks;

    @Column("subtotal")
    private BigDecimal subtotal;

    /** IGV 18%. La columna se llama igv en el esquema SQL. */
    @Column("igv")
    private BigDecimal taxAmount;

    @Column("total")
    private BigDecimal total;

    @Column("active")
    private Boolean active;

    @Column("created_at")
    private LocalDateTime createdAt;

    @Column("updated_at")
    private LocalDateTime updatedAt;

    public enum OrderStatus {
        PENDING, CONFIRMED, IN_PROCESS, DELIVERED, CANCELLED
    }
}