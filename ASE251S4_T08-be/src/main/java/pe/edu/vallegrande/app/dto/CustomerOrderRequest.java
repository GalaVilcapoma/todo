package pe.edu.vallegrande.app.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

/**
 * Input DTO — order header + detail in a single request.
 *
 * Auto-calculated fields on the backend (NOT sent from the frontend):
 *   - orderNumber, orderDate, subtotal, taxAmount, total
 *   - unitPrice and subtotal of each detail
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CustomerOrderRequest {

    /** MongoDB customer ObjectId */
    private String customerId;

    /** Estimated delivery date (optional) */
    private LocalDate estimatedDeliveryDate;

    /** General order remarks */
    private String remarks;

    /** Products to order (at least 1 item) */
    private List<CustomerOrderDetailRequest> details;
}