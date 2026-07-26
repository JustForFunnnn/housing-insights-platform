package com.housinginsights.market.api.schema;

import com.housinginsights.market.metadata.PropertyFeatureMetadata;
import java.math.BigDecimal;

public record PropertyFeatureMetadataResponse(BigDecimal min, BigDecimal max, String unit) {
    public static PropertyFeatureMetadataResponse from(PropertyFeatureMetadata metadata) {
        return new PropertyFeatureMetadataResponse(metadata.min(), metadata.max(), metadata.unit());
    }
}
