package com.housinginsights.market.domain;

import java.math.BigDecimal;
import java.util.List;

public record MarketAnalysis(
        long count,
        PriceSummary priceSummary,
        Visualisations visualisations,
        FilterOptions filterOptions
) {
    public record PriceSummary(
            Long minimum,
            Long maximum,
            BigDecimal average,
            BigDecimal median
    ) {
    }

    public record Visualisations(
            List<PriceDistributionBucket> priceDistribution,
            List<BedroomPriceGroup> averagePriceByBedrooms,
            List<YearDecadePriceGroup> averagePriceByYearBuiltDecade,
            List<SquareFootagePriceGroup> averagePriceBySquareFootageBand
    ) {
        public Visualisations {
            priceDistribution = List.copyOf(priceDistribution);
            averagePriceByBedrooms = List.copyOf(averagePriceByBedrooms);
            averagePriceByYearBuiltDecade =
                    List.copyOf(averagePriceByYearBuiltDecade);
            averagePriceBySquareFootageBand =
                    List.copyOf(averagePriceBySquareFootageBand);
        }
    }

    public record PriceDistributionBucket(
            String label,
            long lowerBound,
            long upperBound,
            long count
    ) {
    }

    public record BedroomPriceGroup(
            int bedrooms,
            BigDecimal averagePrice,
            long count
    ) {
    }

    public record YearDecadePriceGroup(
            String label,
            int startYear,
            int endYear,
            BigDecimal averagePrice,
            long count
    ) {
    }

    public record SquareFootagePriceGroup(
            String label,
            long lowerBound,
            long upperBoundExclusive,
            BigDecimal averagePrice,
            long count
    ) {
    }

    public record FilterOptions(
            DoubleRange squareFootage,
            List<Integer> bedrooms,
            List<Double> bathrooms,
            IntegerRange yearBuilt,
            DoubleRange lotSize,
            DoubleRange distanceToCityCenter,
            DoubleRange schoolRating,
            LongRange price
    ) {
        public FilterOptions {
            bedrooms = List.copyOf(bedrooms);
            bathrooms = List.copyOf(bathrooms);
        }
    }

    public record DoubleRange(double minimum, double maximum) {
    }

    public record IntegerRange(int minimum, int maximum) {
    }

    public record LongRange(long minimum, long maximum) {
    }
}
