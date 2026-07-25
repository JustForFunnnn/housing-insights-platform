package com.housinginsights.market.api.schema;

import com.housinginsights.market.api.MarketQueryParameters;
import com.housinginsights.market.domain.MarketFilter;
import com.housinginsights.market.domain.PropertyLimits;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Positive;
import java.time.Year;
import java.util.List;
import java.util.TreeSet;
import org.springframework.web.bind.annotation.BindParam;

public record MarketFilterRequest(
        @BindParam(MarketQueryParameters.MIN_SQUARE_FOOTAGE)
        @Positive
        @DecimalMax(PropertyLimits.MAX_SQUARE_FOOTAGE_TEXT)
        Double minSquareFootage,

        @BindParam(MarketQueryParameters.MAX_SQUARE_FOOTAGE)
        @Positive
        @DecimalMax(PropertyLimits.MAX_SQUARE_FOOTAGE_TEXT)
        Double maxSquareFootage,

        @BindParam(MarketQueryParameters.BEDROOMS) List<@Min(0) @Max(PropertyLimits.MAX_BEDROOMS) Integer> bedrooms,

        @BindParam(MarketQueryParameters.BATHROOMS)
        List<@DecimalMin("0") @DecimalMax(PropertyLimits.MAX_BATHROOMS_TEXT) Double> bathrooms,

        @BindParam(MarketQueryParameters.MIN_YEAR_BUILT) @Min(PropertyLimits.MIN_YEAR_BUILT)
        Integer minYearBuilt,

        @BindParam(MarketQueryParameters.MAX_YEAR_BUILT) @Min(PropertyLimits.MIN_YEAR_BUILT)
        Integer maxYearBuilt,

        @BindParam(MarketQueryParameters.MIN_LOT_SIZE) @Positive @DecimalMax(PropertyLimits.MAX_LOT_SIZE_TEXT)
        Double minLotSize,

        @BindParam(MarketQueryParameters.MAX_LOT_SIZE) @Positive @DecimalMax(PropertyLimits.MAX_LOT_SIZE_TEXT)
        Double maxLotSize,

        @BindParam(MarketQueryParameters.MIN_DISTANCE_TO_CITY_CENTER)
        @DecimalMin("0")
        @DecimalMax(PropertyLimits.MAX_DISTANCE_TO_CITY_CENTER_TEXT)
        Double minDistanceToCityCenter,

        @BindParam(MarketQueryParameters.MAX_DISTANCE_TO_CITY_CENTER)
        @DecimalMin("0")
        @DecimalMax(PropertyLimits.MAX_DISTANCE_TO_CITY_CENTER_TEXT)
        Double maxDistanceToCityCenter,

        @BindParam(MarketQueryParameters.MIN_SCHOOL_RATING)
        @DecimalMin("0")
        @DecimalMax(PropertyLimits.MAX_SCHOOL_RATING_TEXT)
        Double minSchoolRating,

        @BindParam(MarketQueryParameters.MAX_SCHOOL_RATING)
        @DecimalMin("0")
        @DecimalMax(PropertyLimits.MAX_SCHOOL_RATING_TEXT)
        Double maxSchoolRating,

        @BindParam(MarketQueryParameters.MIN_PRICE) @Positive
        Long minPrice,

        @BindParam(MarketQueryParameters.MAX_PRICE) @Positive
        Long maxPrice) {
    public MarketFilterRequest {
        bedrooms = bedrooms == null ? List.of() : List.copyOf(bedrooms);
        bathrooms = bathrooms == null ? List.of() : List.copyOf(bathrooms);
    }

    public MarketFilter toFilter() {
        return new MarketFilter(
                minSquareFootage,
                maxSquareFootage,
                new TreeSet<>(bedrooms),
                new TreeSet<>(bathrooms),
                minYearBuilt,
                maxYearBuilt,
                minLotSize,
                maxLotSize,
                minDistanceToCityCenter,
                maxDistanceToCityCenter,
                minSchoolRating,
                maxSchoolRating,
                minPrice,
                maxPrice);
    }

    @AssertTrue(message = "filter ranges must be valid")
    public boolean isValid() {
        return finite(minSquareFootage)
                && finite(maxSquareFootage)
                && bathrooms.stream().allMatch(MarketFilterRequest::finite)
                && finite(minLotSize)
                && finite(maxLotSize)
                && finite(minDistanceToCityCenter)
                && finite(maxDistanceToCityCenter)
                && finite(minSchoolRating)
                && finite(maxSchoolRating)
                && ordered(minSquareFootage, maxSquareFootage)
                && ordered(minYearBuilt, maxYearBuilt)
                && ordered(minLotSize, maxLotSize)
                && ordered(minDistanceToCityCenter, maxDistanceToCityCenter)
                && ordered(minSchoolRating, maxSchoolRating)
                && ordered(minPrice, maxPrice)
                && (minYearBuilt == null || minYearBuilt <= Year.now().getValue())
                && (maxYearBuilt == null || maxYearBuilt <= Year.now().getValue());
    }

    private static boolean finite(Double value) {
        return value == null || Double.isFinite(value);
    }

    private static <T extends Comparable<T>> boolean ordered(T minimum, T maximum) {
        return minimum == null || maximum == null || minimum.compareTo(maximum) <= 0;
    }
}
