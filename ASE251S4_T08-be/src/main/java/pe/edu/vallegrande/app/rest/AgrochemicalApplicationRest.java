package pe.edu.vallegrande.app.rest;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import pe.edu.vallegrande.app.dto.AgrochemicalApplicationRequest;
import pe.edu.vallegrande.app.dto.AgrochemicalApplicationResponse;
import pe.edu.vallegrande.app.service.AgrochemicalApplicationService;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@RestController
@RequestMapping("/v1/api/agrochemical-applications")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
@Tag(name = "Agrochemical Applications API", 
     description = "Transactional: agrochemical applications with header (SQL Server) + detail (SQL Server). " +
                   "Masters: agrochemicals from MongoDB. Reactive with Spring WebFlux.")
public class AgrochemicalApplicationRest {

    private final AgrochemicalApplicationService service;

    @GetMapping
    @Operation(
        summary = "List all active applications",
        description = "Returns all active agrochemical applications with their header and detail lines, " +
                      "ordered from most recent to oldest."
    )
    public Flux<AgrochemicalApplicationResponse> listAll() {
        return service.listAll();
    }

    @GetMapping("/{id}")
    @Operation(
        summary = "Get application by ID",
        description = "Returns the header and complete detail of a specific agrochemical application."
    )
    public Mono<AgrochemicalApplicationResponse> findById(@PathVariable Long id) {
        return service.findById(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(
        summary = "Create new agrochemical application",
        description = """
            Registers a new agrochemical application with header and detail in a single reactive operation.
            - Validates active agrochemicals in MongoDB
            - Validates applied doses against maximum recommended doses
            - Calculates total cost
            - Saves header and detail in SQL Server (R2DBC)
            
            Request body example:
            {
              "fieldName": "Campo Norte",
              "areaHectares": 5.5,
              "applicationDate": "2026-10-01",
              "responsible": "Juan Pérez",
              "temperatureCelsius": 22.5,
              "humidityPercentage": 65,
              "windConditions": "LIGHT",
              "remarks": "Aplicación preventiva",
              "details": [
                { 
                  "agrochemicalId": "<ObjectId from MongoDB>", 
                  "appliedDose": 1.5, 
                  "unitMeasure": "L/ha",
                  "treatedAreaHectares": 5.5,
                  "remark": "optional" 
                }
              ]
            }
            """
    )
    public Mono<AgrochemicalApplicationResponse> create(@RequestBody AgrochemicalApplicationRequest request) {
        return service.create(request);
    }

    @PutMapping("/{id}")
    @Operation(
        summary = "Edit existing application",
        description = """
            Modifies an existing agrochemical application: updates the header and replaces all details.
            - Validates active agrochemicals in MongoDB
            - Validates applied doses against maximum recommended doses
            - Recalculates total cost
            - COMPLETED or CANCELLED applications cannot be edited
            
            Request body example:
            {
              "fieldName": "Campo Norte",
              "areaHectares": 5.5,
              "applicationDate": "2026-10-01",
              "responsible": "Juan Pérez",
              "temperatureCelsius": 22.5,
              "humidityPercentage": 65,
              "windConditions": "MODERATE",
              "remarks": "Aplicación modificada",
              "details": [
                { 
                  "agrochemicalId": "<ObjectId from MongoDB>", 
                  "appliedDose": 2.0, 
                  "unitMeasure": "L/ha",
                  "treatedAreaHectares": 5.5,
                  "remark": "optional" 
                }
              ]
            }
            """
    )
    public Mono<AgrochemicalApplicationResponse> edit(
            @PathVariable Long id,
            @RequestBody AgrochemicalApplicationRequest request) {
        return service.edit(id, request);
    }
}