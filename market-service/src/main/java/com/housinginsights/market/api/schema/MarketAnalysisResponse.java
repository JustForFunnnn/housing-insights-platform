package com.housinginsights.market.api.schema;

import com.housinginsights.market.domain.MarketAnalysis;
import java.math.BigDecimal;
import java.util.List;

public record MarketAnalysisResponse(
        long count, PriceSummary priceSummary, Visualisations visualisations, FilterOptions filterOptions) {
    public static MarketAnalysisResponse from(MarketAnalysis analysis) {
        return new MarketAnalysisResponse(
                analysis.count(),
                PriceSummary.from(analysis.priceSummary()),
                Visualisations.from(analysis.visualisations()),
                FilterOptions.from(analysis.filterOptions()));
    }

    public record PriceSummary(Long minimum, Long maximum, BigDecimal average, BigDecimal median) {
        private static PriceSummary from(MarketAnalysis.PriceSummary summary) {
            return new PriceSummary(summary.minimum(), summary.maximum(), summary.average(), summary.median());
        }
    }

    public record Visualisations(
            List<PriceDistributionBucket> priceDistribution,
            List<BedroomPriceGroup> averagePriceByBedrooms,
            List<YearDecadePriceGroup> averagePriceByYearBuiltDecade,
            List<SquareFootagePriceGroup> averagePriceBySquareFootageBand) {
        public Visualisations {
            priceDistribution = List.copyOf(priceDistribution);
            averagePriceByBedrooms = List.copyOf(averagePriceByBedrooms);
            averagePriceByYearBuiltDecade = List.copyOf(averagePriceByYearBuiltDecade);
            averagePriceBySquareFootageBand = List.copyOf(averagePriceBySquareFootageBand);
        }

        private static Visualisations from(MarketAnalysis.Visualisations visualisations) {
            return new Visualisations(
                    visualisations.priceDistribution().stream()
                            .map(PriceDistributionBucket::from)
                            .toList(),
                    visualisations.averagePriceByBedrooms().stream()
                            .map(BedroomPriceGroup::from)
                            .toList(),
                    visualisations.averagePriceByYearBuiltDecade().stream()
                            .map(YearDecadePriceGroup::from)
                            .toList(),
                    visualisations.averagePriceBySquareFootageBand().stream()
                            .map(SquareFootagePriceGroup::from)
                            .toList());
        }
    }

    public record PriceDistributionBucket(String label, long lowerBound, long upperBound, long count) {
        private static PriceDistributionBucket from(MarketAnalysis.PriceDistributionBucket bucket) {
            return new PriceDistributionBucket(
                    bucket.label(), bucket.lowerBound(), bucket.upperBound(), bucket.count());
        }
    }

    public record BedroomPriceGroup(int bedrooms, BigDecimal averagePrice, long count) {
        private static BedroomPriceGroup from(MarketAnalysis.BedroomPriceGroup group) {
            return new BedroomPriceGroup(group.bedrooms(), group.averagePrice(), group.count());
        }
    }

    public record YearDecadePriceGroup(String label, int startYear, int endYear, BigDecimal averagePrice, long count) {
        private static YearDecadePriceGroup from(MarketAnalysis.YearDecadePriceGroup group) {
            return new YearDecadePriceGroup(
                    group.label(), group.startYear(), group.endYear(), group.averagePrice(), group.count());
        }
    }

    public record SquareFootagePriceGroup(
            String label, long lowerBound, long upperBoundExclusive, BigDecimal averagePrice, long count) {
        private static SquareFootagePriceGroup from(MarketAnalysis.SquareFootagePriceGroup group) {
            return new SquareFootagePriceGroup(
                    group.label(),
                    group.lowerBound(),
                    group.upperBoundExclusive(),
                    group.averagePrice(),
                    group.count());
        }
    }

    public record FilterOptions(
            DoubleRange squareFootage,
            List<Integer> bedrooms,
            List<Double> bathrooms,
            IntegerRange yearBuilt,
            DoubleRange lotSize,
            DoubleRange distanceToCityCenter,
            DoubleRange schoolRating,
            LongRange price) {
        public FilterOptions {
            bedrooms = List.copyOf(bedrooms);
            bathrooms = List.copyOf(bathrooms);
        }

        private static FilterOptions from(MarketAnalysis.FilterOptions options) {
            return new FilterOptions(
                    DoubleRange.from(options.squareFootage()),
                    options.bedrooms(),
                    options.bathrooms(),
                    IntegerRange.from(options.yearBuilt()),
                    DoubleRange.from(options.lotSize()),
                    DoubleRange.from(options.distanceToCityCenter()),
                    DoubleRange.from(options.schoolRating()),
                    LongRange.from(options.price()));
        }
    }

    public record DoubleRange(double minimum, double maximum) {
        private static DoubleRange from(MarketAnalysis.DoubleRange range) {
            return new DoubleRange(range.minimum(), range.maximum());
        }
    }

    public record IntegerRange(int minimum, int maximum) {
        private static IntegerRange from(MarketAnalysis.IntegerRange range) {
            return new IntegerRange(range.minimum(), range.maximum());
        }
    }

    public record LongRange(long minimum, long maximum) {
        private static LongRange from(MarketAnalysis.LongRange range) {
            return new LongRange(range.minimum(), range.maximum());
        }
    }
}
