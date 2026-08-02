package com.housinginsights.market.api.schema;

import com.housinginsights.market.metadata.PropertyFeatureMetadata;
import java.math.BigDecimal;

public record FeatureMetadata(BigDecimal min, BigDecimal max, String unit) {
    public static FeatureMetadata from(PropertyFeatureMetadata metadata) {
        return new FeatureMetadata(metadata.min(), metadata.max(), metadata.unit());
    }
}
