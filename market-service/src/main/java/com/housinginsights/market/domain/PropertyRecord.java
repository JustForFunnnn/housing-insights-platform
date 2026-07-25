package com.housinginsights.market.domain;

public record PropertyRecord(
        long id,
        double squareFootage,
        int bedrooms,
        double bathrooms,
        int yearBuilt,
        double lotSize,
        double distanceToCityCenter,
        double schoolRating,
        long price) {
    public PropertyFeatures features() {
        return new PropertyFeatures(
                squareFootage, bedrooms, bathrooms, yearBuilt, lotSize, distanceToCityCenter, schoolRating);
    }
}
