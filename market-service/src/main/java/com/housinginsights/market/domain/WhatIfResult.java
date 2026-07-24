package com.housinginsights.market.domain;

import java.math.BigDecimal;
import java.util.List;

public record WhatIfResult(
        long baselinePrediction,
        List<ScenarioResult> scenarios
) {
    public WhatIfResult {
        scenarios = List.copyOf(scenarios);
    }

    public record ScenarioResult(
            long predictedPrice,
            long priceDifference,
            BigDecimal percentageDifference
    ) {
    }
}
