package pe.edu.vallegrande.app.util;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Filtros opcionales para las exportaciones (rango de fechas sobre createdAt).
 */
public final class ExportFilters {

    private ExportFilters() {
    }

    /**
     * @return {@code true} si la fecha cae dentro del rango indicado. Un límite
     *         {@code null} significa "sin límite" por ese lado.
     */
    public static boolean inRange(LocalDateTime date, LocalDate from, LocalDate to) {
        if (from == null && to == null) {
            return true;
        }
        if (date == null) {
            return false;
        }
        LocalDate value = date.toLocalDate();
        if (from != null && value.isBefore(from)) {
            return false;
        }
        return to == null || !value.isAfter(to);
    }
}
