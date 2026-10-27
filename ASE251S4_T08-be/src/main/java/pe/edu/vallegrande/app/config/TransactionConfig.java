package pe.edu.vallegrande.app.config;

import io.r2dbc.spi.ConnectionFactory;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.r2dbc.connection.R2dbcTransactionManager;
import org.springframework.transaction.annotation.EnableTransactionManagement;

/**
 * Delimita el alcance de las transacciones del proyecto.
 *
 * <p>Los datos maestros viven en MongoDB y los datos transaccionales en SQL Server.
 * Una transacción R2DBC NO puede abarcar una escritura en MongoDB, por lo que
 * {@code @Transactional} únicamente cubre la parte SQL Server. Las escrituras sobre
 * MongoDB se resuelven con actualizaciones atómicas de un solo documento y, cuando
 * participan en un flujo de varias bases de datos, con compensación explícita
 * (ver {@code ProductoStockService}).
 */
@Configuration
@EnableTransactionManagement
public class TransactionConfig {

    /**
     * Declara explícitamente el gestor transaccional de SQL Server como primario.
     * Boot lo autoconfigura igualmente, pero declararlo aquí deja el límite de la
     * transacción documentado en el código y evita depender del orden de auto-configuración.
     */
    @Bean
    @Primary
    public R2dbcTransactionManager transactionManager(ConnectionFactory connectionFactory) {
        return new R2dbcTransactionManager(connectionFactory);
    }
}
