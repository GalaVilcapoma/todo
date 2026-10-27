package pe.edu.vallegrande.app.model;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Data
@Document(collection = "customers")
public class Customer {

    @Id
    private String id;

    private String code;

    private String businessName;

    private String ruc;

    private String documentType;

    private String documentNumber;

    private String country;

    private String city;

    private String address;

    private String phone;

    private String email;

    private String primaryContact;

    private String customerType;

    // "A" = Active | "I" = Inactive
    @Indexed(name = "idx_customers_state")
    private String state;

    private Boolean active;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime deletedAt;
    private LocalDateTime restoredAt;
}