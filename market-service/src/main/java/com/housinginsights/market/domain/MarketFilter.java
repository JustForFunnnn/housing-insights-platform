package com.housinginsights.market.domain;

import java.util.Collections;
import java.util.SortedSet;
import java.util.TreeSet;

public record MarketFilter(
        Double minSquareFootage,
        Double maxSquareFootage,
        SortedSet<Integer> bedrooms,
        SortedSet<Double> bathrooms,
        Integer minYearBuilt,
        Integer maxYearBuilt,
        Double minLotSize,
        Double maxLotSize,
        Double minDistanceToCityCenter,
        Double maxDistanceToCityCenter,
        Double minSchoolRating,
        Double maxSchoolRating,
        Long minPrice,
        Long maxPrice) {
    public MarketFilter {
        bedrooms = immutableSortedSet(bedrooms);
        bathrooms = immutableSortedSet(bathrooms);
    }

    public static MarketFilter empty() {
        return new MarketFilter(null, null, null, null, null, null, null, null, null, null, null, null, null, null);
    }

    public boolean matches(Property property) {
        return within(property.squareFootage(), minSquareFootage, maxSquareFootage)
                && (bedrooms.isEmpty() || bedrooms.contains(property.bedrooms()))
                && (bathrooms.isEmpty() || bathrooms.contains(property.bathrooms()))
                && within(property.yearBuilt(), minYearBuilt, maxYearBuilt)
                && within(property.lotSize(), minLotSize, maxLotSize)
                && within(property.distanceToCityCenter(), minDistanceToCityCenter, maxDistanceToCityCenter)
                && within(property.schoolRating(), minSchoolRating, maxSchoolRating)
                && within(property.price(), minPrice, maxPrice);
    }

    private static <T extends Comparable<T>> boolean within(T value, T minimum, T maximum) {
        return (minimum == null || value.compareTo(minimum) >= 0) && (maximum == null || value.compareTo(maximum) <= 0);
    }

    private static <T extends Comparable<? super T>> SortedSet<T> immutableSortedSet(SortedSet<T> values) {
        if (values == null || values.isEmpty()) {
            return Collections.emptySortedSet();
        }
        return Collections.unmodifiableSortedSet(new TreeSet<>(values));
    }
}
