package com.housinginsights.market.api.schema;

import com.housinginsights.market.domain.PropertyPage;
import com.housinginsights.market.domain.PropertyRecord;
import java.util.List;

public record PropertyPageResponse(
        List<PropertyResponse> records, long total, int limit, int offset, String sortBy, String sortDirection) {
    public PropertyPageResponse {
        records = List.copyOf(records);
    }

    public static PropertyPageResponse from(PropertyPage page) {
        return new PropertyPageResponse(
                page.records().stream().map(PropertyResponse::from).toList(),
                page.total(),
                page.limit(),
                page.offset(),
                page.sortBy().value(),
                page.sortDirection().value());
    }

    public record PropertyResponse(
            long id,
            double squareFootage,
            int bedrooms,
            double bathrooms,
            int yearBuilt,
            double lotSize,
            double distanceToCityCenter,
            double schoolRating,
            long price) {
        private static PropertyResponse from(PropertyRecord property) {
            return new PropertyResponse(
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
