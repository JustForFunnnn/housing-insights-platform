package com.housinginsights.market.api.schema;

import com.housinginsights.market.domain.PropertyFieldNames;
import com.housinginsights.market.metadata.PropertyFeatureMetadata;
import com.housinginsights.market.metadata.PropertyMetadata;
import java.util.Map;

public record PropertyMetadataFeaturesResponse(
        PropertyFeatureMetadataResponse squareFootage,
        PropertyFeatureMetadataResponse bedrooms,
        PropertyFeatureMetadataResponse bathrooms,
        PropertyFeatureMetadataResponse yearBuilt,
        PropertyFeatureMetadataResponse lotSize,
        PropertyFeatureMetadataResponse distanceToCityCenter,
        PropertyFeatureMetadataResponse schoolRating) {
    public static PropertyMetadataFeaturesResponse from(PropertyMetadata metadata) {
        Map<String, PropertyFeatureMetadata> features = metadata.features();
        return new PropertyMetadataFeaturesResponse(
                feature(features, PropertyFieldNames.SQUARE_FOOTAGE),
                feature(features, PropertyFieldNames.BEDROOMS),
                feature(features, PropertyFieldNames.BATHROOMS),
                feature(features, PropertyFieldNames.YEAR_BUILT),
                feature(features, PropertyFieldNames.LOT_SIZE),
                feature(features, PropertyFieldNames.DISTANCE_TO_CITY_CENTER),
                feature(features, PropertyFieldNames.SCHOOL_RATING));
    }

    private static PropertyFeatureMetadataResponse feature(
            Map<String, PropertyFeatureMetadata> features, String name) {
        return PropertyFeatureMetadataResponse.from(features.get(name));
    }
}
