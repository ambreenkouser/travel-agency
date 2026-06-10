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
        // Extract endpoint ID from host (everything before the first dot)
        // e.g. ep-billowing-star-ao2e6beq.ap-southeast-1.aws.neon.tech -> ep-billowing-star-ao2e6beq
        String endpointId = dbHost.trim().split("\\.")[0];

        // Neon requires endpoint ID passed as options parameter for SNI routing
        // Without this, Neon cannot identify the compute and returns "password auth failed"
        String url = "jdbc:postgresql://"
                + dbHost.trim()
                + "/" + dbName.trim()
                + "?sslmode=require"
                + "&options=endpoint%3D" + endpointId;

        System.out.println(">>> FlywayConfig URL: " + url);
        System.out.println(">>> FlywayConfig user: " + username.trim());

        Flyway flyway = Flyway.configure()
                .dataSource(url, username.trim(), password.trim())
                .baselineOnMigrate(true)
                .load();

        flyway.migrate();
        System.out.println(">>> FlywayConfig: migration complete!");
    }
}