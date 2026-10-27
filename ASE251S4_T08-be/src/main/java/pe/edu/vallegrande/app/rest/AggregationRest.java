package pe.edu.vallegrande.app.rest;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import pe.edu.vallegrande.app.service.AggregationService;
import reactor.core.publisher.Flux;

import java.util.Map;

@RestController
@RequestMapping("/v1/api/aggregations")
@CrossOrigin(origins = "*")
@Tag(name = "Aggregations API", description = "Pipelines de agregación MongoDB - Pierre Conca")
public class AggregationRest {

    @Autowired
    private AggregationService aggregationService;

    // =========================================================================
    // GET /v1/api/aggregations/productos/por-categoria
    // Pipeline 1: Resumen de productos agrupados por categoría.
    // Retorna: category, totalProducts, averagePrice, totalStock
    // =========================================================================
    @GetMapping(value = "/productos/por-categoria", produces = MediaType.APPLICATION_JSON_VALUE)
    @Operation(
        summary = "Resumen de productos por categoría",
        description = """
            Pipeline de agregación sobre la colección 'products'.
            Agrupa por categoría y calcula:
            - totalProducts: cantidad de productos en esa categoría
            - averagePrice: precio unitario promedio (Decimal128 → Double)
            - totalStock: suma de stock disponible
            Ordenado por totalStock descendente.
            """
    )
    public Flux<Map<String, Object>> productosResumenPorCategoria() {
        return aggregationService.productosResumenPorCategoria();
    }

    // =========================================================================
    // GET /v1/api/aggregations/agroquimicos/por-fabricante
    // Pipeline 2: Ranking de fabricantes de agroquímicos activos.
    // Retorna: manufacturer, totalProducts, categories[], averageWaitingDays
    // =========================================================================
    @GetMapping(value = "/agroquimicos/por-fabricante", produces = MediaType.APPLICATION_JSON_VALUE)
    @Operation(
        summary = "Ranking de fabricantes de agroquímicos activos",
        description = """
            Pipeline de agregación sobre la colección 'agrochemicals'.
            Filtra solo activos (active = true), agrupa por fabricante y calcula:
            - totalProducts: cantidad de agroquímicos por fabricante
            - categories: lista de categorías que maneja (sin duplicados)
            - averageWaitingDays: promedio del período de carencia SENASA
            Ordenado por totalProducts descendente (ranking).
            """
    )
    public Flux<Map<String, Object>> agroquimicosPorFabricante() {
        return aggregationService.agroquimicosPorFabricante();
    }
}
