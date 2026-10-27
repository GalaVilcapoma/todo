package pe.edu.vallegrande.app.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Input DTO — order detail line.
 * The frontend only sends: productId, quantity and optional remark.
 * Price and subtotal are calculated on the backend from MongoDB.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CustomerOrderDetailRequest {

    /** MongoDB product ObjectId */
    private String productId;

    /** Quantity to order (must be > 0) */
    private Integer quantity;

    /** Optional line remark */
    private String remark;
}