package com.housinginsights.market.api.schema;

import com.housinginsights.market.domain.PropertyFieldNames;
import com.housinginsights.market.domain.SortDirection;
import com.housinginsights.market.domain.SortField;
import io.swagger.v3.oas.annotations.media.Schema;

public record MarketSortQuery(
        @Schema(defaultValue = MarketSortQuery.DEFAULT_SORT_BY)
        String sortBy,

        @Schema(defaultValue = MarketSortQuery.DEFAULT_SORT_DIRECTION)
        String sortDirection) {
    public static final String DEFAULT_SORT_BY = PropertyFieldNames.ID;
    public static final String DEFAULT_SORT_DIRECTION = SortDirection.ASC_VALUE;

    public MarketSortQuery {
        sortBy = sortBy == null ? DEFAULT_SORT_BY : sortBy;
        sortDirection = sortDirection == null ? DEFAULT_SORT_DIRECTION : sortDirection;
    }

    public SortField toSortField() {
        return SortField.parse(sortBy);
    }

    public SortDirection toSortDirection() {
        return SortDirection.parse(sortDirection);
    }
}
