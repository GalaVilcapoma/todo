package pe.edu.vallegrande.app.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import pe.edu.vallegrande.app.model.Agrochemical;
import pe.edu.vallegrande.app.model.Customer;
import pe.edu.vallegrande.app.model.Producto;
import pe.edu.vallegrande.app.repository.mongo.AgrochemicalRepository;
import pe.edu.vallegrande.app.repository.mongo.CustomerRepository;
import pe.edu.vallegrande.app.repository.mongo.ProductoRepository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;

@Configuration
@Slf4j
public class DataSeeder {

    @Bean
    CommandLineRunner initDatabase(AgrochemicalRepository agrochemicalRepository,
                                   ProductoRepository productoRepository,
                                   CustomerRepository customerRepository) {
        return args -> {
            // Seeder para Agroquímicos
            Long agroCount = agrochemicalRepository.count().block();
            if (agroCount != null && agroCount > 0) {
                log.info("✅ La base de datos ya tiene {} agroquímicos. No se insertarán agroquímicos.", agroCount);
            } else {
                log.info("🌱 Insertando agroquímicos de prueba en la base de datos...");
                List<Agrochemical> agrochemicals = Arrays.asList(
                    createAgrochemical("Roundup Max", "Glifosato 74.7%", Agrochemical.AgrochemicalCategory.HERBICIDE, "SEN-2024-001", LocalDate.of(2026, 12, 31), new BigDecimal("2.5"), 15, "Bayer CropScience"),
                    createAgrochemical("Karate Zeon", "Lambda-Cialotrina 5%", Agrochemical.AgrochemicalCategory.INSECTICIDE, "SEN-2024-002", LocalDate.of(2027, 6, 30), new BigDecimal("1.5"), 21, "Syngenta"),
                    createAgrochemical("Score 250 EC", "Difenoconazol 25%", Agrochemical.AgrochemicalCategory.FUNGICIDE, "SEN-2024-003", LocalDate.of(2026, 9, 15), new BigDecimal("0.5"), 14, "Syngenta")
                );
                agrochemicalRepository.saveAll(agrochemicals)
                    .collectList()
                    .doOnSuccess(saved -> log.info("✅ {} agroquímicos insertados correctamente!", saved.size()))
                    .subscribe();
            }

            // Seeder para Productos
            Long prodCount = productoRepository.count().block();
            if (prodCount != null && prodCount > 0) {
                log.info("✅ La base de datos ya tiene {} productos. No se insertarán productos.", prodCount);
            } else {
                log.info("🌱 Insertando productos de prueba en la base de datos...");
                List<Producto> productos = Arrays.asList(
                    createProducto("PROD-001", "Fertilizante Folia-X", "Fertilizante líquido concentrado para frutos", "Fertilizantes", "Litros", new BigDecimal("45.50"), 100, 10, "Nacional"),
                    createProducto("PROD-002", "Fungicida Cupro-Z", "Fungicida cúprico sistémico preventivo", "Fungicidas", "Kilogramos", new BigDecimal("78.00"), 50, 5, "Importado"),
                    createProducto("PROD-003", "Bio-Estimulante Raíz-Plus", "Enraizante orgánico rico en aminoácidos", "Bioestimulantes", "Litros", new BigDecimal("120.00"), 30, 5, "Nacional")
                );
                productoRepository.saveAll(productos)
                    .collectList()
                    .doOnSuccess(saved -> log.info("✅ {} productos insertados correctamente!", saved.size()))
                    .subscribe();
            }

            // Seeder para Clientes
            Long customerCount = customerRepository.count().block();
            if (customerCount != null && customerCount > 0) {
                log.info("✅ La base de datos ya tiene {} clientes. No se insertarán clientes.", customerCount);
            } else {
                log.info("🌱 Insertando clientes de prueba en la base de datos...");
                List<Customer> clientes = Arrays.asList(
                    createCustomer("CLI-001", "Agroindustrias Valle Verde S.A.C.", "20123456789", "RUC",
                            "20123456789", "Perú", "Ica", "Av. Los Viñedos 123", "956123456",
                            "agrovalleverde@example.com", "Ing. Carlos Ramírez", "Empresa"),
                    createCustomer("CLI-002", "Frutos del Sol E.I.R.L.", "20567890123", "RUC",
                            "20567890123", "Perú", "Lima", "Jr. Los Olivos 456", "987654321",
                            "frutosdelsol@example.com", "Sra. Lucía Torres", "Empresa"),
                    createCustomer("CLI-003", "Juan Pérez Gómez", "45678901", "DNI",
                            "45678901", "Perú", "Arequipa", "Calle El Mirador 789", "999888777",
                            "juan.perez@example.com", "Juan Pérez Gómez", "Natural")
                );
                customerRepository.saveAll(clientes)
                    .collectList()
                    .doOnSuccess(saved -> log.info("✅ {} clientes insertados correctamente!", saved.size()))
                    .subscribe();
            }
        };
    }

    private Agrochemical createAgrochemical(String commercialName, String activeIngredient,
                                           Agrochemical.AgrochemicalCategory category,
                                           String senasaNumber, LocalDate registrationExpiry,
                                           BigDecimal maxDose, Integer waitingPeriodDays,
                                           String manufacturer) {
        Agrochemical agrochemical = new Agrochemical();
        agrochemical.setCommercialName(commercialName);
        agrochemical.setActiveIngredient(activeIngredient);
        agrochemical.setCategory(category);
        agrochemical.setSenasaRegistrationNumber(senasaNumber);
        agrochemical.setRegistrationExpiry(registrationExpiry);
        agrochemical.setMaxDose(maxDose);
        agrochemical.setWaitingPeriodDays(waitingPeriodDays);
        agrochemical.setManufacturer(manufacturer);
        agrochemical.setActive(true);
        agrochemical.setCreatedAt(LocalDateTime.now());
        return agrochemical;
    }

    private Customer createCustomer(String codigo, String razonSocial, String ruc, String tipoDocumento,
                                    String numeroDocumento, String pais, String ciudad, String direccion,
                                    String telefono, String email, String contactoPrincipal, String tipoCliente) {
        Customer customer = new Customer();
        customer.setCode(codigo);
        customer.setBusinessName(razonSocial);
        customer.setRuc(ruc);
        customer.setDocumentType(tipoDocumento);
        customer.setDocumentNumber(numeroDocumento);
        customer.setCountry(pais);
        customer.setCity(ciudad);
        customer.setAddress(direccion);
        customer.setPhone(telefono);
        customer.setEmail(email);
        customer.setPrimaryContact(contactoPrincipal);
        customer.setCustomerType(tipoCliente);
        customer.setState("A");
        customer.setActive(true);
        customer.setCreatedAt(LocalDateTime.now());
        return customer;
    }

    private Producto createProducto(String codigo, String nombre, String descripcion, String categoria,
                                   String unidadMedida, BigDecimal precioUnitario, Integer stockActual,
                                   Integer stockMinimo, String origen) {
        Producto producto = new Producto();
        producto.setCode(codigo);
        producto.setName(nombre);
        producto.setDescription(descripcion);
        producto.setCategory(categoria);
        producto.setUnitMeasure(unidadMedida);
        producto.setUnitPrice(precioUnitario);
        producto.setCurrentStock(stockActual);
        producto.setMinimumStock(stockMinimo);
        producto.setOrigin(origen);
        producto.setActive(true);
        producto.setCreatedAt(LocalDateTime.now());
        return producto;
    }
}

