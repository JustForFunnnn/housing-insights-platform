package com.housinginsights.market.domain;

import java.util.List;

public record PropertyPage(
        List<Property> properties, long total, int limit, int offset, SortField sortBy, SortDirection sortDirection) {
    public PropertyPage {
        properties = List.copyOf(properties);
    }
}
