package pe.edu.vallegrande.app.service.impl;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import pe.edu.vallegrande.app.model.Producto;
import pe.edu.vallegrande.app.repository.mongo.ProductoRepository;
import pe.edu.vallegrande.app.service.ProductoService;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Slf4j
@Service
public class ProductoServiceImpl implements ProductoService {

    private final ProductoRepository productoRepository;

    @Autowired
    public ProductoServiceImpl(ProductoRepository productoRepository) {
        this.productoRepository = productoRepository;
    }

    @Override
    public Flux<Producto> listar() {
        log.info("Listando todos los productos");
        return productoRepository.findAll();
    }

    @Override
    public Flux<Producto> listarPorEstado(Boolean estado) {
        log.info("Listando productos por estado: {}", estado);
        return productoRepository.findByActive(estado);
    }

    @Override
    public Mono<Producto> buscarPorId(String id) {
        log.info("Buscando producto por ID: {}", id);
        return productoRepository.findById(id)
                .switchIfEmpty(Mono.error(new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Producto no encontrado con ID: " + id)));
    }

    @Override
    public Mono<Producto> crear(Producto producto) {
        log.info("Creando producto: {}", producto.getName());
        return validar(producto)
                .then(Mono.defer(() -> {
                    if (producto.getActive() == null) {
                        producto.setActive(true);
                    }
                    producto.setCreatedAt(LocalDateTime.now());
                    producto.setUpdatedAt(null);
                    producto.setDeletedAt(null);
                    producto.setRestoredAt(null);
                    return productoRepository.save(producto);
                }));
    }

    @Override
    public Mono<Producto> editar(String id, Producto producto) {
        log.info("Editando producto con ID: {}", id);
        return validar(producto)
                .then(productoRepository.findById(id)
                        .switchIfEmpty(Mono.error(new ResponseStatusException(
                                HttpStatus.NOT_FOUND, "Producto no encontrado con ID: " + id)))
                        .flatMap(existing -> {
                            existing.setCode(producto.getCode());
                            existing.setName(producto.getName());
                            existing.setDescription(producto.getDescription());
                            existing.setCategory(producto.getCategory());
                            existing.setUnitMeasure(producto.getUnitMeasure());
                            existing.setUnitPrice(producto.getUnitPrice());
                            existing.setCurrentStock(producto.getCurrentStock() != null ? producto.getCurrentStock() : 0);
                            existing.setMinimumStock(producto.getMinimumStock() != null ? producto.getMinimumStock() : 0);
                            existing.setOrigin(producto.getOrigin());
                            existing.setUpdatedAt(LocalDateTime.now());
                            return productoRepository.save(existing);
                        }));
    }

    @Override
    public Mono<Producto> eliminarLogico(String id) {
        log.info("Eliminando lógicamente producto con ID: {}", id);
        return productoRepository.findById(id)
                .switchIfEmpty(Mono.error(new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Producto no encontrado con ID: " + id)))
                .flatMap(existing -> {
                    existing.setActive(false);
                    existing.setDeletedAt(LocalDateTime.now());
                    existing.setRestoredAt(null);
                    return productoRepository.save(existing);
                });
    }

    @Override
    public Mono<Producto> restaurar(String id) {
        log.info("Restaurando producto con ID: {}", id);
        return productoRepository.findById(id)
                .switchIfEmpty(Mono.error(new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Producto no encontrado con ID: " + id)))
                .flatMap(existing -> {
                    existing.setActive(true);
                    existing.setRestoredAt(LocalDateTime.now());
                    existing.setDeletedAt(null);
                    return productoRepository.save(existing);
                });
    }

    private Mono<Void> validar(Producto producto) {
        if (producto.getCode() == null || producto.getCode().trim().isEmpty()) {
            return Mono.error(new ResponseStatusException(HttpStatus.BAD_REQUEST, "El código es obligatorio"));
        }
        if (producto.getName() == null || producto.getName().trim().isEmpty()) {
            return Mono.error(new ResponseStatusException(HttpStatus.BAD_REQUEST, "El nombre es obligatorio"));
        }
        if (producto.getCategory() == null || producto.getCategory().trim().isEmpty()) {
            return Mono.error(new ResponseStatusException(HttpStatus.BAD_REQUEST, "La categoría es obligatoria"));
        }
        if (producto.getUnitMeasure() == null || producto.getUnitMeasure().trim().isEmpty()) {
            return Mono.error(new ResponseStatusException(HttpStatus.BAD_REQUEST, "La unidad de medida es obligatoria"));
        }
        if (producto.getUnitPrice() == null) {
            return Mono.error(new ResponseStatusException(HttpStatus.BAD_REQUEST, "El precio unitario es obligatorio"));
        }
        if (producto.getUnitPrice().compareTo(BigDecimal.ZERO) < 0) {
            return Mono.error(new ResponseStatusException(HttpStatus.BAD_REQUEST, "El precio unitario no puede ser negativo"));
        }
        if (producto.getCurrentStock() == null) {
            producto.setCurrentStock(0);
        } else if (producto.getCurrentStock() < 0) {
            return Mono.error(new ResponseStatusException(HttpStatus.BAD_REQUEST, "El stock actual no puede ser negativo"));
        }
        if (producto.getMinimumStock() == null) {
            producto.setMinimumStock(0);
        } else if (producto.getMinimumStock() < 0) {
            return Mono.error(new ResponseStatusException(HttpStatus.BAD_REQUEST, "El stock mínimo no puede ser negativo"));
        }
        if (producto.getOrigin() == null || producto.getOrigin().trim().isEmpty()) {
            return Mono.error(new ResponseStatusException(HttpStatus.BAD_REQUEST, "El origen es obligatorio"));
        }
        return Mono.empty();
    }
}