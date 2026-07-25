package com.housinginsights.market.api.schema;

import com.housinginsights.market.metadata.PropertyFieldMetadata;
import com.housinginsights.market.metadata.PropertyMetadata;
import java.util.Map;

public record MarketMetadataResponse(
        Map<String, PropertyFieldMetadata> fields,
        MarketAnalysisResponse.FilterOptions filterOptions) {
    public MarketMetadataResponse {
        fields = Map.copyOf(fields);
    }

    public static MarketMetadataResponse from(
            PropertyMetadata propertyMetadata,
            com.housinginsights.market.domain.MarketAnalysis.FilterOptions
                    filterOptions) {
        return new MarketMetadataResponse(
                propertyMetadata.fields(),
                MarketAnalysisResponse.FilterOptions.from(filterOptions));
    }
}
