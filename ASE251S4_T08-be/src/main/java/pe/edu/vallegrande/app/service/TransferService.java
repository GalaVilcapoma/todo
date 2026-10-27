package pe.edu.vallegrande.app.service;

import pe.edu.vallegrande.app.dto.ImportResult;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

/**
 * Importación y exportación masiva de una entidad maestra.
 *
 * @param <T> tipo del documento (Agrochemical, Customer, Producto).
 */
public interface TransferService<T> {

    Mono<ImportResult> importExcel(byte[] content);

    Mono<ImportResult> importCsv(byte[] content);

    Mono<byte[]> exportExcel(Flux<T> data);

    Mono<byte[]> exportPdf(Flux<T> data, String title);
}
