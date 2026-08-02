package com.housinginsights.market.application;

import com.housinginsights.market.domain.PropertyFeatures;
import com.housinginsights.market.domain.WhatIfResult;
import com.housinginsights.market.domain.WhatIfResult.ScenarioComparison;
import com.housinginsights.market.error.PredictionServiceInvalidResponseException;
import com.housinginsights.market.prediction.PredictionClient;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class WhatIfService {
    private final PredictionClient predictionClient;

    public WhatIfService(PredictionClient predictionClient) {
        this.predictionClient = predictionClient;
    }

    public WhatIfResult compare(PropertyFeatures baseline, List<PropertyFeatures> scenarios) {
        List<PropertyFeatures> batch = new ArrayList<>(scenarios.size() + 1);
        batch.add(baseline);
        batch.addAll(scenarios);

        List<Long> predictions = predictionClient.predict(batch);
        if (predictions.size() != batch.size()) {
            throw new PredictionServiceInvalidResponseException(
                    "prediction service returned the wrong number of predictions");
        }

        long baselinePrediction = predictions.getFirst();
        List<ScenarioComparison> comparisons = predictions.subList(1, predictions.size()).stream()
                .map(prediction -> scenarioResult(baselinePrediction, prediction))
                .toList();
        return new WhatIfResult(baselinePrediction, comparisons);
    }

    private static ScenarioComparison scenarioResult(long baseline, long prediction) {
        long difference = prediction - baseline;
        BigDecimal percentage = BigDecimal.valueOf(difference)
                .multiply(BigDecimal.valueOf(100))
                .divide(BigDecimal.valueOf(baseline), 2, RoundingMode.HALF_UP);
        return new ScenarioComparison(prediction, difference, percentage);
    }
}
