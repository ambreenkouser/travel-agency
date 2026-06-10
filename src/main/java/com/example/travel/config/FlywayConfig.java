package com.example.travel.config;

import jakarta.annotation.PostConstruct;
import org.flywaydb.core.Flyway;
import org.springframework.beans.factory.annotation.Value;
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

    @PostConstruct
    public void migrateFlyway() {
        // Build clean JDBC URL - no credentials embedded, no broken segments
        String url = "jdbc:postgresql://"
                + dbHost.trim()
                + "/" + dbName.trim()
                + "?sslmode=require";

        System.out.println(">>> FlywayConfig: connecting to host = [" + dbHost.trim() + "]");
        System.out.println(">>> FlywayConfig: username = [" + username.trim() + "]");
        System.out.println(">>> FlywayConfig: url = [" + url + "]");

        Flyway flyway = Flyway.configure()
                .dataSource(url, username.trim(), password.trim())
                .baselineOnMigrate(true)
                .load();

        flyway.migrate();
    }
}
