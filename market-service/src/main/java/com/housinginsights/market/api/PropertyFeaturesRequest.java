package com.housinginsights.market.api;

import com.fasterxml.jackson.annotation.JsonIgnore;
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
        @NotNull @Positive @DecimalMax("100000") Double squareFootage,
        @NotNull @Min(0) @Max(10000) Integer bedrooms,
        @NotNull @DecimalMin("0") @DecimalMax("10000") Double bathrooms,
        @NotNull @Min(1800) Integer yearBuilt,
        @NotNull @Positive @DecimalMax("100000") Double lotSize,
        @NotNull @DecimalMin("0") @DecimalMax("400")
        Double distanceToCityCenter,
        @NotNull @DecimalMin("0") @DecimalMax("10") Double schoolRating
) {
    public PropertyFeatures toDomain() {
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
