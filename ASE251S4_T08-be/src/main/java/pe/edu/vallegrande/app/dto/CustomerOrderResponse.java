package pe.edu.vallegrande.app.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import pe.edu.vallegrande.app.model.CustomerOrder.OrderStatus;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Output DTO — complete order header with its detail lines.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CustomerOrderResponse {

    private Long id;
    private String orderNumber;

    // Customer data (from MongoDB)
    private String customerId;
    private String customerBusinessName;

    // Dates and status
    private LocalDate orderDate;
    private LocalDate estimatedDeliveryDate;
    private OrderStatus status;
    private String remarks;

    // Calculated totals
    private BigDecimal subtotal;
    private BigDecimal taxAmount;
    private BigDecimal total;

    // Audit
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Boolean active;

    // Order lines
    private List<CustomerOrderDetailResponse> details;
}