package com.housinginsights.market.api.schema;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.housinginsights.market.domain.PropertyFeatures;
import com.housinginsights.market.metadata.PropertyMetadata;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.NotNull;

public record PropertyFeaturesRequest(
        @NotNull @Schema(example = "1850") Double squareFootage,
        @NotNull @Schema(example = "3") Integer bedrooms,
        @NotNull @Schema(example = "2.5") Double bathrooms,
        @NotNull @Schema(example = "2005") Integer yearBuilt,
        @NotNull @Schema(example = "7500") Double lotSize,
        @NotNull @Schema(example = "8.5") Double distanceToCityCenter,
        @NotNull @Schema(example = "8.2") Double schoolRating) {
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
