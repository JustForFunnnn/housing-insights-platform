package com.housinginsights.market.api.schema;

import com.housinginsights.market.domain.PropertyFieldNames;
import com.housinginsights.market.metadata.PropertyFieldMetadata;
import com.housinginsights.market.metadata.PropertyMetadata;
import java.util.Map;

public record PropertyMetadataFieldsResponse(
        PropertyFieldMetadataResponse squareFootage,
        PropertyFieldMetadataResponse bedrooms,
        PropertyFieldMetadataResponse bathrooms,
        PropertyFieldMetadataResponse yearBuilt,
        PropertyFieldMetadataResponse lotSize,
        PropertyFieldMetadataResponse distanceToCityCenter,
        PropertyFieldMetadataResponse schoolRating,
        PropertyFieldMetadataResponse price) {
    public static PropertyMetadataFieldsResponse from(PropertyMetadata metadata) {
        Map<String, PropertyFieldMetadata> fields = metadata.fields();
        return new PropertyMetadataFieldsResponse(
                field(fields, PropertyFieldNames.SQUARE_FOOTAGE),
                field(fields, PropertyFieldNames.BEDROOMS),
                field(fields, PropertyFieldNames.BATHROOMS),
                field(fields, PropertyFieldNames.YEAR_BUILT),
                field(fields, PropertyFieldNames.LOT_SIZE),
                field(fields, PropertyFieldNames.DISTANCE_TO_CITY_CENTER),
                field(fields, PropertyFieldNames.SCHOOL_RATING),
                field(fields, PropertyFieldNames.PRICE));
    }

    private static PropertyFieldMetadataResponse field(
            Map<String, PropertyFieldMetadata> fields, String name) {
        return PropertyFieldMetadataResponse.from(fields.get(name));
    }
}
