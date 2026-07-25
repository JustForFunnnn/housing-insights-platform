package com.housinginsights.market.api.schema;

import com.housinginsights.market.metadata.PropertyMetadata;

public record MarketMetadataResponse(
        PropertyMetadataFieldsResponse fields,
        MarketAnalysisResponse.FilterOptions filterOptions) {
    public static MarketMetadataResponse from(
            PropertyMetadata propertyMetadata,
            com.housinginsights.market.domain.MarketAnalysis.FilterOptions
                    filterOptions) {
        return new MarketMetadataResponse(
                PropertyMetadataFieldsResponse.from(propertyMetadata),
                MarketAnalysisResponse.FilterOptions.from(filterOptions));
    }
}
