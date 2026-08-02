package com.housinginsights.market.domain;

import com.fasterxml.jackson.annotation.JsonValue;
import com.housinginsights.market.error.InvalidRequestException;
import java.util.Arrays;
import java.util.Comparator;

public enum SortField {
    ID(PropertyFieldNames.ID, Comparator.comparingLong(Property::id)),
    SQUARE_FOOTAGE(PropertyFieldNames.SQUARE_FOOTAGE, Comparator.comparingDouble(Property::squareFootage)),
    BEDROOMS(PropertyFieldNames.BEDROOMS, Comparator.comparingInt(Property::bedrooms)),
    BATHROOMS(PropertyFieldNames.BATHROOMS, Comparator.comparingDouble(Property::bathrooms)),
    YEAR_BUILT(PropertyFieldNames.YEAR_BUILT, Comparator.comparingInt(Property::yearBuilt)),
    LOT_SIZE(PropertyFieldNames.LOT_SIZE, Comparator.comparingDouble(Property::lotSize)),
    DISTANCE_TO_CITY_CENTER(
            PropertyFieldNames.DISTANCE_TO_CITY_CENTER, Comparator.comparingDouble(Property::distanceToCityCenter)),
    SCHOOL_RATING(PropertyFieldNames.SCHOOL_RATING, Comparator.comparingDouble(Property::schoolRating)),
    PRICE(PropertyFieldNames.PRICE, Comparator.comparingLong(Property::price));

    private final String value;
    private final Comparator<Property> comparator;

    SortField(String value, Comparator<Property> comparator) {
        this.value = value;
        this.comparator = comparator;
    }

    @JsonValue
    public String value() {
        return value;
    }

    public Comparator<Property> comparator() {
        return comparator;
    }

    public static SortField parse(String value) {
        return Arrays.stream(values())
                .filter(field -> field.value.equals(value))
                .findFirst()
                .orElseThrow(() -> new InvalidRequestException("unsupported sort field"));
    }
}
