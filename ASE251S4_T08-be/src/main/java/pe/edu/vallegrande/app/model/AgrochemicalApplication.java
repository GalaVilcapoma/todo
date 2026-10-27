package pe.edu.vallegrande.app.model;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Table("agrochemical_applications")
public class AgrochemicalApplication {

    @Id
    private Long id;

    @Column("application_number")
    private String applicationNumber;

    @Column("field_name")
    private String fieldName;

    @Column("area_hectares")
    private BigDecimal areaHectares;

    @Column("application_date")
    private LocalDate applicationDate;

    @Column("responsible")
    private String responsible;

    @Column("temperature_celsius")
    private BigDecimal temperatureCelsius;

    @Column("humidity_percentage")
    private BigDecimal humidityPercentage;

    @Column("wind_conditions")
    private String windConditions;

    @Column("status")
    private String status; // SCHEDULED, IN_PROCESS, COMPLETED, CANCELLED

    @Column("remarks")
    private String remarks;

    @Column("total_products")
    private Integer totalProducts;

    @Column("total_cost")
    private BigDecimal totalCost;

    @Column("active")
    private Boolean active;

    @Column("created_at")
    private LocalDateTime createdAt;

    @Column("updated_at")
    private LocalDateTime updatedAt;

    public enum ApplicationStatus {
        SCHEDULED, IN_PROCESS, COMPLETED, CANCELLED
    }
}