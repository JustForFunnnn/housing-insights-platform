package com.housinginsights.market.api.schema;

import com.housinginsights.market.metadata.PropertyFieldMetadata;
import java.math.BigDecimal;

public record PropertyFieldMetadataResponse(
        BigDecimal min, BigDecimal max, String unit) {
    public static PropertyFieldMetadataResponse from(PropertyFieldMetadata metadata) {
        return new PropertyFieldMetadataResponse(
                metadata.min(), metadata.max(), metadata.unit());
    }
}
