package pe.edu.vallegrande.app.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.edu.vallegrande.app.dto.*;
import pe.edu.vallegrande.app.model.Agrochemical;
import pe.edu.vallegrande.app.model.AgrochemicalApplication;
import pe.edu.vallegrande.app.model.AgrochemicalApplicationDetail;
import pe.edu.vallegrande.app.model.AgrochemicalApplication.ApplicationStatus;
import pe.edu.vallegrande.app.repository.mongo.AgrochemicalRepository;
import pe.edu.vallegrande.app.repository.r2dbc.AgrochemicalApplicationDetailRepository;
import pe.edu.vallegrande.app.repository.r2dbc.AgrochemicalApplicationRepository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class AgrochemicalApplicationService {

    private final AgrochemicalApplicationRepository applicationRepository;
    private final AgrochemicalApplicationDetailRepository detailRepository;
    private final AgrochemicalRepository agrochemicalRepository;

    // LIST ALL
    public Flux<AgrochemicalApplicationResponse> listAll() {
        log.info("Listing all active agrochemical applications");
        return applicationRepository.findByActiveTrue()
                .doOnNext(app -> log.debug("Found application: {}", app.getApplicationNumber()))
                .flatMap(this::buildResponse)
                .doOnError(e -> log.error("Error listing applications", e))
                .onErrorResume(e -> {
                    log.error("Returning empty list due to error in listAll", e);
                    return Flux.empty();
                });
    }

    // LIST BY ID
    public Mono<AgrochemicalApplicationResponse> findById(Long id) {
        return applicationRepository.findById(id)
                .flatMap(this::buildResponse);
    }

    // CREATE
    @Transactional
    public Mono<AgrochemicalApplicationResponse> create(AgrochemicalApplicationRequest request) {
        log.info("[AgrochemicalApplication] Creating new application for field: {}", request.getFieldName());
        
        // 1. Validate at least one detail
        if (request.getDetails() == null || request.getDetails().isEmpty()) {
            return Mono.error(new IllegalArgumentException(
                    "The application must have at least one agrochemical in the detail."));
        }
        
        // 2. Validate all agrochemical IDs exist in MongoDB and are active
        return validarAgroquimicos(request.getDetails())
                .flatMap(agroPorId ->
                    generateApplicationNumber()
                        .flatMap(applicationNumber -> {
                            // Create header
                            AgrochemicalApplication application = new AgrochemicalApplication();
                            application.setApplicationNumber(applicationNumber);
                            application.setFieldName(request.getFieldName());
                            application.setAreaHectares(request.getAreaHectares());
                            application.setApplicationDate(request.getApplicationDate());
                            application.setResponsible(request.getResponsible());
                            application.setTemperatureCelsius(request.getTemperatureCelsius());
                            application.setHumidityPercentage(request.getHumidityPercentage());
                            application.setWindConditions(request.getWindConditions());
                            application.setStatus(ApplicationStatus.SCHEDULED.name());
                            application.setRemarks(request.getRemarks());
                            application.setTotalProducts(request.getDetails().size());
                            application.setTotalCost(BigDecimal.ZERO);
                            application.setActive(true);
                            application.setCreatedAt(LocalDateTime.now());
                            application.setUpdatedAt(LocalDateTime.now());

                            return applicationRepository.save(application);
                        })
                        .flatMap(savedApplication -> {
                            // Save details reusing the already validated agrochemicals:
                            // reconsultar MongoDB aquí volvería a dejar category y maxDose
                            // sin validar, justo donde se desreferencian.
                            return guardarDetalles(savedApplication.getId(), request.getDetails(), agroPorId)
                                    .flatMap(details -> {
                                        BigDecimal totalCost = details.stream()
                                                .map(AgrochemicalApplicationDetail::getTotalCost)
                                                .reduce(BigDecimal.ZERO, BigDecimal::add);
                                        savedApplication.setTotalCost(totalCost);
                                        return applicationRepository.save(savedApplication);
                                    });
                        })
                        .flatMap(this::buildResponse)
                        .doOnSuccess(res -> log.info("[AgrochemicalApplication] Application created: {}, total cost={}", 
                                res.getApplicationNumber(), res.getTotalCost()))
                );
    }

    // EDIT
    @Transactional
    public Mono<AgrochemicalApplicationResponse> edit(Long id, AgrochemicalApplicationRequest request) {
        log.info("[AgrochemicalApplication] Editing application ID: {}", id);
        
        // 1. Validate at least one detail
        if (request.getDetails() == null || request.getDetails().isEmpty()) {
            return Mono.error(new IllegalArgumentException(
                    "The application must have at least one agrochemical in the detail."));
        }
        
        return applicationRepository.findById(id)
                .switchIfEmpty(Mono.error(new RuntimeException("Application not found with ID: " + id)))
                .flatMap(existing -> {
                    // 2. Validate application can be edited (not COMPLETED or CANCELLED)
                    if (ApplicationStatus.COMPLETED.name().equals(existing.getStatus())) {
                        return Mono.error(new IllegalStateException(
                                "Cannot edit a completed application."));
                    }
                    if (ApplicationStatus.CANCELLED.name().equals(existing.getStatus())) {
                        return Mono.error(new IllegalStateException(
                                "Cannot edit a cancelled application."));
                    }
                    
                    // 3. Validate all agrochemical IDs exist in MongoDB and are active
                    return validarAgroquimicos(request.getDetails())
                            .flatMap(agroPorId -> {
                                // Update header
                                existing.setFieldName(request.getFieldName());
                                existing.setAreaHectares(request.getAreaHectares());
                                existing.setApplicationDate(request.getApplicationDate());
                                existing.setResponsible(request.getResponsible());
                                existing.setTemperatureCelsius(request.getTemperatureCelsius());
                                existing.setHumidityPercentage(request.getHumidityPercentage());
                                existing.setWindConditions(request.getWindConditions());
                                existing.setRemarks(request.getRemarks());
                                existing.setTotalProducts(request.getDetails().size());
                                existing.setUpdatedAt(LocalDateTime.now());

                                // Delete old details
                                return detailRepository.deleteByApplicationId(id)
                                        .then(Mono.just(existing))
                                        .flatMap(savedApplication -> guardarDetalles(
                                                        id, request.getDetails(), agroPorId)
                                                .flatMap(details -> {
                                                    BigDecimal totalCost = details.stream()
                                                            .map(AgrochemicalApplicationDetail::getTotalCost)
                                                            .reduce(BigDecimal.ZERO, BigDecimal::add);
                                                    savedApplication.setTotalCost(totalCost);
                                                    return applicationRepository.save(savedApplication);
                                                }));
                            });
                })
                .flatMap(this::buildResponse)
                .doOnSuccess(res -> log.info("[AgrochemicalApplication] Application edited: {}, new total cost={}", 
                        res.getApplicationNumber(), res.getTotalCost()));
    }

    // HELPERS

    /**
     * Valida cada línea contra el catálogo de MongoDB y devuelve los agroquímicos
     * aceptados indexados por id, para que el guardado del detalle no tenga que
     * consultarlos otra vez.
     *
     * <p>Además de existencia y estado, valida {@code category} y {@code maxDose}: ambos
     * se desreferencian al construir el detalle y, al ser opcionales en MongoDB, un
     * valor nulo provocaba un NullPointerException en lugar de un error de validación.
     */
    private Mono<Map<String, Agrochemical>> validarAgroquimicos(
            List<AgrochemicalApplicationDetailRequest> detalleRequests) {
        return Flux.fromIterable(detalleRequests)
                .flatMap(detalleReq -> {
                    String agrochemicalId = detalleReq.getAgrochemicalId();
                    if (agrochemicalId == null || agrochemicalId.isBlank()) {
                        return Mono.error(new IllegalArgumentException(
                                "Every detail line must reference an agrochemicalId."));
                    }
                    return agrochemicalRepository.findById(agrochemicalId)
                            .switchIfEmpty(Mono.error(new RuntimeException(
                                    "Agrochemical not found with ID: " + agrochemicalId)))
                            .flatMap(agro -> validarDetalle(detalleReq, agro).thenReturn(agro));
                })
                .collectMap(Agrochemical::getId, agro -> agro);
    }

    private Mono<Void> validarDetalle(AgrochemicalApplicationDetailRequest detalleReq, Agrochemical agro) {
        String nombre = agro.getCommercialName();

        if (!Boolean.TRUE.equals(agro.getActive())) {
            return Mono.error(new IllegalStateException("The agrochemical '" + nombre + "' is inactive."));
        }
        if (detalleReq.getAppliedDose() == null
                || detalleReq.getAppliedDose().compareTo(BigDecimal.ZERO) <= 0) {
            return Mono.error(new IllegalArgumentException(
                    "The applied dose for '" + nombre + "' must be greater than 0."));
        }
        if (detalleReq.getTreatedAreaHectares() == null
                || detalleReq.getTreatedAreaHectares().compareTo(BigDecimal.ZERO) <= 0) {
            return Mono.error(new IllegalArgumentException(
                    "The treated area for '" + nombre + "' must be greater than 0."));
        }
        if (agro.getCategory() == null) {
            return Mono.error(new IllegalStateException(
                    "The agrochemical '" + nombre + "' has no registered category."));
        }
        if (agro.getMaxDose() == null) {
            return Mono.error(new IllegalStateException(
                    "The agrochemical '" + nombre + "' has no registered maximum dose."));
        }
        if (detalleReq.getAppliedDose().compareTo(agro.getMaxDose()) > 0) {
            return Mono.error(new IllegalArgumentException(
                    "The applied dose for '" + nombre + "' exceeds the maximum recommended dose of "
                            + agro.getMaxDose()));
        }
        return Mono.empty();
    }

    /** Persiste el detalle de una aplicación reutilizando los agroquímicos ya validados. */
    private Mono<List<AgrochemicalApplicationDetail>> guardarDetalles(
            Long applicationId,
            List<AgrochemicalApplicationDetailRequest> detalleRequests,
            Map<String, Agrochemical> agroPorId) {
        return Flux.fromIterable(detalleRequests)
                .concatMap(detalleReq -> {
                    Agrochemical agro = agroPorId.get(detalleReq.getAgrochemicalId());
                    AgrochemicalApplicationDetail detail = new AgrochemicalApplicationDetail();
                    detail.setApplicationId(applicationId);
                    detail.setAgrochemicalId(agro.getId());
                    detail.setAgrochemicalName(agro.getCommercialName());
                    detail.setCategory(agro.getCategory().toString());
                    detail.setAppliedDose(detalleReq.getAppliedDose());
                    detail.setUnitMeasure(detalleReq.getUnitMeasure());
                    detail.setTreatedAreaHectares(detalleReq.getTreatedAreaHectares());
                    detail.setUnitCost(agro.getMaxDose());
                    detail.setTotalCost(detalleReq.getAppliedDose().multiply(agro.getMaxDose()));
                    detail.setRemark(detalleReq.getRemark());
                    detail.setCreatedAt(LocalDateTime.now());
                    return detailRepository.save(detail);
                })
                .collectList();
    }

    private Mono<String> generateApplicationNumber() {
        String date = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        return applicationRepository.countByApplicationDateToday()
                .map(count -> String.format("APP-%s-%03d", date, count + 1));
    }

    private Mono<AgrochemicalApplicationResponse> buildResponse(AgrochemicalApplication app) {
        // Build response object
        AgrochemicalApplicationResponse response = new AgrochemicalApplicationResponse();
        response.setId(app.getId());
        response.setApplicationNumber(app.getApplicationNumber());
        response.setFieldName(app.getFieldName());
        response.setAreaHectares(app.getAreaHectares());
        response.setApplicationDate(app.getApplicationDate());
        response.setResponsible(app.getResponsible());
        response.setTemperatureCelsius(app.getTemperatureCelsius());
        response.setHumidityPercentage(app.getHumidityPercentage());
        response.setWindConditions(app.getWindConditions());
        response.setStatus(app.getStatus());
        response.setRemarks(app.getRemarks());
        response.setTotalProducts(app.getTotalProducts());
        response.setTotalCost(app.getTotalCost());
        response.setCreatedAt(app.getCreatedAt());
        
        // Fetch details reactively
        return detailRepository.findByApplicationId(app.getId())
                .map(detail -> {
                    AgrochemicalApplicationDetailResponse dto = new AgrochemicalApplicationDetailResponse();
                    dto.setId(detail.getId());
                    dto.setAgrochemicalId(detail.getAgrochemicalId());
                    dto.setAgrochemicalName(detail.getAgrochemicalName());
                    dto.setCategory(detail.getCategory());
                    dto.setAppliedDose(detail.getAppliedDose());
                    dto.setUnitMeasure(detail.getUnitMeasure());
                    dto.setTreatedAreaHectares(detail.getTreatedAreaHectares());
                    dto.setUnitCost(detail.getUnitCost());
                    dto.setTotalCost(detail.getTotalCost());
                    dto.setRemark(detail.getRemark());
                    return dto;
                })
                .collectList()
                .map(details -> {
                    response.setDetails(details);
                    return response;
                });
    }
}