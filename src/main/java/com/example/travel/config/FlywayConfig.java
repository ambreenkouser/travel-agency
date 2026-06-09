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

    @Value("${spring.flyway.clean-url:${DATABASE_URL}}")
    private String flywayUrl;

    @Value("${spring.datasource.username}")
    private String username;

    @Value("${spring.datasource.password}")
    private String password;

    @Bean
    public FlywayMigrationStrategy flywayMigrationStrategy() {
        return flyway -> {
            String cleanUrl = buildCleanUrl(flywayUrl);
            Flyway configuredFlyway = Flyway.configure()
                    .dataSource(cleanUrl, username, password)
                    .baselineOnMigrate(true)
                    .repairOnMigrate(true)
                    .load();
            configuredFlyway.migrate();
        };
    }

    private String buildCleanUrl(String url) {
        // Remove .c-2 (or any .c-N) regional routing segment that breaks JDBC parser
        // e.g. ep-xxx.c-2.ap-southeast-1.aws.neon.tech -> ep-xxx.ap-southeast-1.aws.neon.tech
        return url.replaceAll("\\.c-\\d+\\.aws\\.neon\\.tech", ".aws.neon.tech")
                .replaceAll("&channel_binding=require", "")
                .replaceAll("-pooler", "");
    }
}
