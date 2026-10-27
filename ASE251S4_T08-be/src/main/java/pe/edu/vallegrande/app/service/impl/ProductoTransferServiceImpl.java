package pe.edu.vallegrande.app.service.impl;

import org.springframework.stereotype.Service;
import pe.edu.vallegrande.app.model.Producto;
import pe.edu.vallegrande.app.repository.mongo.ProductoRepository;
import pe.edu.vallegrande.app.service.ProductoTransferService;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Map;

@Service
public class ProductoTransferServiceImpl extends AbstractTransferServiceImpl<Producto>
        implements ProductoTransferService {

    private static final List<String> HEADERS = List.of(
            "id", "code", "name", "category", "description", "unitMeasure", "unitPrice",
            "currentStock", "minimumStock", "origin", "active");

    private final ProductoRepository repository;

    public ProductoTransferServiceImpl(ProductoRepository repository) {
        this.repository = repository;
    }

    @Override
    protected String entityName() {
        return "products";
    }

    @Override
    protected List<String> headers() {
        return HEADERS;
    }

    @Override
    protected String value(Producto p, String header) {
        return switch (header) {
            case "id" -> nullToEmpty(p.getId());
            case "code" -> nullToEmpty(p.getCode());
            case "name" -> nullToEmpty(p.getName());
            case "category" -> nullToEmpty(p.getCategory());
            case "description" -> nullToEmpty(p.getDescription());
            case "unitMeasure" -> nullToEmpty(p.getUnitMeasure());
            case "unitPrice" -> p.getUnitPrice() == null ? "" : p.getUnitPrice().toPlainString();
            case "currentStock" -> p.getCurrentStock() == null ? "" : String.valueOf(p.getCurrentStock());
            case "minimumStock" -> p.getMinimumStock() == null ? "" : String.valueOf(p.getMinimumStock());
            case "origin" -> nullToEmpty(p.getOrigin());
            case "active" -> Boolean.TRUE.equals(p.getActive()) ? "true" : "false";
            default -> "";
        };
    }

    @Override
    protected Producto fromRow(Map<String, String> row, int rowNumber) {
        Producto producto = new Producto();
        producto.setCode(optional(row, "code"));
        producto.setName(required(row, "name"));
        producto.setCategory(optional(row, "category"));
        producto.setDescription(optional(row, "description"));
        producto.setUnitMeasure(optional(row, "unitMeasure"));
        producto.setUnitPrice(parseDecimal(optional(row, "unitPrice"), "unitPrice"));
        producto.setCurrentStock(parseInteger(optional(row, "currentStock"), "currentStock", 0));
        producto.setMinimumStock(parseInteger(optional(row, "minimumStock"), "minimumStock", 0));
        producto.setOrigin(optional(row, "origin"));
        producto.setActive(parseBoolean(optional(row, "active"), Boolean.TRUE));
        producto.setCreatedAt(now());
        return producto;
    }

    @Override
    protected Mono<Producto> persist(Producto entity) {
        entity.setId(null);
        entity.setUpdatedAt(null);
        entity.setDeletedAt(null);
        entity.setRestoredAt(null);
        return repository.save(entity);
    }

    private String nullToEmpty(String value) {
        return value == null ? "" : value;
    }
}
