package com.housinginsights.market.domain;

import java.math.BigDecimal;
import java.util.List;

public record MarketAnalysis(long count, PriceSummary priceSummary, ChartData chartData) {
    public record PriceSummary(Long minimum, Long maximum, BigDecimal average, BigDecimal median) {}

    public record ChartData(
            List<PriceDistributionGroup> priceDistribution,
            List<BedroomPriceGroup> averagePriceByBedrooms,
            List<YearBuiltDecadePriceGroup> averagePriceByYearBuiltDecade,
            List<SquareFootagePriceGroup> averagePriceBySquareFootageBand) {
        public ChartData {
            priceDistribution = List.copyOf(priceDistribution);
            averagePriceByBedrooms = List.copyOf(averagePriceByBedrooms);
            averagePriceByYearBuiltDecade = List.copyOf(averagePriceByYearBuiltDecade);
            averagePriceBySquareFootageBand = List.copyOf(averagePriceBySquareFootageBand);
        }
    }

    public record PriceDistributionGroup(long lowerBound, Long upperBoundExclusive, long count) {}

    public record BedroomPriceGroup(int bedrooms, BigDecimal averagePrice, long count) {}

    public record YearBuiltDecadePriceGroup(int startYear, int endYear, BigDecimal averagePrice, long count) {}

    public record SquareFootagePriceGroup(
            long lowerBound, long upperBoundExclusive, BigDecimal averagePrice, long count) {}

    public record AvailableFilters(
            DoubleRange squareFootage,
            List<Integer> bedrooms,
            List<Double> bathrooms,
            IntegerRange yearBuilt,
            DoubleRange lotSize,
            DoubleRange distanceToCityCenter,
            DoubleRange schoolRating,
            LongRange price) {
        public AvailableFilters {
            bedrooms = List.copyOf(bedrooms);
            bathrooms = List.copyOf(bathrooms);
        }
    }

    public record DoubleRange(double minimum, double maximum) {}

    public record IntegerRange(int minimum, int maximum) {}

    public record LongRange(long minimum, long maximum) {}
}
