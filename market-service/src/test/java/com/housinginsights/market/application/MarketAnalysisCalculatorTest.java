package com.housinginsights.market.application;

import static com.housinginsights.market.TestProperties.RECORDS;
import static org.assertj.core.api.Assertions.assertThat;

import com.housinginsights.market.data.PropertyDataset;
import com.housinginsights.market.domain.MarketAnalysis;
import com.housinginsights.market.domain.MarketFilter;
import java.math.BigDecimal;
import java.util.Collections;
import java.util.TreeSet;
import org.junit.jupiter.api.Test;

class MarketAnalysisCalculatorTest {
    private final PropertyDataset dataset = new PropertyDataset(RECORDS);
    private final MarketAnalysisCalculator calculator =
            new MarketAnalysisCalculator(
                    new PropertyQueryService(dataset),
                    dataset
            );

    @Test
    void calculatesFilteredSummaryVisualisationsAndGlobalOptions() {
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
                null
        );

        MarketAnalysis analysis = calculator.calculate(filter);

        assertThat(analysis.count()).isEqualTo(2);
        assertThat(analysis.priceSummary().minimum()).isEqualTo(250000);
        assertThat(analysis.priceSummary().maximum()).isEqualTo(350000);
        assertThat(analysis.priceSummary().average())
                .isEqualByComparingTo(new BigDecimal("300000.00"));
        assertThat(analysis.priceSummary().median())
                .isEqualByComparingTo(new BigDecimal("300000.00"));
        assertThat(analysis.visualisations().priceDistribution())
                .extracting(MarketAnalysis.PriceDistributionBucket::count)
                .containsExactly(1L, 1L);
        assertThat(analysis.visualisations().averagePriceByBedrooms())
                .singleElement()
                .extracting(MarketAnalysis.BedroomPriceGroup::count)
                .isEqualTo(2L);
        assertThat(analysis.visualisations().averagePriceByYearBuiltDecade())
                .hasSize(2)
                .allSatisfy(group -> assertThat(group.count()).isEqualTo(1));
        assertThat(analysis.visualisations().averagePriceBySquareFootageBand())
                .hasSize(2);
        assertThat(analysis.filterOptions().bedrooms()).containsExactly(2, 3, 4);
        assertThat(analysis.filterOptions().price().minimum()).isEqualTo(150000);
        assertThat(analysis.filterOptions().price().maximum()).isEqualTo(450000);
    }

    @Test
    void emptyResultUsesNullSummaryAndEmptyCharts() {
        MarketFilter filter = new MarketFilter(
                null, null, null, null, null, null, null,
                null, null, null, null, null, 449999L, 449999L
        );

        MarketAnalysis analysis = calculator.calculate(filter);

        assertThat(analysis.count()).isZero();
        assertThat(analysis.priceSummary().minimum()).isNull();
        assertThat(analysis.priceSummary().average()).isNull();
        assertThat(analysis.visualisations().priceDistribution()).isEmpty();
        assertThat(analysis.visualisations().averagePriceByBedrooms()).isEmpty();
    }
}
