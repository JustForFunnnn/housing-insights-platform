package com.housinginsights.market.config;

import jakarta.validation.Valid;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.NotNull;
import java.net.URI;
import java.nio.file.Path;
import java.time.Duration;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

@Validated
@ConfigurationProperties(prefix = "market")
public record MarketProperties(
        @NotNull Path datasetPath, @NotNull @Valid Prediction prediction) {
    public record Prediction(@NotNull URI baseUrl, @NotNull Duration timeout) {
        @AssertTrue(message = "prediction base URL must use HTTP or HTTPS")
        public boolean isHttpUrl() {
            return baseUrl != null
                    && baseUrl.isAbsolute()
                    && baseUrl.getHost() != null
                    && ("http".equalsIgnoreCase(baseUrl.getScheme()) || "https".equalsIgnoreCase(baseUrl.getScheme()));
        }

        @AssertTrue(message = "prediction timeout must be positive")
        public boolean isTimeoutPositive() {
            return timeout != null && !timeout.isZero() && !timeout.isNegative();
        }
    }
}
