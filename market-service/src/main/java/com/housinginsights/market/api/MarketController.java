package com.housinginsights.market.api;

import com.housinginsights.market.api.schema.MarketAnalysisResponse;
import com.housinginsights.market.api.schema.MarketFilterQuery;
import com.housinginsights.market.api.schema.MarketMetadataResponse;
import com.housinginsights.market.api.schema.MarketPageQuery;
import com.housinginsights.market.api.schema.MarketSortQuery;
import com.housinginsights.market.api.schema.PropertyPageResponse;
import com.housinginsights.market.application.MarketAnalysisCalculator;
import com.housinginsights.market.application.PropertyQueryService;
import com.housinginsights.market.metadata.PropertyMetadata;
import jakarta.validation.Valid;
import org.springdoc.core.annotations.ParameterObject;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;

@MarketApiController
public class MarketController {
    private final MarketAnalysisCalculator analysisCalculator;
    private final PropertyQueryService propertyQueryService;
    private final PropertyMetadata propertyMetadata;

    public MarketController(
            MarketAnalysisCalculator analysisCalculator,
            PropertyQueryService propertyQueryService,
            PropertyMetadata propertyMetadata) {
        this.analysisCalculator = analysisCalculator;
        this.propertyQueryService = propertyQueryService;
        this.propertyMetadata = propertyMetadata;
    }

    @GetMapping("/metadata")
    public MarketMetadataResponse metadata() {
        return MarketMetadataResponse.from(propertyMetadata, analysisCalculator.availableFilters());
    }

    @GetMapping("/analysis")
    public MarketAnalysisResponse analysis(@Valid @ParameterObject @ModelAttribute MarketFilterQuery filters) {
        var analysis = analysisCalculator.calculate(filters.toFilter(propertyMetadata));
        return MarketAnalysisResponse.from(analysis);
    }

    @GetMapping("/properties")
    public PropertyPageResponse properties(
            @Valid @ParameterObject @ModelAttribute MarketFilterQuery filters,
            @ParameterObject @ModelAttribute MarketSortQuery sort,
            @Valid @ParameterObject @ModelAttribute MarketPageQuery pageQuery) {
        var page = propertyQueryService.findPage(
                filters.toFilter(propertyMetadata),
                sort.toSortField(),
                sort.toSortDirection(),
                pageQuery.limit(),
                pageQuery.offset());
        return PropertyPageResponse.from(page);
    }
}
