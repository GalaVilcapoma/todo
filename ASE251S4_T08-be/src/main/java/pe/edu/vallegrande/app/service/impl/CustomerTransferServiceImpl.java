package pe.edu.vallegrande.app.service.impl;

import org.springframework.stereotype.Service;
import pe.edu.vallegrande.app.model.Customer;
import pe.edu.vallegrande.app.repository.mongo.CustomerRepository;
import pe.edu.vallegrande.app.service.CustomerTransferService;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.regex.Pattern;

@Service
public class CustomerTransferServiceImpl extends AbstractTransferServiceImpl<Customer>
        implements CustomerTransferService {

    private static final List<String> HEADERS = List.of(
            "id", "code", "businessName", "ruc", "documentType", "documentNumber", "country", "city",
            "address", "phone", "email", "primaryContact", "customerType", "state", "active");

    private static final Pattern EMAIL = Pattern.compile("^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$");

    private final CustomerRepository repository;

    public CustomerTransferServiceImpl(CustomerRepository repository) {
        this.repository = repository;
    }

    @Override
    protected String entityName() {
        return "customers";
    }

    @Override
    protected List<String> headers() {
        return HEADERS;
    }

    @Override
    protected String value(Customer c, String header) {
        return switch (header) {
            case "id" -> nullToEmpty(c.getId());
            case "code" -> nullToEmpty(c.getCode());
            case "businessName" -> nullToEmpty(c.getBusinessName());
            case "ruc" -> nullToEmpty(c.getRuc());
            case "documentType" -> nullToEmpty(c.getDocumentType());
            case "documentNumber" -> nullToEmpty(c.getDocumentNumber());
            case "country" -> nullToEmpty(c.getCountry());
            case "city" -> nullToEmpty(c.getCity());
            case "address" -> nullToEmpty(c.getAddress());
            case "phone" -> nullToEmpty(c.getPhone());
            case "email" -> nullToEmpty(c.getEmail());
            case "primaryContact" -> nullToEmpty(c.getPrimaryContact());
            case "customerType" -> nullToEmpty(c.getCustomerType());
            case "state" -> nullToEmpty(c.getState());
            case "active" -> Boolean.TRUE.equals(c.getActive()) ? "true" : "false";
            default -> "";
        };
    }

    @Override
    protected Customer fromRow(Map<String, String> row, int rowNumber) {
        Customer customer = new Customer();
        customer.setCode(optional(row, "code"));
        customer.setBusinessName(required(row, "businessName"));
        customer.setRuc(optional(row, "ruc"));
        customer.setDocumentType(optional(row, "documentType"));
        customer.setDocumentNumber(optional(row, "documentNumber"));
        customer.setCountry(optional(row, "country"));
        customer.setCity(optional(row, "city"));
        customer.setAddress(optional(row, "address"));
        customer.setPhone(optional(row, "phone"));
        customer.setEmail(parseEmail(optional(row, "email")));
        customer.setPrimaryContact(optional(row, "primaryContact"));
        customer.setCustomerType(optional(row, "customerType"));

        boolean active = resolveActive(optional(row, "active"), optional(row, "state"));
        customer.setActive(active);
        customer.setState(active ? "A" : "I");
        customer.setCreatedAt(now());
        return customer;
    }

    @Override
    protected Mono<Customer> persist(Customer entity) {
        entity.setId(null);
        entity.setUpdatedAt(null);
        entity.setDeletedAt(null);
        entity.setRestoredAt(null);
        return repository.save(entity);
    }

    private boolean resolveActive(String activeValue, String stateValue) {
        if (activeValue != null) {
            return parseBoolean(activeValue, Boolean.TRUE);
        }
        if (stateValue != null) {
            String state = stateValue.trim().toUpperCase(Locale.ROOT);
            if (state.equals("A") || state.equals("I")) {
                return state.equals("A");
            }
            throw new IllegalArgumentException("El campo 'state' debe ser 'A' (activo) o 'I' (inactivo). Valor: " + stateValue);
        }
        return true;
    }

    private String parseEmail(String value) {
        if (value == null) {
            return null;
        }
        if (!EMAIL.matcher(value).matches()) {
            throw new IllegalArgumentException("El campo 'email' no es válido. Valor: " + value);
        }
        return value;
    }

    private String nullToEmpty(String value) {
        return value == null ? "" : value;
    }
}
