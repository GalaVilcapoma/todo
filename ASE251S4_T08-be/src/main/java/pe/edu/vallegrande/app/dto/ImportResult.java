package pe.edu.vallegrande.app.dto;

import lombok.Data;

import java.util.ArrayList;
import java.util.List;

/**
 * Resultado de una importación masiva (Excel o CSV).
 *
 * <p>Informa cuántas filas se leyeron, cuántas se guardaron y el detalle de
 * las que fallaron, para que el cliente pueda corregir el archivo y reintentar.
 */
@Data
public class ImportResult {

    private String entity;
    private String format;
    private int totalRows;
    private int imported;
    private int failed;
    private boolean success;
    private List<ImportRowError> errors = new ArrayList<>();

    public void imported() {
        this.imported++;
    }

    public void failed(int row, String message) {
        this.failed++;
        this.errors.add(new ImportRowError(row, message));
    }
}
