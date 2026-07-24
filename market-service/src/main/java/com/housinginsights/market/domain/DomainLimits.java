package com.housinginsights.market.domain;

public final class DomainLimits {
    public static final double MAX_SQUARE_FOOTAGE = 100_000.0;
    public static final int MAX_BEDROOMS = 10_000;
    public static final double MAX_BATHROOMS = 10_000.0;
    public static final double MAX_LOT_SIZE = 100_000.0;
    public static final double MAX_DISTANCE_TO_CITY_CENTER = 400.0;
    public static final double MAX_SCHOOL_RATING = 10.0;
    public static final int MIN_YEAR_BUILT = 1800;
    public static final int MAX_PROPERTY_PAGE_SIZE = 100;
    public static final int MAX_WHAT_IF_SCENARIOS = 19;

    private DomainLimits() {
    }
}
