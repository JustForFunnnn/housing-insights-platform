package com.housinginsights.market.application;

import static com.housinginsights.market.TestProperties.PROPERTIES;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.tuple;

import com.housinginsights.market.data.PropertyDataset;
import com.housinginsights.market.domain.MarketAnalysis;
import com.housinginsights.market.domain.MarketFilter;
import java.math.BigDecimal;
import java.util.Collections;
import java.util.TreeSet;
import org.junit.jupiter.api.Test;

class MarketAnalysisCalculatorTest {
    private final PropertyDataset dataset = new PropertyDataset(PROPERTIES);
    private final MarketAnalysisCalculator calculator =
            new MarketAnalysisCalculator(new PropertyQueryService(new CachedPropertyFilter(dataset)), dataset);

    @Test
    void calculatesFilteredSummaryChartDataAndAvailableFilters() {
        MarketFilter filter = new MarketFilter(
                null,
                null,
                new TreeSet<>(Collections.singleton(3)),
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null);

        MarketAnalysis analysis = calculator.calculate(filter);

        assertThat(analysis.count()).isEqualTo(2);
        assertThat(analysis.priceSummary().minimum()).isEqualTo(250000);
        assertThat(analysis.priceSummary().maximum()).isEqualTo(350000);
        assertThat(analysis.priceSummary().average()).isEqualByComparingTo(new BigDecimal("300000.00"));
        assertThat(analysis.priceSummary().median()).isEqualByComparingTo(new BigDecimal("300000.00"));
        assertThat(analysis.chartData().priceDistribution())
                .extracting(
                        MarketAnalysis.PriceDistributionBucket::lowerBound,
                        MarketAnalysis.PriceDistributionBucket::upperBoundExclusive,
                        MarketAnalysis.PriceDistributionBucket::count)
                .containsExactly(tuple(250000L, 300000L, 1L), tuple(350000L, 400000L, 1L));
        assertThat(analysis.chartData().averagePriceByBedrooms())
                .singleElement()
                .extracting(MarketAnalysis.BedroomPriceGroup::count)
                .isEqualTo(2L);
        assertThat(analysis.chartData().averagePriceByYearBuiltDecade())
                .hasSize(2)
                .allSatisfy(group -> assertThat(group.count()).isEqualTo(1));
        assertThat(analysis.chartData().averagePriceBySquareFootageBand()).hasSize(2);
        assertThat(calculator.availableFilters().bedrooms()).containsExactly(2, 3, 4);
        assertThat(calculator.availableFilters().price().minimum()).isEqualTo(150000);
        assertThat(calculator.availableFilters().price().maximum()).isEqualTo(450000);
    }

    @Test
    void emptyResultUsesNullSummaryAndEmptyCharts() {
        MarketFilter filter = new MarketFilter(
                null, null, null, null, null, null, null, null, null, null, null, null, 449999L, 449999L);

        MarketAnalysis analysis = calculator.calculate(filter);

        assertThat(analysis.count()).isZero();
        assertThat(analysis.priceSummary().minimum()).isNull();
        assertThat(analysis.priceSummary().average()).isNull();
        assertThat(analysis.chartData().priceDistribution()).isEmpty();
        assertThat(analysis.chartData().averagePriceByBedrooms()).isEmpty();
    }
}
