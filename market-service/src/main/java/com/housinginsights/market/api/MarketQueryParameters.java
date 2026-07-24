package com.housinginsights.market.api;

import com.housinginsights.market.domain.PropertyFieldNames;
import com.housinginsights.market.domain.SortDirection;

public final class MarketQueryParameters {
    public static final String MIN_SQUARE_FOOTAGE = "min_" + PropertyFieldNames.SQUARE_FOOTAGE;
    public static final String MAX_SQUARE_FOOTAGE = "max_" + PropertyFieldNames.SQUARE_FOOTAGE;
    public static final String BEDROOMS = PropertyFieldNames.BEDROOMS;
    public static final String BATHROOMS = PropertyFieldNames.BATHROOMS;
    public static final String MIN_YEAR_BUILT = "min_" + PropertyFieldNames.YEAR_BUILT;
    public static final String MAX_YEAR_BUILT = "max_" + PropertyFieldNames.YEAR_BUILT;
    public static final String MIN_LOT_SIZE = "min_" + PropertyFieldNames.LOT_SIZE;
    public static final String MAX_LOT_SIZE = "max_" + PropertyFieldNames.LOT_SIZE;
    public static final String MIN_DISTANCE_TO_CITY_CENTER = "min_" + PropertyFieldNames.DISTANCE_TO_CITY_CENTER;
    public static final String MAX_DISTANCE_TO_CITY_CENTER = "max_" + PropertyFieldNames.DISTANCE_TO_CITY_CENTER;
    public static final String MIN_SCHOOL_RATING = "min_" + PropertyFieldNames.SCHOOL_RATING;
    public static final String MAX_SCHOOL_RATING = "max_" + PropertyFieldNames.SCHOOL_RATING;
    public static final String MIN_PRICE = "min_" + PropertyFieldNames.PRICE;
    public static final String MAX_PRICE = "max_" + PropertyFieldNames.PRICE;

    public static final String SORT_BY = "sort_by";
    public static final String SORT_DIRECTION = "sort_direction";
    public static final String LIMIT = "limit";
    public static final String OFFSET = "offset";

    public static final String DEFAULT_SORT_BY = PropertyFieldNames.ID;
    public static final String DEFAULT_SORT_DIRECTION = SortDirection.ASC_VALUE;
    public static final String DEFAULT_PAGE_LIMIT = "20";
    public static final String DEFAULT_PAGE_OFFSET = "0";

    private MarketQueryParameters() {
    }
}
