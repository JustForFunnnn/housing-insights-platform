package com.housinginsights.market.api.schema;

import com.housinginsights.market.domain.Property;
import com.housinginsights.market.domain.PropertyPage;
import java.util.List;

public record PropertyPageResponse(
        List<PropertyDto> properties, long total, int limit, int offset, String sortBy, String sortDirection) {
    public PropertyPageResponse {
        properties = List.copyOf(properties);
    }

    public static PropertyPageResponse from(PropertyPage page) {
        return new PropertyPageResponse(
                page.properties().stream().map(PropertyDto::from).toList(),
                page.total(),
                page.limit(),
                page.offset(),
                page.sortBy().value(),
                page.sortDirection().value());
    }

    public record PropertyDto(
            long id,
            double squareFootage,
            int bedrooms,
            double bathrooms,
            int yearBuilt,
            double lotSize,
            double distanceToCityCenter,
            double schoolRating,
            long price) {
        private static PropertyDto from(Property property) {
            return new PropertyDto(
                    property.id(),
                    property.squareFootage(),
                    property.bedrooms(),
                    property.bathrooms(),
                    property.yearBuilt(),
                    property.lotSize(),
                    property.distanceToCityCenter(),
                    property.schoolRating(),
                    property.price());
        }
    }
}
