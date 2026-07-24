package com.housinginsights.market.domain;

import com.fasterxml.jackson.annotation.JsonValue;
import com.housinginsights.market.support.error.InvalidRequestException;
import java.util.Arrays;
import java.util.Comparator;

public enum SortField {
    ID("id", Comparator.comparingLong(PropertyRecord::id)),
    SQUARE_FOOTAGE(
            "square_footage",
            Comparator.comparingDouble(PropertyRecord::squareFootage)
    ),
    BEDROOMS("bedrooms", Comparator.comparingInt(PropertyRecord::bedrooms)),
    BATHROOMS("bathrooms", Comparator.comparingDouble(PropertyRecord::bathrooms)),
    YEAR_BUILT("year_built", Comparator.comparingInt(PropertyRecord::yearBuilt)),
    LOT_SIZE("lot_size", Comparator.comparingDouble(PropertyRecord::lotSize)),
    DISTANCE_TO_CITY_CENTER(
            "distance_to_city_center",
            Comparator.comparingDouble(PropertyRecord::distanceToCityCenter)
    ),
    SCHOOL_RATING(
            "school_rating",
            Comparator.comparingDouble(PropertyRecord::schoolRating)
    ),
    PRICE("price", Comparator.comparingLong(PropertyRecord::price));

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
