package com.housinginsights.market.domain;

import com.fasterxml.jackson.annotation.JsonValue;
import com.housinginsights.market.support.error.InvalidRequestException;

public enum SortDirection {
    ASC("asc"),
    DESC("desc");

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
