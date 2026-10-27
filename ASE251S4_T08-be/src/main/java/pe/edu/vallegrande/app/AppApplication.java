package pe.edu.vallegrande.app;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.mongodb.repository.config.EnableReactiveMongoRepositories;
import org.springframework.data.r2dbc.repository.config.EnableR2dbcRepositories;

@SpringBootApplication
@EnableReactiveMongoRepositories(basePackages = "pe.edu.vallegrande.app.repository.mongo")
@EnableR2dbcRepositories(basePackages = "pe.edu.vallegrande.app.repository.r2dbc")
public class AppApplication {

	public static void main(String[] args) {
		SpringApplication.run(AppApplication.class, args);
	}
}
