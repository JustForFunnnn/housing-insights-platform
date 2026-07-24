package com.housinginsights.market.domain;

import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

@Service
public class MarketAnalysisService {
    private final MarketAnalysisCalculator calculator;

    public MarketAnalysisService(MarketAnalysisCalculator calculator) {
        this.calculator = calculator;
    }

    @Cacheable(cacheNames = "marketAnalysis", key = "#filter", sync = true)
    public MarketAnalysis analyse(MarketFilter filter) {
        return calculator.calculate(filter);
    }
}
