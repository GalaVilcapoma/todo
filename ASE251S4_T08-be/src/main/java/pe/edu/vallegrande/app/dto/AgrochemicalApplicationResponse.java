package pe.edu.vallegrande.app.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class AgrochemicalApplicationResponse {
    private Long id;
    private String applicationNumber;
    private String fieldName;
    private BigDecimal areaHectares;
    private LocalDate applicationDate;
    private String responsible;
    private BigDecimal temperatureCelsius;
    private BigDecimal humidityPercentage;
    private String windConditions;
    private String status;
    private String remarks;
    private Integer totalProducts;
    private BigDecimal totalCost;
    private LocalDateTime createdAt;
    private List<AgrochemicalApplicationDetailResponse> details;
}