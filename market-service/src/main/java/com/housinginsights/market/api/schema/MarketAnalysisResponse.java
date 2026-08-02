package com.housinginsights.market.api.schema;

import com.housinginsights.market.domain.MarketAnalysis;
import java.math.BigDecimal;
import java.util.List;

public record MarketAnalysisResponse(long count, PriceSummary priceSummary, ChartData chartData) {
    public static MarketAnalysisResponse from(MarketAnalysis analysis) {
        return new MarketAnalysisResponse(
                analysis.count(), PriceSummary.from(analysis.priceSummary()), ChartData.from(analysis.chartData()));
    }

    public record PriceSummary(Long minimum, Long maximum, BigDecimal average, BigDecimal median) {
        private static PriceSummary from(MarketAnalysis.PriceSummary summary) {
            return new PriceSummary(summary.minimum(), summary.maximum(), summary.average(), summary.median());
        }
    }

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

        private static ChartData from(MarketAnalysis.ChartData chartData) {
            return new ChartData(
                    chartData.priceDistribution().stream()
                            .map(PriceDistributionGroup::from)
                            .toList(),
                    chartData.averagePriceByBedrooms().stream()
                            .map(BedroomPriceGroup::from)
                            .toList(),
                    chartData.averagePriceByYearBuiltDecade().stream()
                            .map(YearBuiltDecadePriceGroup::from)
                            .toList(),
                    chartData.averagePriceBySquareFootageBand().stream()
                            .map(SquareFootagePriceGroup::from)
                            .toList());
        }
    }

    public record PriceDistributionGroup(long lowerBound, Long upperBoundExclusive, long count) {
        private static PriceDistributionGroup from(MarketAnalysis.PriceDistributionGroup group) {
            return new PriceDistributionGroup(group.lowerBound(), group.upperBoundExclusive(), group.count());
        }
    }

    public record BedroomPriceGroup(int bedrooms, BigDecimal averagePrice, long count) {
        private static BedroomPriceGroup from(MarketAnalysis.BedroomPriceGroup group) {
            return new BedroomPriceGroup(group.bedrooms(), group.averagePrice(), group.count());
        }
    }

    public record YearBuiltDecadePriceGroup(int startYear, int endYear, BigDecimal averagePrice, long count) {
        private static YearBuiltDecadePriceGroup from(MarketAnalysis.YearBuiltDecadePriceGroup group) {
            return new YearBuiltDecadePriceGroup(
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
