package com.housinginsights.market.api.schema;

import com.housinginsights.market.domain.WhatIfResult;
import java.math.BigDecimal;
import java.util.List;

public record WhatIfResponse(long baselinePrediction, List<ScenarioComparison> scenarios) {
    public WhatIfResponse {
        scenarios = List.copyOf(scenarios);
    }

    public static WhatIfResponse from(WhatIfResult result) {
        return new WhatIfResponse(
                result.baselinePrediction(),
                result.scenarios().stream().map(ScenarioComparison::from).toList());
    }

    public record ScenarioComparison(long predictedPrice, long priceDifference, BigDecimal percentageDifference) {
        private static ScenarioComparison from(WhatIfResult.ScenarioComparison scenario) {
            return new ScenarioComparison(
                    scenario.predictedPrice(), scenario.priceDifference(), scenario.percentageDifference());
        }
    }
}
