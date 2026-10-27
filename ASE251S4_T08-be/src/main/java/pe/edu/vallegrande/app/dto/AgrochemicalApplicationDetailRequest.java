package pe.edu.vallegrande.app.dto;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class AgrochemicalApplicationDetailRequest {
    private String agrochemicalId;
    private BigDecimal appliedDose;
    private String unitMeasure;
    private BigDecimal treatedAreaHectares;
    private String remark;
}