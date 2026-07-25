package com.housinginsights.market.api.schema;

import com.housinginsights.market.domain.MarketFilter;
import com.housinginsights.market.metadata.PropertyMetadata;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import java.util.List;
import java.util.TreeSet;

public record MarketFilterRequest(
        @Positive Double minSquareFootage,
        @Positive Double maxSquareFootage,
        List<@NotNull Integer> bedrooms,
        List<@NotNull Double> bathrooms,
        Integer minYearBuilt,
        Integer maxYearBuilt,
        @Positive Double minLotSize,
        @Positive Double maxLotSize,
        Double minDistanceToCityCenter,
        Double maxDistanceToCityCenter,
        Double minSchoolRating,
        Double maxSchoolRating,
        @Positive Long minPrice,
        @Positive Long maxPrice) {
    public MarketFilterRequest {
        bedrooms = bedrooms == null ? List.of() : List.copyOf(bedrooms);
        bathrooms = bathrooms == null ? List.of() : List.copyOf(bathrooms);
    }

    public MarketFilter toFilter(PropertyMetadata propertyMetadata) {
        var filter = new MarketFilter(
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
        propertyMetadata.validate(filter);
        return filter;
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
                && positiveOrNull(minPrice)
                && positiveOrNull(maxPrice);
    }

    private static boolean finite(Double value) {
        return value == null || Double.isFinite(value);
    }

    private static <T extends Comparable<T>> boolean ordered(T minimum, T maximum) {
        return minimum == null || maximum == null || minimum.compareTo(maximum) <= 0;
    }

    private static boolean positiveOrNull(Long value) {
        return value == null || value > 0;
    }
}
