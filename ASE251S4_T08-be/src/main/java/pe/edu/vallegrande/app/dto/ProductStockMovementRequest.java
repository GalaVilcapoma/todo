package pe.edu.vallegrande.app.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Input DTO — product stock movement (IN / OUT).
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProductStockMovementRequest {

    /** MongoDB product ObjectId */
    private String productId;

    /** IN = entrada de stock | OUT = salida de stock */
    private String movementType;

    /** Cantidad movida (debe ser > 0) */
    private Integer quantity;

    /** Fecha del movimiento (opcional, por defecto hoy) */
    private LocalDate movementDate;

    /** Motivo: purchase, sale, return, adjustment... */
    private String reason;

    /** Almacén o área responsable */
    private String warehouse;

    /** Responsable del movimiento */
    private String responsible;

    /** Observaciones generales */
    private String remarks;
}