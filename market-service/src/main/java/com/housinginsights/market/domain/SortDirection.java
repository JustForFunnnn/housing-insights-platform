package com.housinginsights.market.domain;

import com.fasterxml.jackson.annotation.JsonValue;
import com.housinginsights.market.support.error.InvalidRequestException;

public enum SortDirection {
    ASC(SortDirection.ASC_VALUE),
    DESC(SortDirection.DESC_VALUE);

    public static final String ASC_VALUE = "asc";
    public static final String DESC_VALUE = "desc";

    private final String value;

    SortDirection(String value) {
        this.value = value;
    }

    @JsonValue
    public String value() {
        return value;
    }

    public static SortDirection parse(String value) {
        for (SortDirection direction : values()) {
            if (direction.value.equals(value)) {
                return direction;
            }
        }
        throw new InvalidRequestException("unsupported sort direction");
    }
}
