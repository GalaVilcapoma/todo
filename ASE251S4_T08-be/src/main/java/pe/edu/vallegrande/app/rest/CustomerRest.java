package pe.edu.vallegrande.app.rest;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import pe.edu.vallegrande.app.dto.ImportResult;
import pe.edu.vallegrande.app.model.Customer;
import pe.edu.vallegrande.app.service.CustomerService;
import pe.edu.vallegrande.app.service.CustomerTransferService;
import pe.edu.vallegrande.app.util.ExportFilters;
import pe.edu.vallegrande.app.util.FilePartUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.codec.multipart.FilePart;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.LocalDate;

@CrossOrigin(origins = "*")
@RestController
@RequestMapping("/v1/api/customer")
@Tag(name = "Customer API", description = "Clientes (maestro) - importación y exportación reactiva")
public class CustomerRest {

    private static final String EXCEL_TYPE = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    private static final MediaType EXCEL_MEDIA_TYPE = MediaType.parseMediaType(EXCEL_TYPE);

    private final CustomerService customerService;
    private final CustomerTransferService transferService;

    @Autowired
    public CustomerRest(CustomerService customerService, CustomerTransferService transferService) {
        this.customerService = customerService;
        this.transferService = transferService;
    }

    // GET - Listar todos
    @GetMapping
    public Flux<Customer> findAll() {
        return customerService.findAll();
    }

    // GET - Listar por estado (A o I)
    @GetMapping("/state/{state}")
    public Flux<Customer> findByState(@PathVariable String state) {
        return customerService.findByState(state);
    }

    // GET - Listar por ID
    @GetMapping("/{id}")
    public Mono<Customer> findById(@PathVariable String id) {
        return customerService.findById(id);
    }

    // POST - Crear
    @PostMapping
    public Mono<Customer> save(@RequestBody Customer customer) {
        return customerService.save(customer);
    }

    // PUT - Editar
    @PutMapping("/{id}")
    public Mono<Customer> update(@PathVariable String id, @RequestBody Customer customer) {
        return customerService.update(id, customer);
    }

    // PATCH - Eliminar lógico
    @PatchMapping("/delete/{id}")
    public Mono<Customer> delete(@PathVariable String id) {
        return customerService.delete(id);
    }

    // PATCH - Restaurar lógico
    @PatchMapping("/restore/{id}")
    public Mono<Customer> restore(@PathVariable String id) {
        return customerService.restore(id);
    }

    // ── Importación masiva (Excel / CSV) ──────────────────────────────────────

    @PostMapping(value = "/import/excel", consumes = MediaType.MULTIPART_FORM_DATA_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
    @Operation(summary = "Importar clientes desde Excel (.xlsx)",
            description = "Carga masiva desde un archivo .xlsx con cabecera (code, businessName, ruc, ...). "
                    + "Devuelve el total de filas, importadas y el detalle de errores.")
    public Mono<ImportResult> importExcel(@RequestPart("file") FilePart file) {
        return FilePartUtils.readBytes(file).flatMap(transferService::importExcel);
    }

    @PostMapping(value = "/import/csv", consumes = MediaType.MULTIPART_FORM_DATA_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
    @Operation(summary = "Importar clientes desde CSV",
            description = "Carga masiva desde un archivo CSV con cabecera. Devuelve el resumen de la importación y los errores por fila.")
    public Mono<ImportResult> importCsv(@RequestPart("file") FilePart file) {
        return FilePartUtils.readBytes(file).flatMap(transferService::importCsv);
    }

    // ── Exportación (Excel / PDF) ────────────────────────────────────────────

    @GetMapping(value = "/export/excel", produces = EXCEL_TYPE)
    @Operation(summary = "Exportar clientes a Excel (.xlsx)",
            description = "Filtros opcionales: active, from y to (fecha de creación ISO yyyy-MM-dd).")
    public Mono<ResponseEntity<byte[]>> exportExcel(
            @RequestParam(required = false) Boolean active,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return transferService.exportExcel(filtered(active, from, to))
                .map(body -> attachment(body, "customers.xlsx", EXCEL_MEDIA_TYPE));
    }

    @GetMapping(value = "/export/pdf", produces = MediaType.APPLICATION_PDF_VALUE)
    @Operation(summary = "Exportar clientes a PDF",
            description = "Reporte tabular con cabecera. Filtros opcionales: active, from y to.")
    public Mono<ResponseEntity<byte[]>> exportPdf(
            @RequestParam(required = false) Boolean active,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return transferService.exportPdf(filtered(active, from, to), "Reporte de Clientes")
                .map(body -> attachment(body, "customers.pdf", MediaType.APPLICATION_PDF));
    }

    private Flux<Customer> filtered(Boolean active, LocalDate from, LocalDate to) {
        return customerService.findAll()
                .filter(c -> active == null || (active ? "A" : "I").equalsIgnoreCase(c.getState()))
                .filter(c -> ExportFilters.inRange(c.getCreatedAt(), from, to));
    }

    private ResponseEntity<byte[]> attachment(byte[] body, String filename, MediaType type) {
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentType(type)
                .body(body);
    }

}
