package com.housinginsights.market.application;

import com.housinginsights.market.domain.MarketAnalysis;
import com.housinginsights.market.domain.MarketAnalysis.FilterOptions;
import com.housinginsights.market.domain.MarketFilter;
import org.springframework.stereotype.Service;

@Service
public class MarketAnalysisService {
    private final MarketAnalysisCalculator calculator;

    public MarketAnalysisService(MarketAnalysisCalculator calculator) {
        this.calculator = calculator;
    }

    public MarketAnalysis analyse(MarketFilter filter) {
        return calculator.calculate(filter);
    }

    public FilterOptions filterOptions() {
        return calculator.filterOptions();
    }
}
