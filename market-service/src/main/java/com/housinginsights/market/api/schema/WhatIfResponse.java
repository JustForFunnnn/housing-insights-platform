package com.housinginsights.market.api.schema;

import com.housinginsights.market.domain.WhatIfResult;
import java.math.BigDecimal;
import java.util.List;

public record WhatIfResponse(long baselinePrediction, List<ScenarioResponse> scenarios) {
    public WhatIfResponse {
        scenarios = List.copyOf(scenarios);
    }

    public static WhatIfResponse from(WhatIfResult result) {
        return new WhatIfResponse(
                result.baselinePrediction(),
                result.scenarios().stream().map(ScenarioResponse::from).toList());
    }

    public record ScenarioResponse(long predictedPrice, long priceDifference, BigDecimal percentageDifference) {
        private static ScenarioResponse from(WhatIfResult.ScenarioResult scenario) {
            return new ScenarioResponse(
                    scenario.predictedPrice(), scenario.priceDifference(), scenario.percentageDifference());
        }
    }
}
