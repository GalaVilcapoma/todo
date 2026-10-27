package pe.edu.vallegrande.app.dto;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class AgrochemicalApplicationDetailResponse {
    private Long id;
    private String agrochemicalId;
    private String agrochemicalName;
    private String category;
    private BigDecimal appliedDose;
    private String unitMeasure;
    private BigDecimal treatedAreaHectares;
    private BigDecimal unitCost;
    private BigDecimal totalCost;
    private String remark;
}