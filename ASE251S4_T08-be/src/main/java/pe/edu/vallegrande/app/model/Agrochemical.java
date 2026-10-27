package pe.edu.vallegrande.app.model;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;
import org.springframework.data.mongodb.core.mapping.Document;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Document(collection = "agrochemicals")
@CompoundIndexes({
        @CompoundIndex(name = "idx_agrochemicals_category_active", def = "{'category': 1, 'active': 1}"),
        @CompoundIndex(name = "idx_agrochemicals_active_expiry", def = "{'active': 1, 'registrationExpiry': 1}"),
        @CompoundIndex(name = "idx_agrochemicals_active_manufacturer", def = "{'active': 1, 'manufacturer': 1}")
})
public class Agrochemical {

    @Id
    private String id;

    private String commercialName;
    private String activeIngredient;
    private AgrochemicalCategory category;
    private String senasaRegistrationNumber;
    private LocalDate registrationExpiry;
    private BigDecimal maxDose;
    private Integer waitingPeriodDays = 0;
    private String manufacturer;
    private Boolean active = true;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime deletedAt;
    private LocalDateTime restoredAt;

    public enum AgrochemicalCategory {
        INSECTICIDE, FUNGICIDE, HERBICIDE, FERTILIZER, BIOSTIMULANT, OTHER
    }
}