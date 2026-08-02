package com.housinginsights.market.application;

import static org.assertj.core.api.Assertions.assertThat;

import com.housinginsights.market.domain.PropertyFeatures;
import com.housinginsights.market.domain.WhatIfResult;
import com.housinginsights.market.prediction.PredictionClient;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import org.junit.jupiter.api.Test;

class WhatIfServiceTest {
    @Test
    void sendsOneOrderedBatchAndCalculatesDifferences() {
        CapturingPredictionClient client = new CapturingPredictionClient(List.of(200000L, 250000L, 150000L));
        WhatIfService service = new WhatIfService(client);
        PropertyFeatures baseline = features(1500);
        List<PropertyFeatures> scenarios = List.of(features(1800), features(1200));

        WhatIfResult result = service.compare(baseline, scenarios);

        assertThat(client.calls).hasSize(1);
        assertThat(client.calls.getFirst()).containsExactly(baseline, scenarios.get(0), scenarios.get(1));
        assertThat(result.baselinePrediction()).isEqualTo(200000);
        assertThat(result.scenarios().get(0).priceDifference()).isEqualTo(50000);
        assertThat(result.scenarios().get(0).percentageDifference()).isEqualByComparingTo(new BigDecimal("25.00"));
        assertThat(result.scenarios().get(1).priceDifference()).isEqualTo(-50000);
    }

    private static PropertyFeatures features(double squareFootage) {
        return new PropertyFeatures(squareFootage, 3, 2, 2000, 7000, 5, 8);
    }

    private static final class CapturingPredictionClient implements PredictionClient {
        private final List<Long> predictions;
        private final List<List<PropertyFeatures>> calls = new ArrayList<>();

        private CapturingPredictionClient(List<Long> predictions) {
            this.predictions = predictions;
        }

        @Override
        public List<Long> predict(List<PropertyFeatures> properties) {
            calls.add(List.copyOf(properties));
            return predictions;
        }
    }
}
