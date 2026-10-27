package pe.edu.vallegrande.app.service;

import pe.edu.vallegrande.app.model.Producto;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

public interface ProductoService {

    Flux<Producto> listar();

    Flux<Producto> listarPorEstado(Boolean estado);

    Mono<Producto> buscarPorId(String id);

    Mono<Producto> crear(Producto producto);

    Mono<Producto> editar(String id, Producto producto);

    Mono<Producto> eliminarLogico(String id);

    Mono<Producto> restaurar(String id);

}
