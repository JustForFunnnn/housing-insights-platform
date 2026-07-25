package com.housinginsights.market.domain;

import com.fasterxml.jackson.annotation.JsonValue;
import com.housinginsights.market.error.InvalidRequestException;
import java.util.Arrays;
import java.util.Comparator;

public enum SortField {
    ID(PropertyFieldNames.ID, Comparator.comparingLong(PropertyRecord::id)),
    SQUARE_FOOTAGE(
            PropertyFieldNames.SQUARE_FOOTAGE,
            Comparator.comparingDouble(PropertyRecord::squareFootage)
    ),
    BEDROOMS(PropertyFieldNames.BEDROOMS, Comparator.comparingInt(PropertyRecord::bedrooms)),
    BATHROOMS(PropertyFieldNames.BATHROOMS, Comparator.comparingDouble(PropertyRecord::bathrooms)),
    YEAR_BUILT(PropertyFieldNames.YEAR_BUILT, Comparator.comparingInt(PropertyRecord::yearBuilt)),
    LOT_SIZE(PropertyFieldNames.LOT_SIZE, Comparator.comparingDouble(PropertyRecord::lotSize)),
    DISTANCE_TO_CITY_CENTER(
            PropertyFieldNames.DISTANCE_TO_CITY_CENTER,
            Comparator.comparingDouble(PropertyRecord::distanceToCityCenter)
    ),
    SCHOOL_RATING(
            PropertyFieldNames.SCHOOL_RATING,
            Comparator.comparingDouble(PropertyRecord::schoolRating)
    ),
    PRICE(PropertyFieldNames.PRICE, Comparator.comparingLong(PropertyRecord::price));

    private final String value;
    private final Comparator<PropertyRecord> comparator;

    SortField(String value, Comparator<PropertyRecord> comparator) {
        this.value = value;
        this.comparator = comparator;
    }

    @JsonValue
    public String value() {
        return value;
    }

    public Comparator<PropertyRecord> comparator() {
        return comparator;
    }

    public static SortField parse(String value) {
        return Arrays.stream(values())
                .filter(field -> field.value.equals(value))
                .findFirst()
                .orElseThrow(() -> new InvalidRequestException("unsupported sort field"));
    }
}
