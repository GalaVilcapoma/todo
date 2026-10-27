package pe.edu.vallegrande.app.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.List;

/**
 * Garantiza la existencia de la base de datos única y de sus colecciones
 * al arrancar la aplicación (se crean automáticamente si no existen).
 */
@Slf4j
@Component
public class MongoDatabaseInitializer implements ApplicationRunner {

    private static final List<String> COLLECTIONS =
            List.of("agrochemicals", "products", "customers");

    private final ReactiveMongoTemplate mongoTemplate;

    public MongoDatabaseInitializer(ReactiveMongoTemplate mongoTemplate) {
        this.mongoTemplate = mongoTemplate;
    }

    @Override
    public void run(ApplicationArguments args) {
        mongoTemplate.getMongoDatabaseFactory().getMongoDatabase()
                .doOnNext(db -> log.info("🔧 Verificando base de datos '{}'...", db.getName()))
                .thenMany(createCollections())
                .doOnNext(msg -> log.info("✅ Colección {} en disposición", msg))
                .blockLast();
    }

    private Flux<String> createCollections() {
        return Flux.fromIterable(COLLECTIONS)
                .flatMap(name -> mongoTemplate.collectionExists(name)
                        .flatMap(exists -> exists
                                ? Mono.just(name + " (ya existe)")
                                : mongoTemplate.createCollection(name).then(Mono.just(name + " (creada)"))));
    }
}