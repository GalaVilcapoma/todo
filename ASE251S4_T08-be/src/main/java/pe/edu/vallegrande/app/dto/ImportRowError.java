package pe.edu.vallegrande.app.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

/**
 * Detalle de una fila que no pudo importarse.
 */
@Data
@AllArgsConstructor
public class ImportRowError {

    /** Número de fila dentro del archivo (1 = cabecera, los datos empiezan en 2). */
    private int row;

    private String message;
}
