package com.housinginsights.market.api.schema;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.housinginsights.market.domain.PropertyFeatures;
import com.housinginsights.market.metadata.PropertyMetadata;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.NotNull;

public record PropertyFeaturesRequest(
        @NotNull Double squareFootage,
        @NotNull Integer bedrooms,
        @NotNull Double bathrooms,
        @NotNull Integer yearBuilt,
        @NotNull Double lotSize,
        @NotNull Double distanceToCityCenter,
        @NotNull Double schoolRating) {
    public PropertyFeatures toFeatures(PropertyMetadata propertyMetadata) {
        var features = new PropertyFeatures(
                squareFootage, bedrooms, bathrooms, yearBuilt, lotSize, distanceToCityCenter, schoolRating);
        propertyMetadata.validate(features);
        return features;
    }

    @JsonIgnore
    @AssertTrue(message = "property features must be finite and valid")
    public boolean isValid() {
        return finite(squareFootage)
                && finite(bathrooms)
                && finite(lotSize)
                && finite(distanceToCityCenter)
                && finite(schoolRating);
    }

    private static boolean finite(Double value) {
        return value == null || Double.isFinite(value);
    }
}
