package com.housinginsights.market.metadata;

import com.housinginsights.market.error.InvalidRequestException;
import java.math.BigDecimal;

public record PropertyFieldMetadata(BigDecimal min, BigDecimal max, String unit) {
    public PropertyFieldMetadata {
        if (min != null && max != null && min.compareTo(max) > 0) {
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
        if (min != null && number.compareTo(min) < 0) {
            throw new InvalidRequestException(
                    name + " is outside the supported range");
        }
        if (max != null && number.compareTo(max) > 0) {
            throw new InvalidRequestException(
                    name + " is outside the supported range");
        }
    }
}
