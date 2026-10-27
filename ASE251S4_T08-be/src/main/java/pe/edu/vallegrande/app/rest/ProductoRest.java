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
import pe.edu.vallegrande.app.model.Producto;
import pe.edu.vallegrande.app.service.ProductoService;
import pe.edu.vallegrande.app.service.ProductoTransferService;
import pe.edu.vallegrande.app.util.ExportFilters;
import pe.edu.vallegrande.app.util.FilePartUtils;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.LocalDate;
import java.util.Objects;

@CrossOrigin(origins = "*")
@RestController
@RequestMapping("/api/productos")
@Tag(name = "Productos API", description = "Endpoints para la gestión reactiva de Productos - Spring WebFlux")
public class ProductoRest {

    private static final String EXCEL_TYPE = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    private static final MediaType EXCEL_MEDIA_TYPE = MediaType.parseMediaType(EXCEL_TYPE);

    private final ProductoService productoService;
    private final ProductoTransferService transferService;

    @Autowired
    public ProductoRest(ProductoService productoService, ProductoTransferService transferService) {
        this.productoService = productoService;
        this.transferService = transferService;
    }

    // ✅ Listar todos (GET) - FLUX
    @GetMapping(produces = MediaType.APPLICATION_JSON_VALUE)
    @Operation(summary = "Listar todos los productos", description = "Retorna un flujo reactivo (Flux) con todos los productos registrados")
    public Flux<Producto> listar() {
        return productoService.listar();
    }

    // ✅ Listar por estado (GET) - FLUX
    @GetMapping(value = "/estado/{estado}", produces = MediaType.APPLICATION_JSON_VALUE)
    @Operation(summary = "Listar productos por estado", description = "Filtra productos según su estado: activos (true) o inactivos (false)")
    public Flux<Producto> listarPorEstado(@PathVariable Boolean estado) {
        return productoService.listarPorEstado(estado);
    }

    // ✅ Buscar por ID (GET) - MONO
    @GetMapping(value = "/{id}", produces = MediaType.APPLICATION_JSON_VALUE)
    @Operation(summary = "Buscar producto por ID", description = "Retorna un producto específico por su ID único (ObjectId de MongoDB)")
    public Mono<Producto> buscarPorId(@PathVariable String id) {
        return productoService.buscarPorId(id);
    }

    // ✅ Crear (POST) - MONO
    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Crear nuevo producto", description = "Registra un nuevo producto en MongoDB con estado activo por defecto")
    public Mono<Producto> crear(@RequestBody Producto producto) {
        return productoService.crear(producto);
    }

    // ✅ Editar (PUT) - MONO
    @PutMapping(value = "/{id}", consumes = MediaType.APPLICATION_JSON_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
    @Operation(summary = "Actualizar producto", description = "Modifica los atributos de un producto existente y actualiza la fecha updatedAt")
    public Mono<Producto> editar(@PathVariable String id, @RequestBody Producto producto) {
        return productoService.editar(id, producto);
    }

    // ✅ Eliminar lógico (PATCH) - MONO
    @PatchMapping(value = "/{id}/eliminar", produces = MediaType.APPLICATION_JSON_VALUE)
    @Operation(summary = "Eliminación lógica de producto", description = "Desactiva el producto (estado = false) y asigna la fecha deletedAt sin borrar el documento")
    public Mono<Producto> eliminarLogico(@PathVariable String id) {
        return productoService.eliminarLogico(id);
    }

    // ✅ Restaurar lógico (PATCH) - MONO
    @PatchMapping(value = "/{id}/restaurar", produces = MediaType.APPLICATION_JSON_VALUE)
    @Operation(summary = "Restaurar producto eliminado", description = "Reactiva el producto (estado = true) y asigna la fecha restoredAt")
    public Mono<Producto> restaurar(@PathVariable String id) {
        return productoService.restaurar(id);
    }

    // ── Importación masiva (Excel / CSV) ──────────────────────────────────────

    @PostMapping(value = "/import/excel", consumes = MediaType.MULTIPART_FORM_DATA_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
    @Operation(summary = "Importar productos desde Excel (.xlsx)",
            description = "Carga masiva desde un archivo .xlsx con cabecera (code, name, category, unitPrice, ...). "
                    + "Devuelve el total de filas, importadas y el detalle de errores.")
    public Mono<ImportResult> importExcel(@RequestPart("file") FilePart file) {
        return FilePartUtils.readBytes(file).flatMap(transferService::importExcel);
    }

    @PostMapping(value = "/import/csv", consumes = MediaType.MULTIPART_FORM_DATA_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
    @Operation(summary = "Importar productos desde CSV",
            description = "Carga masiva desde un archivo CSV con cabecera. Devuelve el resumen de la importación y los errores por fila.")
    public Mono<ImportResult> importCsv(@RequestPart("file") FilePart file) {
        return FilePartUtils.readBytes(file).flatMap(transferService::importCsv);
    }

    // ── Exportación (Excel / PDF) ────────────────────────────────────────────

    @GetMapping(value = "/export/excel", produces = EXCEL_TYPE)
    @Operation(summary = "Exportar productos a Excel (.xlsx)",
            description = "Filtros opcionales: active, category, from y to (fecha de creación ISO yyyy-MM-dd).")
    public Mono<ResponseEntity<byte[]>> exportExcel(
            @RequestParam(required = false) Boolean active,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return transferService.exportExcel(filtered(active, category, from, to))
                .map(body -> attachment(body, "products.xlsx", EXCEL_MEDIA_TYPE));
    }

    @GetMapping(value = "/export/pdf", produces = MediaType.APPLICATION_PDF_VALUE)
    @Operation(summary = "Exportar productos a PDF",
            description = "Reporte tabular con cabecera. Filtros opcionales: active, category, from y to.")
    public Mono<ResponseEntity<byte[]>> exportPdf(
            @RequestParam(required = false) Boolean active,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return transferService.exportPdf(filtered(active, category, from, to), "Reporte de Productos")
                .map(body -> attachment(body, "products.pdf", MediaType.APPLICATION_PDF));
    }

    private Flux<Producto> filtered(Boolean active, String category, LocalDate from, LocalDate to) {
        return productoService.listar()
                .filter(p -> active == null || Objects.equals(p.getActive(), active))
                .filter(p -> category == null || category.equalsIgnoreCase(p.getCategory()))
                .filter(p -> ExportFilters.inRange(p.getCreatedAt(), from, to));
    }

    private ResponseEntity<byte[]> attachment(byte[] body, String filename, MediaType type) {
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentType(type)
                .body(body);
    }
}

