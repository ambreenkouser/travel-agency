/*
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
        String host = dbHost.trim();
        String endpointId = host.split("\\.")[0];
        String user = username.trim();
        String pass = password.trim();

        // Neon requires endpoint ID in password field as workaround for SNI
        // Format: endpoint=<endpoint_id>;<password>
        // This is the official Neon workaround documented at neon.com/docs/connect/connection-errors
        String neonPassword = "endpoint=" + endpointId + ";" + pass;

        String url = "jdbc:postgresql://"
                + host
                + "/" + dbName.trim()
                + "?sslmode=require";

        System.out.println(">>> Flyway connecting to: " + url);
        System.out.println(">>> Flyway user: " + user);
        System.out.println(">>> Flyway endpointId: " + endpointId);

        Flyway flyway = Flyway.configure()
                .dataSource(url, user, neonPassword)
                .baselineOnMigrate(true)
                .load();

        flyway.migrate();
        System.out.println(">>> Flyway migration complete!");
    }
}*/
