package com.housinginsights.market.api.schema;

import com.housinginsights.market.domain.PropertyFieldNames;
import com.housinginsights.market.metadata.PropertyFeatureMetadata;
import com.housinginsights.market.metadata.PropertyMetadata;
import java.util.Map;

public record PropertyFeaturesMetadata(
        FeatureMetadata squareFootage,
        FeatureMetadata bedrooms,
        FeatureMetadata bathrooms,
        FeatureMetadata yearBuilt,
        FeatureMetadata lotSize,
        FeatureMetadata distanceToCityCenter,
        FeatureMetadata schoolRating) {
    public static PropertyFeaturesMetadata from(PropertyMetadata metadata) {
        Map<String, PropertyFeatureMetadata> features = metadata.features();
        return new PropertyFeaturesMetadata(
                feature(features, PropertyFieldNames.SQUARE_FOOTAGE),
                feature(features, PropertyFieldNames.BEDROOMS),
                feature(features, PropertyFieldNames.BATHROOMS),
                feature(features, PropertyFieldNames.YEAR_BUILT),
                feature(features, PropertyFieldNames.LOT_SIZE),
                feature(features, PropertyFieldNames.DISTANCE_TO_CITY_CENTER),
                feature(features, PropertyFieldNames.SCHOOL_RATING));
    }

    private static FeatureMetadata feature(Map<String, PropertyFeatureMetadata> features, String name) {
        return FeatureMetadata.from(features.get(name));
    }
}
