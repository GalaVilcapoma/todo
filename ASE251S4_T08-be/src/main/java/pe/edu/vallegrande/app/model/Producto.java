package pe.edu.vallegrande.app.model;

import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Document(collection = "products")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@SuppressWarnings({"null", "unused"})
public class Producto {

    @Id
    private String id;

    private String code;

    private String name;

    @Indexed(name = "idx_products_category")
    private String category;

    private String description;

    private String unitMeasure;

    private BigDecimal unitPrice;

    @Builder.Default
    private Integer currentStock = 0;

    @Builder.Default
    private Integer minimumStock = 0;

    private String origin;

    @Indexed(name = "idx_products_active")
    @Builder.Default
    private Boolean active = true;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime deletedAt;
    private LocalDateTime restoredAt;

}
