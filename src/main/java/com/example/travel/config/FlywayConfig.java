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

    @Value("${DATABASE_URL}")
    private String databaseUrl;

    @Value("${DB_USERNAME}")
    private String username;

    @Value("${DB_PASSWORD}")
    private String password;

    @Bean
    public FlywayMigrationStrategy flywayMigrationStrategy() {
        return flyway -> {
            String cleanUrl = buildCleanUrl(databaseUrl);
            Flyway configuredFlyway = Flyway.configure()
                    .dataSource(cleanUrl, username, password)
                    .baselineOnMigrate(true)
                    .load();
            configuredFlyway.migrate();
        };
    }

    /**
     * Cleans Neon URLs for JDBC compatibility:
     * - Removes .c-2 (or any .c-N) regional routing segment
     * - Removes -pooler suffix
     * - Removes &channel_binding=require parameter
     *
     * e.g. ep-xxx-pooler.c-2.ap-southeast-1.aws.neon.tech
     *   -> ep-xxx.ap-southeast-1.aws.neon.tech
     */
    private String buildCleanUrl(String url) {
        return url.replaceAll("\\.c-\\d+\\.ap-", ".ap-")
                .replaceAll("&channel_binding=require", "")
                .replaceAll("-pooler", "");
    }
}