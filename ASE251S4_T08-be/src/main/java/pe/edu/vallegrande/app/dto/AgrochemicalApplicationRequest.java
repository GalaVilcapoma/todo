package pe.edu.vallegrande.app.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Data
public class AgrochemicalApplicationRequest {
    private String fieldName;
    private BigDecimal areaHectares;
    private LocalDate applicationDate;
    private String responsible;
    private BigDecimal temperatureCelsius;
    private BigDecimal humidityPercentage;
    private String windConditions;
    private String remarks;
    private List<AgrochemicalApplicationDetailRequest> details;
}