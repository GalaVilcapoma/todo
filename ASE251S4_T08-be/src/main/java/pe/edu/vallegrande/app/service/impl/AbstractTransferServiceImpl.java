package pe.edu.vallegrande.app.service.impl;

import pe.edu.vallegrande.app.dto.ImportResult;
import pe.edu.vallegrande.app.service.TransferService;
import pe.edu.vallegrande.app.util.CsvUtils;
import pe.edu.vallegrande.app.util.ExcelUtils;
import pe.edu.vallegrande.app.util.PdfUtils;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.concurrent.Callable;

/**
 * Base común para importar y exportar entidades maestras.
 *
 * <p>Las subclases sólo describen las columnas y cómo convertir una fila en
 * entidad ({@code fromRow}) o una entidad en fila ({@code toRow}). Aquí vive la
 * orquestación reactiva: parsear el archivo en {@code boundedElastic}, validar
 * fila por fila y guardar en MongoDB reportando los errores sin abortar todo el
 * lote.
 *
 * @param <T> tipo del documento.
 */
public abstract class AbstractTransferServiceImpl<T> implements TransferService<T> {

    /** Fila 1 = cabecera, por eso los datos empiezan en la fila 2. */
    private static final int FIRST_DATA_ROW = 2;

    private static final List<DateTimeFormatter> DATE_FORMATS = List.of(
            DateTimeFormatter.ISO_LOCAL_DATE,
            DateTimeFormatter.ofPattern("dd/MM/yyyy"));

    @Override
    public Mono<ImportResult> importExcel(byte[] content) {
        return parse(() -> ExcelUtils.read(content), "EXCEL");
    }

    @Override
    public Mono<ImportResult> importCsv(byte[] content) {
        return parse(() -> CsvUtils.read(content), "CSV");
    }

    @Override
    public Mono<byte[]> exportExcel(Flux<T> data) {
        return data.map(this::toRowList)
                .collectList()
                .flatMap(rows -> Mono.fromCallable(() -> ExcelUtils.write(entityName(), headers(), rows))
                        .subscribeOn(Schedulers.boundedElastic()));
    }

    @Override
    public Mono<byte[]> exportPdf(Flux<T> data, String title) {
        return data.map(this::toRowList)
                .collectList()
                .flatMap(rows -> Mono.fromCallable(() -> PdfUtils.write(title, entityName(), headers(), rows))
                        .subscribeOn(Schedulers.boundedElastic()));
    }

    private Mono<ImportResult> parse(Callable<List<Map<String, String>>> parser, String format) {
        return Mono.fromCallable(parser)
                .subscribeOn(Schedulers.boundedElastic())
                .flatMap(rows -> process(rows, format));
    }

    private Mono<ImportResult> process(List<Map<String, String>> rows, String format) {
        if (rows.isEmpty()) {
            ImportResult result = newResult(format);
            result.failed(0, "El archivo no contiene filas de datos.");
            return Mono.just(result);
        }
        return Flux.range(0, rows.size())
                .concatMap(index -> importRow(rows.get(index), index + FIRST_DATA_ROW))
                .collectList()
                .map(outcomes -> buildResult(rows.size(), outcomes, format));
    }

    private Mono<RowOutcome> importRow(Map<String, String> row, int rowNumber) {
        T entity;
        try {
            entity = fromRow(row, rowNumber);
        } catch (Exception ex) {
            return Mono.just(RowOutcome.failed(rowNumber, "Fila " + rowNumber + ": " + message(ex)));
        }
        return persist(entity)
                .map(saved -> RowOutcome.success())
                .onErrorResume(ex -> Mono.just(RowOutcome.failed(rowNumber, "Fila " + rowNumber + ": " + message(ex))));
    }

    private ImportResult buildResult(int totalRows, List<RowOutcome> outcomes, String format) {
        ImportResult result = newResult(format);
        result.setTotalRows(totalRows);
        for (RowOutcome outcome : outcomes) {
            if (outcome.imported()) {
                result.imported();
            } else {
                result.failed(outcome.row(), outcome.message());
            }
        }
        result.setSuccess(result.getFailed() == 0);
        return result;
    }

    private ImportResult newResult(String format) {
        ImportResult result = new ImportResult();
        result.setEntity(entityName());
        result.setFormat(format);
        return result;
    }

    private List<String> toRowList(T entity) {
        List<String> values = new ArrayList<>(headers().size());
        for (String header : headers()) {
            values.add(value(entity, header));
        }
        return values;
    }

    // ── Contrato para las subclases ──────────────────────────────────────────

    /** Nombre lógico de la entidad (hoja de Excel, título del PDF). */
    protected abstract String entityName();

    /** Columnas en el mismo orden para Excel, CSV y PDF. */
    protected abstract List<String> headers();

    /** Valor de la entidad para una columna concreta (la cabecera {@code id} se exporta, no se importa). */
    protected abstract String value(T entity, String header);

    /** Construye la entidad desde una fila; lanza {@link IllegalArgumentException} si es inválida. */
    protected abstract T fromRow(Map<String, String> row, int rowNumber);

    /** Guarda la entidad en su repositorio reactivo. */
    protected abstract Mono<T> persist(T entity);

    // ── Helpers de validación/conversión para las subclases ──────────────────

    protected static String required(Map<String, String> row, String key) {
        String value = row.get(key);
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException("El campo '" + key + "' es obligatorio.");
        }
        return value.trim();
    }

    protected static String optional(Map<String, String> row, String key) {
        String value = row.get(key);
        return value == null || value.isBlank() ? null : value.trim();
    }

    protected static LocalDate parseDate(String value, String key) {
        if (value == null || value.isBlank()) {
            return null;
        }
        String clean = value.trim();
        for (DateTimeFormatter format : DATE_FORMATS) {
            try {
                return LocalDate.parse(clean, format);
            } catch (DateTimeParseException ignored) {
                // se prueba el siguiente formato
            }
        }
        throw new IllegalArgumentException("El campo '" + key + "' no es una fecha válida (use yyyy-MM-dd). Valor: " + clean);
    }

    protected static BigDecimal parseDecimal(String value, String key) {
        if (value == null || value.isBlank()) {
            return null;
        }
        try {
            BigDecimal decimal = new BigDecimal(value.trim());
            if (decimal.signum() < 0) {
                throw new IllegalArgumentException("El campo '" + key + "' no puede ser negativo.");
            }
            return decimal;
        } catch (NumberFormatException ex) {
            throw new IllegalArgumentException("El campo '" + key + "' debe ser numérico. Valor: " + value.trim());
        }
    }

    protected static Integer parseInteger(String value, String key, Integer defaultValue) {
        if (value == null || value.isBlank()) {
            return defaultValue;
        }
        try {
            int number = Integer.parseInt(value.trim());
            if (number < 0) {
                throw new IllegalArgumentException("El campo '" + key + "' no puede ser negativo.");
            }
            return number;
        } catch (NumberFormatException ex) {
            throw new IllegalArgumentException("El campo '" + key + "' debe ser un entero. Valor: " + value.trim());
        }
    }

    protected static Boolean parseBoolean(String value, Boolean defaultValue) {
        if (value == null || value.isBlank()) {
            return defaultValue;
        }
        return switch (value.trim().toLowerCase(Locale.ROOT)) {
            case "true", "1", "si", "sí", "yes", "a", "activo", "active" -> Boolean.TRUE;
            case "false", "0", "no", "i", "inactivo", "inactive" -> Boolean.FALSE;
            default -> throw new IllegalArgumentException(
                    "El campo booleano debe ser true/false (o 1/0). Valor: " + value.trim());
        };
    }

    private static String message(Throwable ex) {
        String message = ex.getMessage();
        return message == null || message.isBlank() ? ex.getClass().getSimpleName() : message;
    }

    private record RowOutcome(boolean imported, int row, String message) {
        static RowOutcome success() {
            return new RowOutcome(true, 0, null);
        }

        static RowOutcome failed(int row, String message) {
            return new RowOutcome(false, row, message);
        }
    }

    /** Marca de tiempo usada por varias subclases al crear entidades importadas. */
    protected static LocalDateTime now() {
        return LocalDateTime.now();
    }
}
