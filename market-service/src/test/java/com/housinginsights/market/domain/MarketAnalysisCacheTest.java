package com.housinginsights.market.domain;

import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.github.benmanes.caffeine.cache.Caffeine;
import com.housinginsights.market.domain.MarketAnalysis.FilterOptions;
import com.housinginsights.market.domain.MarketAnalysis.PriceSummary;
import com.housinginsights.market.domain.MarketAnalysis.Visualisations;
import java.util.List;
import java.util.concurrent.TimeUnit;
import org.junit.jupiter.api.Test;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.caffeine.CaffeineCacheManager;
import org.springframework.context.annotation.AnnotationConfigApplicationContext;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

class MarketAnalysisCacheTest {
    @Test
    void identicalCanonicalFilterIsCalculatedOnce() {
        try (var context = new AnnotationConfigApplicationContext(
                TestConfiguration.class
        )) {
            MarketAnalysisCalculator calculator =
                    context.getBean(MarketAnalysisCalculator.class);
            MarketAnalysisService service =
                    context.getBean(MarketAnalysisService.class);
            MarketFilter filter = MarketFilter.empty();
            MarketAnalysis analysis = emptyAnalysis();
            when(calculator.calculate(filter)).thenReturn(analysis);

            service.analyse(filter);
            service.analyse(filter);

            verify(calculator).calculate(filter);
        }
    }

    private static MarketAnalysis emptyAnalysis() {
        return new MarketAnalysis(
                0,
                new PriceSummary(null, null, null, null),
                new Visualisations(List.of(), List.of(), List.of(), List.of()),
                new FilterOptions(
                        new MarketAnalysis.DoubleRange(1, 1),
                        List.of(),
                        List.of(),
                        new MarketAnalysis.IntegerRange(2000, 2000),
                        new MarketAnalysis.DoubleRange(1, 1),
                        new MarketAnalysis.DoubleRange(1, 1),
                        new MarketAnalysis.DoubleRange(1, 1),
                        new MarketAnalysis.LongRange(1, 1)
                )
        );
    }

    @Configuration
    @EnableCaching
    static class TestConfiguration {
        @Bean
        MarketAnalysisCalculator calculator() {
            return mock(MarketAnalysisCalculator.class);
        }

        @Bean
        MarketAnalysisService marketAnalysisService(
                MarketAnalysisCalculator calculator
        ) {
            return new MarketAnalysisService(calculator);
        }

        @Bean
        CacheManager cacheManager() {
            CaffeineCacheManager manager =
                    new CaffeineCacheManager("marketAnalysis");
            manager.setCaffeine(Caffeine.newBuilder()
                    .maximumSize(10)
                    .expireAfterAccess(1, TimeUnit.MINUTES));
            return manager;
        }
    }
}
