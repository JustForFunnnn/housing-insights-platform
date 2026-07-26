package com.housinginsights.market.api;

import com.housinginsights.market.api.schema.MarketAnalysisResponse;
import com.housinginsights.market.api.schema.MarketFilterRequest;
import com.housinginsights.market.api.schema.MarketMetadataResponse;
import com.housinginsights.market.api.schema.MarketPageRequest;
import com.housinginsights.market.api.schema.MarketSortRequest;
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
        return MarketMetadataResponse.from(propertyMetadata, analysisCalculator.filterOptions());
    }

    @GetMapping("/analysis")
    public MarketAnalysisResponse analysis(@Valid @ParameterObject @ModelAttribute MarketFilterRequest filters) {
        var analysis = analysisCalculator.calculate(filters.toFilter(propertyMetadata));
        return MarketAnalysisResponse.from(analysis);
    }

    @GetMapping("/properties")
    public PropertyPageResponse properties(
            @Valid @ParameterObject @ModelAttribute MarketFilterRequest filters,
            @ParameterObject @ModelAttribute MarketSortRequest sort,
            @Valid @ParameterObject @ModelAttribute MarketPageRequest pageRequest) {
        var page = propertyQueryService.findPage(
                filters.toFilter(propertyMetadata),
                sort.toSortField(),
                sort.toSortDirection(),
                pageRequest.limit(),
                pageRequest.offset());
        return PropertyPageResponse.from(page);
    }
}
