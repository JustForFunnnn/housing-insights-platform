package com.housinginsights.market.domain;

public record PropertyFeatures(
        double squareFootage,
        int bedrooms,
        double bathrooms,
        int yearBuilt,
        double lotSize,
        double distanceToCityCenter,
        double schoolRating) {}
