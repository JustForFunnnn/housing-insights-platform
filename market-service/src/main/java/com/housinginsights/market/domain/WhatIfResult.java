package com.housinginsights.market.domain;

import java.math.BigDecimal;
import java.util.List;

public record WhatIfResult(long baselinePrediction, List<ScenarioComparison> scenarios) {
    public WhatIfResult {
        scenarios = List.copyOf(scenarios);
    }

    public record ScenarioComparison(long predictedPrice, long priceDifference, BigDecimal percentageDifference) {}
}
