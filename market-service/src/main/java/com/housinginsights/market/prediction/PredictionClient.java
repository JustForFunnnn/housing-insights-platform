package com.housinginsights.market.prediction;

import com.housinginsights.market.domain.PropertyFeatures;
import java.util.List;

public interface PredictionClient {
    List<Long> predict(List<PropertyFeatures> properties);
}
