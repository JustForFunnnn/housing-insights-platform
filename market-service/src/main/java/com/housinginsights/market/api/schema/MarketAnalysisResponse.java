package com.housinginsights.market.api.schema;

import com.housinginsights.market.domain.MarketAnalysis;
import java.math.BigDecimal;
import java.util.List;

public record MarketAnalysisResponse(long count, PriceSummary priceSummary, Visualisations visualisations) {
    public static MarketAnalysisResponse from(MarketAnalysis analysis) {
        return new MarketAnalysisResponse(
                analysis.count(),
                PriceSummary.from(analysis.priceSummary()),
                Visualisations.from(analysis.visualisations()));
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

    public record PriceDistributionBucket(long lowerBound, Long upperBoundExclusive, long count) {
        private static PriceDistributionBucket from(MarketAnalysis.PriceDistributionBucket bucket) {
            return new PriceDistributionBucket(bucket.lowerBound(), bucket.upperBoundExclusive(), bucket.count());
        }
    }

    public record BedroomPriceGroup(int bedrooms, BigDecimal averagePrice, long count) {
        private static BedroomPriceGroup from(MarketAnalysis.BedroomPriceGroup group) {
            return new BedroomPriceGroup(group.bedrooms(), group.averagePrice(), group.count());
        }
    }

    public record YearDecadePriceGroup(int startYear, int endYear, BigDecimal averagePrice, long count) {
        private static YearDecadePriceGroup from(MarketAnalysis.YearDecadePriceGroup group) {
            return new YearDecadePriceGroup(
                    group.startYear(), group.endYear(), group.averagePrice(), group.count());
        }
    }

    public record SquareFootagePriceGroup(
            long lowerBound, long upperBoundExclusive, BigDecimal averagePrice, long count) {
        private static SquareFootagePriceGroup from(MarketAnalysis.SquareFootagePriceGroup group) {
            return new SquareFootagePriceGroup(
                    group.lowerBound(), group.upperBoundExclusive(), group.averagePrice(), group.count());
        }
    }
}
