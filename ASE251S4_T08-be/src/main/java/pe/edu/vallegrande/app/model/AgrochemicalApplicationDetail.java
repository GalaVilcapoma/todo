package pe.edu.vallegrande.app.model;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Table("agrochemical_application_details")
public class AgrochemicalApplicationDetail {

    @Id
    private Long id;

    @Column("application_id")
    private Long applicationId;

    @Column("agrochemical_id")
    private String agrochemicalId;

    @Column("agrochemical_name")
    private String agrochemicalName;

    @Column("category")
    private String category;

    @Column("applied_dose")
    private BigDecimal appliedDose;

    @Column("unit_measure")
    private String unitMeasure;

    @Column("treated_area_hectares")
    private BigDecimal treatedAreaHectares;

    @Column("unit_cost")
    private BigDecimal unitCost;

    @Column("total_cost")
    private BigDecimal totalCost;

    @Column("remark")
    private String remark;

    @Column("created_at")
    private LocalDateTime createdAt;
}