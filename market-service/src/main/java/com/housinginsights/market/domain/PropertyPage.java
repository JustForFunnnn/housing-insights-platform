package com.housinginsights.market.domain;

import java.util.List;

public record PropertyPage(
        List<PropertyRecord> records,
        int count,
        long total,
        int page,
        int size,
        int totalPages,
        SortField sortBy,
        SortDirection sortDirection
) {
    public PropertyPage {
        records = List.copyOf(records);
    }
}
