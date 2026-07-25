package com.housinginsights.market.domain;

public final class PropertyLimits {
    public static final String MAX_SQUARE_FOOTAGE_TEXT = "100000";
    public static final double MAX_SQUARE_FOOTAGE = Double.parseDouble(MAX_SQUARE_FOOTAGE_TEXT);
    public static final int MAX_BEDROOMS = 10_000;
    public static final String MAX_BATHROOMS_TEXT = "10000";
    public static final double MAX_BATHROOMS = Double.parseDouble(MAX_BATHROOMS_TEXT);
    public static final String MAX_LOT_SIZE_TEXT = "100000";
    public static final double MAX_LOT_SIZE = Double.parseDouble(MAX_LOT_SIZE_TEXT);
    public static final String MAX_DISTANCE_TO_CITY_CENTER_TEXT = "400";
    public static final double MAX_DISTANCE_TO_CITY_CENTER = Double.parseDouble(MAX_DISTANCE_TO_CITY_CENTER_TEXT);
    public static final String MAX_SCHOOL_RATING_TEXT = "10";
    public static final double MAX_SCHOOL_RATING = Double.parseDouble(MAX_SCHOOL_RATING_TEXT);
    public static final int MIN_YEAR_BUILT = 1800;

    private PropertyLimits() {}
}
