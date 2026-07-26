package com.housinginsights.market.api.schema;

import com.housinginsights.market.metadata.PropertyMetadata;

public record MarketMetadataResponse(
        PropertyMetadataFeaturesResponse features,
        String priceCurrency,
        MarketAnalysisResponse.FilterOptions filterOptions) {
    public static MarketMetadataResponse from(
            PropertyMetadata propertyMetadata,
            com.housinginsights.market.domain.MarketAnalysis.FilterOptions filterOptions) {
        return new MarketMetadataResponse(
                PropertyMetadataFeaturesResponse.from(propertyMetadata),
                propertyMetadata.priceCurrency(),
                MarketAnalysisResponse.FilterOptions.from(filterOptions));
    }
}
