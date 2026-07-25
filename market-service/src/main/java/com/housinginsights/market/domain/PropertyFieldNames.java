package com.housinginsights.market.domain;

import java.util.List;

public final class PropertyFieldNames {
    public static final String ID = "id";
    public static final String SQUARE_FOOTAGE = "square_footage";
    public static final String BEDROOMS = "bedrooms";
    public static final String BATHROOMS = "bathrooms";
    public static final String YEAR_BUILT = "year_built";
    public static final String LOT_SIZE = "lot_size";
    public static final String DISTANCE_TO_CITY_CENTER = "distance_to_city_center";
    public static final String SCHOOL_RATING = "school_rating";
    public static final String PRICE = "price";

    public static final List<String> FEATURE_COLUMNS = List.of(
            SQUARE_FOOTAGE,
            BEDROOMS,
            BATHROOMS,
            YEAR_BUILT,
            LOT_SIZE,
            DISTANCE_TO_CITY_CENTER,
            SCHOOL_RATING);

    public static final List<String> METADATA_FIELDS = List.of(
            SQUARE_FOOTAGE,
            BEDROOMS,
            BATHROOMS,
            YEAR_BUILT,
            LOT_SIZE,
            DISTANCE_TO_CITY_CENTER,
            SCHOOL_RATING,
            PRICE);

    public static final List<String> CSV_COLUMNS = List.of(
            ID,
            SQUARE_FOOTAGE,
            BEDROOMS,
            BATHROOMS,
            YEAR_BUILT,
            LOT_SIZE,
            DISTANCE_TO_CITY_CENTER,
            SCHOOL_RATING,
            PRICE);

    private PropertyFieldNames() {}
}
