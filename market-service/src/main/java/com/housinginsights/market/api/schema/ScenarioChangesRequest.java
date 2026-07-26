package com.housinginsights.market.api.schema;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.housinginsights.market.domain.PropertyFeatures;
import com.housinginsights.market.metadata.PropertyMetadata;
import jakarta.validation.constraints.AssertTrue;

public record ScenarioChangesRequest(
        Double squareFootage,
        Integer bedrooms,
        Double bathrooms,
        Integer yearBuilt,
        Double lotSize,
        Double distanceToCityCenter,
        Double schoolRating) {

    public PropertyFeatures applyTo(PropertyFeatures baseline, PropertyMetadata propertyMetadata) {
        var features = new PropertyFeatures(
                squareFootage == null ? baseline.squareFootage() : squareFootage,
                bedrooms == null ? baseline.bedrooms() : bedrooms,
                bathrooms == null ? baseline.bathrooms() : bathrooms,
                yearBuilt == null ? baseline.yearBuilt() : yearBuilt,
                lotSize == null ? baseline.lotSize() : lotSize,
                distanceToCityCenter == null ? baseline.distanceToCityCenter() : distanceToCityCenter,
                schoolRating == null ? baseline.schoolRating() : schoolRating);
        propertyMetadata.validate(features);
        return features;
    }

    @JsonIgnore
    @AssertTrue(message = "scenario must change at least one feature")
    public boolean isNotEmpty() {
        return squareFootage != null
                || bedrooms != null
                || bathrooms != null
                || yearBuilt != null
                || lotSize != null
                || distanceToCityCenter != null
                || schoolRating != null;
    }

    @JsonIgnore
    @AssertTrue(message = "scenario feature values must be finite")
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
