package com.housinginsights.market.api;

import com.housinginsights.market.domain.DomainLimits;
import com.housinginsights.market.domain.MarketFilter;
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
        @BindParam("min_square_footage")
        @Positive @DecimalMax("100000") Double minSquareFootage,

        @BindParam("max_square_footage")
        @Positive @DecimalMax("100000") Double maxSquareFootage,

        List<@Min(0) @Max(10000) Integer> bedrooms,

        List<@DecimalMin("0") @DecimalMax("10000") Double> bathrooms,

        @BindParam("min_year_built")
        @Min(1800) Integer minYearBuilt,

        @BindParam("max_year_built")
        @Min(1800) Integer maxYearBuilt,

        @BindParam("min_lot_size")
        @Positive @DecimalMax("100000") Double minLotSize,

        @BindParam("max_lot_size")
        @Positive @DecimalMax("100000") Double maxLotSize,

        @BindParam("min_distance_to_city_center")
        @DecimalMin("0") @DecimalMax("400") Double minDistanceToCityCenter,

        @BindParam("max_distance_to_city_center")
        @DecimalMin("0") @DecimalMax("400") Double maxDistanceToCityCenter,

        @BindParam("min_school_rating")
        @DecimalMin("0") @DecimalMax("10") Double minSchoolRating,

        @BindParam("max_school_rating")
        @DecimalMin("0") @DecimalMax("10") Double maxSchoolRating,

        @BindParam("min_price")
        @Positive Long minPrice,

        @BindParam("max_price")
        @Positive Long maxPrice
) {
    public MarketFilterRequest {
        bedrooms = bedrooms == null ? List.of() : List.copyOf(bedrooms);
        bathrooms = bathrooms == null ? List.of() : List.copyOf(bathrooms);
    }

    public MarketFilter toDomain() {
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
                maxPrice
        );
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
                && ordered(
                        minDistanceToCityCenter,
                        maxDistanceToCityCenter
                )
                && ordered(minSchoolRating, maxSchoolRating)
                && ordered(minPrice, maxPrice)
                && (minYearBuilt == null
                || minYearBuilt <= Year.now().getValue())
                && (maxYearBuilt == null
                || maxYearBuilt <= Year.now().getValue());
    }

    private static boolean finite(Double value) {
        return value == null || Double.isFinite(value);
    }

    private static <T extends Comparable<T>> boolean ordered(
            T minimum,
            T maximum
    ) {
        return minimum == null
                || maximum == null
                || minimum.compareTo(maximum) <= 0;
    }
}
