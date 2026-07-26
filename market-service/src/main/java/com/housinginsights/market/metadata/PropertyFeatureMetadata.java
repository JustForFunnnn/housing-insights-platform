package com.housinginsights.market.metadata;

import com.housinginsights.market.error.InvalidRequestException;
import java.math.BigDecimal;

public record PropertyFeatureMetadata(BigDecimal min, BigDecimal max, String unit) {
    public PropertyFeatureMetadata {
        if (min == null || max == null) {
            throw new IllegalArgumentException("min and max are required");
        }
        if (min.compareTo(max) > 0) {
            throw new IllegalArgumentException("min must not exceed max");
        }
    }

    void validate(String name, Number value) {
        BigDecimal number;
        try {
            number = new BigDecimal(value.toString());
        } catch (NumberFormatException exception) {
            throw new InvalidRequestException(name + " must be finite");
        }
        if (!Double.isFinite(value.doubleValue())) {
            throw new InvalidRequestException(name + " must be finite");
        }
        if (number.compareTo(min) < 0 || number.compareTo(max) > 0) {
            throw new InvalidRequestException(name + " is outside the supported range");
        }
    }
}
