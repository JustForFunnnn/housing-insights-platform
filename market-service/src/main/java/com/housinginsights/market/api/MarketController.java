package com.housinginsights.market.api;

import com.housinginsights.market.data.PropertyDataset;
import com.housinginsights.market.domain.DomainLimits;
import com.housinginsights.market.domain.MarketAnalysis;
import com.housinginsights.market.domain.MarketAnalysisService;
import com.housinginsights.market.domain.PropertyPage;
import com.housinginsights.market.domain.PropertyQueryService;
import com.housinginsights.market.domain.SortDirection;
import com.housinginsights.market.domain.SortField;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import org.springdoc.core.annotations.ParameterObject;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@Validated
public class MarketController {
    private final MarketAnalysisService analysisService;
    private final PropertyQueryService propertyQueryService;
    private final PropertyDataset dataset;

    public MarketController(
            MarketAnalysisService analysisService,
            PropertyQueryService propertyQueryService,
            PropertyDataset dataset
    ) {
        this.analysisService = analysisService;
        this.propertyQueryService = propertyQueryService;
        this.dataset = dataset;
    }

    @GetMapping("/analysis")
    public MarketAnalysis analysis(
            @Valid @ParameterObject @ModelAttribute
            MarketFilterRequest filters
    ) {
        return analysisService.analyse(filters.toFilter());
    }

    @GetMapping("/properties")
    public PropertyPage properties(
            @Valid @ParameterObject @ModelAttribute
            MarketFilterRequest filters,
            @RequestParam(
                    name = MarketQueryParameters.SORT_BY,
                    defaultValue = MarketQueryParameters.DEFAULT_SORT_BY
            )
            String sortBy,
            @RequestParam(
                    name = MarketQueryParameters.SORT_DIRECTION,
                    defaultValue = MarketQueryParameters.DEFAULT_SORT_DIRECTION
            )
            String sortDirection,
            @RequestParam(
                    name = MarketQueryParameters.LIMIT,
                    defaultValue = MarketQueryParameters.DEFAULT_PAGE_LIMIT
            )
            @Min(1)
            @Max(DomainLimits.MAX_PAGE_LIMIT)
            int limit,
            @RequestParam(
                    name = MarketQueryParameters.OFFSET,
                    defaultValue = MarketQueryParameters.DEFAULT_PAGE_OFFSET
            )
            @Min(0)
            int offset
    ) {
        return propertyQueryService.findPage(
                filters.toFilter(),
                SortField.parse(sortBy),
                SortDirection.parse(sortDirection),
                limit,
                offset
        );
    }

    @GetMapping("/health")
    public HealthResponse health() {
        if (dataset.properties().isEmpty()) {
            throw new IllegalStateException("market dataset is unavailable");
        }
        return new HealthResponse("ok");
    }
}
