package com.housinginsights.market.api;

import com.housinginsights.market.api.schema.HealthResponse;
import com.housinginsights.market.data.PropertyDataset;
import org.springframework.web.bind.annotation.GetMapping;

@MarketApiController
public class HealthController {
    private final PropertyDataset dataset;

    public HealthController(PropertyDataset dataset) {
        this.dataset = dataset;
    }

    @GetMapping("/health")
    public HealthResponse health() {
        if (dataset.properties().isEmpty()) {
            throw new IllegalStateException("market dataset is unavailable");
        }
        return new HealthResponse("ok");
    }
}
