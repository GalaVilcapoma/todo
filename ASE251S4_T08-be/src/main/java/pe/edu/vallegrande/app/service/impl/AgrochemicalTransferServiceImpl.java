package pe.edu.vallegrande.app.service.impl;

import org.springframework.stereotype.Service;
import pe.edu.vallegrande.app.model.Agrochemical;
import pe.edu.vallegrande.app.model.Agrochemical.AgrochemicalCategory;
import pe.edu.vallegrande.app.repository.mongo.AgrochemicalRepository;
import pe.edu.vallegrande.app.service.AgrochemicalTransferService;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Locale;
import java.util.Map;

@Service
public class AgrochemicalTransferServiceImpl extends AbstractTransferServiceImpl<Agrochemical>
        implements AgrochemicalTransferService {

    private static final List<String> HEADERS = List.of(
            "id", "commercialName", "activeIngredient", "category", "senasaRegistrationNumber",
            "registrationExpiry", "maxDose", "waitingPeriodDays", "manufacturer", "active");

    private final AgrochemicalRepository repository;

    public AgrochemicalTransferServiceImpl(AgrochemicalRepository repository) {
        this.repository = repository;
    }

    @Override
    protected String entityName() {
        return "agrochemicals";
    }

    @Override
    protected List<String> headers() {
        return HEADERS;
    }

    @Override
    protected String value(Agrochemical a, String header) {
        return switch (header) {
            case "id" -> nullToEmpty(a.getId());
            case "commercialName" -> nullToEmpty(a.getCommercialName());
            case "activeIngredient" -> nullToEmpty(a.getActiveIngredient());
            case "category" -> a.getCategory() == null ? "" : a.getCategory().name();
            case "senasaRegistrationNumber" -> nullToEmpty(a.getSenasaRegistrationNumber());
            case "registrationExpiry" -> a.getRegistrationExpiry() == null ? "" : a.getRegistrationExpiry().toString();
            case "maxDose" -> a.getMaxDose() == null ? "" : a.getMaxDose().toPlainString();
            case "waitingPeriodDays" -> a.getWaitingPeriodDays() == null ? "" : String.valueOf(a.getWaitingPeriodDays());
            case "manufacturer" -> nullToEmpty(a.getManufacturer());
            case "active" -> Boolean.TRUE.equals(a.getActive()) ? "true" : "false";
            default -> "";
        };
    }

    @Override
    protected Agrochemical fromRow(Map<String, String> row, int rowNumber) {
        Agrochemical agrochemical = new Agrochemical();
        agrochemical.setCommercialName(required(row, "commercialName"));
        agrochemical.setActiveIngredient(required(row, "activeIngredient"));
        agrochemical.setCategory(parseCategory(required(row, "category")));
        agrochemical.setSenasaRegistrationNumber(optional(row, "senasaRegistrationNumber"));
        agrochemical.setRegistrationExpiry(parseDate(optional(row, "registrationExpiry"), "registrationExpiry"));
        agrochemical.setMaxDose(parseDecimal(optional(row, "maxDose"), "maxDose"));
        agrochemical.setWaitingPeriodDays(parseInteger(optional(row, "waitingPeriodDays"), "waitingPeriodDays", 0));
        agrochemical.setManufacturer(optional(row, "manufacturer"));
        agrochemical.setActive(parseBoolean(optional(row, "active"), Boolean.TRUE));
        agrochemical.setCreatedAt(now());
        return agrochemical;
    }

    @Override
    protected Mono<Agrochemical> persist(Agrochemical entity) {
        entity.setId(null);
        entity.setUpdatedAt(null);
        entity.setDeletedAt(null);
        entity.setRestoredAt(null);
        return repository.save(entity);
    }

    private AgrochemicalCategory parseCategory(String value) {
        try {
            return AgrochemicalCategory.valueOf(value.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException ex) {
            throw new IllegalArgumentException("El campo 'category' no es válido. Valor: " + value
                    + " (permitidos: INSECTICIDE, FUNGICIDE, HERBICIDE, FERTILIZER, BIOSTIMULANT, OTHER).");
        }
    }

    private String nullToEmpty(String value) {
        return value == null ? "" : value;
    }
}
