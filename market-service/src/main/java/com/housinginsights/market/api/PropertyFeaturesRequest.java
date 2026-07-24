package com.housinginsights.market.api;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.housinginsights.market.domain.DomainLimits;
import com.housinginsights.market.domain.PropertyFeatures;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import java.time.Year;

public record PropertyFeaturesRequest(
        @NotNull
        @Positive
        @DecimalMax(DomainLimits.MAX_SQUARE_FOOTAGE_TEXT)
        Double squareFootage,

        @NotNull
        @Min(0)
        @Max(DomainLimits.MAX_BEDROOMS)
        Integer bedrooms,

        @NotNull
        @DecimalMin("0")
        @DecimalMax(DomainLimits.MAX_BATHROOMS_TEXT)
        Double bathrooms,

        @NotNull
        @Min(DomainLimits.MIN_YEAR_BUILT)
        Integer yearBuilt,

        @NotNull
        @Positive
        @DecimalMax(DomainLimits.MAX_LOT_SIZE_TEXT)
        Double lotSize,

        @NotNull
        @DecimalMin("0")
        @DecimalMax(DomainLimits.MAX_DISTANCE_TO_CITY_CENTER_TEXT)
        Double distanceToCityCenter,

        @NotNull
        @DecimalMin("0")
        @DecimalMax(DomainLimits.MAX_SCHOOL_RATING_TEXT)
        Double schoolRating
) {
    public PropertyFeatures toFeatures() {
        return new PropertyFeatures(
                squareFootage,
                bedrooms,
                bathrooms,
                yearBuilt,
                lotSize,
                distanceToCityCenter,
                schoolRating
        );
    }

    @JsonIgnore
    @AssertTrue(message = "property features must be finite and valid")
    public boolean isValid() {
        return finite(squareFootage)
                && finite(bathrooms)
                && finite(lotSize)
                && finite(distanceToCityCenter)
                && finite(schoolRating)
                && (yearBuilt == null || yearBuilt <= Year.now().getValue());
    }

    private static boolean finite(Double value) {
        return value == null || Double.isFinite(value);
    }
}
