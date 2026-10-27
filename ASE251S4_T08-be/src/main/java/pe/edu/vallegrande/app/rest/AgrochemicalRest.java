package pe.edu.vallegrande.app.rest;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.codec.multipart.FilePart;
import org.springframework.web.bind.annotation.*;
import pe.edu.vallegrande.app.dto.ImportResult;
import pe.edu.vallegrande.app.model.Agrochemical;
import pe.edu.vallegrande.app.model.Agrochemical.AgrochemicalCategory;
import pe.edu.vallegrande.app.service.AgrochemicalService;
import pe.edu.vallegrande.app.service.AgrochemicalTransferService;
import pe.edu.vallegrande.app.util.ExportFilters;
import pe.edu.vallegrande.app.util.FilePartUtils;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.LocalDate;
import java.util.Map;
import java.util.Objects;

@RestController
@RequestMapping("/v1/api/agrochemicals")
@CrossOrigin(origins = "*")
@Tag(name = "Agrochemicals API", description = "Agrochemical catalog endpoints - Reactive WebFlux")
public class AgrochemicalRest {

    private static final String EXCEL_TYPE = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    private static final MediaType EXCEL_MEDIA_TYPE = MediaType.parseMediaType(EXCEL_TYPE);

    @Autowired
    private AgrochemicalService service;

    @Autowired
    private AgrochemicalTransferService transferService;

    // ✅ Listar todos (GET) - FLUX
    @GetMapping(produces = MediaType.APPLICATION_JSON_VALUE)
    @Operation(summary = "Listar todos los agroquímicos", description = "Retorna todos los agroquímicos (activos e inactivos)")
    public Flux<Agrochemical> findAll() {
        return service.findAll();
    }

    // ✅ Listar por Estado - Activos (GET) - FLUX
    @GetMapping(value = "/active", produces = MediaType.APPLICATION_JSON_VALUE)
    @Operation(summary = "Listar agroquímicos activos", description = "Retorna solo los agroquímicos con estado activo")
    public Flux<Agrochemical> findAllActive() {
        return service.findAllActive();
    }

    // ✅ Listar por Estado - Inactivos (GET) - FLUX
    @GetMapping(value = "/inactive", produces = MediaType.APPLICATION_JSON_VALUE)
    @Operation(summary = "Listar agroquímicos inactivos", description = "Retorna solo los agroquímicos con estado inactivo")
    public Flux<Agrochemical> findAllInactive() {
        return service.findAllInactive();
    }

    // ✅ Listar por ID (GET) - MONO
    @GetMapping(value = "/{id}", produces = MediaType.APPLICATION_JSON_VALUE)
    @Operation(summary = "Obtener agroquímico por ID", description = "Retorna un agroquímico específico por su ID")
    public Mono<Agrochemical> findById(@PathVariable String id) {
        return service.findById(id)
                .switchIfEmpty(Mono.error(new RuntimeException("Agrochemical not found")));
    }

    // ✅ Crear (POST) - MONO
    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Crear agroquímico", description = "Crea un nuevo agroquímico en el sistema")
    public Mono<Agrochemical> create(@RequestBody Agrochemical agrochemical) {
        return service.create(agrochemical);
    }

    // ✅ Editar (PUT) - MONO
    @PutMapping(value = "/{id}", consumes = MediaType.APPLICATION_JSON_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
    @Operation(summary = "Actualizar agroquímico", description = "Actualiza los datos de un agroquímico existente")
    public Mono<Agrochemical> update(@PathVariable String id, @RequestBody Agrochemical agrochemical) {
        return service.update(id, agrochemical);
    }

    // ✅ Eliminar lógico (PATCH) - MONO
    @PatchMapping(value = "/{id}/delete", produces = MediaType.APPLICATION_JSON_VALUE)
    @Operation(summary = "Eliminación lógica (desactivar)", description = "Desactiva un agroquímico sin eliminarlo físicamente")
    public Mono<Map<String, Object>> delete(@PathVariable String id) {
        return service.delete(id)
                .map(deleted -> {
                    Map<String, Object> response = new java.util.HashMap<>();
                    response.put("message", "Agrochemical deactivated successfully");
                    response.put("id", deleted.getId());
                    response.put("active", deleted.getActive());
                    response.put("deletedAt", String.valueOf(deleted.getDeletedAt()));
                    return response;
                });
    }

    // ✅ Restaurar lógico (PATCH) - MONO
    @PatchMapping(value = "/{id}/restore", produces = MediaType.APPLICATION_JSON_VALUE)
    @Operation(summary = "Restaurar agroquímico", description = "Reactiva un agroquímico previamente desactivado")
    public Mono<Map<String, Object>> restore(@PathVariable String id) {
        return service.restore(id)
                .map(restored -> {
                    Map<String, Object> response = new java.util.HashMap<>();
                    response.put("message", "Agrochemical restored successfully");
                    response.put("id", restored.getId());
                    response.put("active", restored.getActive());
                    response.put("restoredAt", String.valueOf(restored.getRestoredAt()));
                    return response;
                });
    }

    // ── Importación masiva (Excel / CSV) ──────────────────────────────────────

    @PostMapping(value = "/import/excel", consumes = MediaType.MULTIPART_FORM_DATA_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
    @Operation(summary = "Importar agroquímicos desde Excel (.xlsx)",
            description = "Carga masiva desde un archivo .xlsx con cabecera (commercialName, activeIngredient, category, ...). "
                    + "Devuelve el total de filas, importadas y el detalle de errores.")
    public Mono<ImportResult> importExcel(@RequestPart("file") FilePart file) {
        return FilePartUtils.readBytes(file).flatMap(transferService::importExcel);
    }

    @PostMapping(value = "/import/csv", consumes = MediaType.MULTIPART_FORM_DATA_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
    @Operation(summary = "Importar agroquímicos desde CSV",
            description = "Carga masiva desde un archivo CSV con cabecera. Devuelve el resumen de la importación y los errores por fila.")
    public Mono<ImportResult> importCsv(@RequestPart("file") FilePart file) {
        return FilePartUtils.readBytes(file).flatMap(transferService::importCsv);
    }

    // ── Exportación (Excel / PDF) ────────────────────────────────────────────

    @GetMapping(value = "/export/excel", produces = EXCEL_TYPE)
    @Operation(summary = "Exportar agroquímicos a Excel (.xlsx)",
            description = "Filtros opcionales: active, category, from y to (fecha de creación ISO yyyy-MM-dd).")
    public Mono<ResponseEntity<byte[]>> exportExcel(
            @RequestParam(required = false) Boolean active,
            @RequestParam(required = false) AgrochemicalCategory category,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return transferService.exportExcel(filtered(active, category, from, to))
                .map(body -> attachment(body, "agrochemicals.xlsx", EXCEL_MEDIA_TYPE));
    }

    @GetMapping(value = "/export/pdf", produces = MediaType.APPLICATION_PDF_VALUE)
    @Operation(summary = "Exportar agroquímicos a PDF",
            description = "Reporte tabular con cabecera. Filtros opcionales: active, category, from y to.")
    public Mono<ResponseEntity<byte[]>> exportPdf(
            @RequestParam(required = false) Boolean active,
            @RequestParam(required = false) AgrochemicalCategory category,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return transferService.exportPdf(filtered(active, category, from, to), "Reporte de Agroquímicos")
                .map(body -> attachment(body, "agrochemicals.pdf", MediaType.APPLICATION_PDF));
    }

    private Flux<Agrochemical> filtered(Boolean active, AgrochemicalCategory category, LocalDate from, LocalDate to) {
        return service.findAll()
                .filter(a -> active == null || Objects.equals(a.getActive(), active))
                .filter(a -> category == null || a.getCategory() == category)
                .filter(a -> ExportFilters.inRange(a.getCreatedAt(), from, to));
    }

    private ResponseEntity<byte[]> attachment(byte[] body, String filename, MediaType type) {
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentType(type)
                .body(body);
    }
}
