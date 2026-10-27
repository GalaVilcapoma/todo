package pe.edu.vallegrande.app.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Output DTO — order detail line.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CustomerOrderDetailResponse {

    private Long id;
    private String productId;
    private String productName;
    private String productUnitMeasure;
    private Integer quantity;
    private BigDecimal unitPrice;
    private BigDecimal subtotal;
    private String remark;
    private LocalDateTime createdAt;
}