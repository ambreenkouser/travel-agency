package com.example.travel.config;

import org.flywaydb.core.Flyway;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.flyway.FlywayMigrationStrategy;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;

@Configuration
@Profile("prod")
public class FlywayConfig {

    @Value("${DB_HOST}")
    private String dbHost;

    @Value("${DB_NAME:neondb}")
    private String dbName;

    @Value("${DB_USERNAME}")
    private String username;

    @Value("${DB_PASSWORD}")
    private String password;

    @Bean
    public FlywayMigrationStrategy flywayMigrationStrategy() {
        return flyway -> {
            // Build a clean JDBC URL without embedded credentials
            // Standard JDBC format: jdbc:postgresql://host/dbname?params
            String cleanUrl = "jdbc:postgresql://" + dbHost + "/" + dbName + "?sslmode=require";

            Flyway configuredFlyway = Flyway.configure()
                    .dataSource(cleanUrl, username, password)
                    .baselineOnMigrate(true)
                    .load();
            configuredFlyway.migrate();
        };
    }
}
