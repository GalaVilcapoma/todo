package pe.edu.vallegrande.app.service;

import reactor.core.publisher.Flux;
import java.util.Map;

public interface AggregationService {

    /**
     * Pipeline 1: Agrupa productos por categoría y calcula
     * el total de productos, precio promedio y stock acumulado.
     */
    Flux<Map<String, Object>> productosResumenPorCategoria();

    /**
     * Pipeline 2: Agrupa agroquímicos activos por fabricante y calcula
     * el total de productos, categorías manejadas y días de espera promedio.
     */
    Flux<Map<String, Object>> agroquimicosPorFabricante();
}
