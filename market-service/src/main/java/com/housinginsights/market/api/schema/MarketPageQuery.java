package com.housinginsights.market.api.schema;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;

public record MarketPageQuery(
        @Min(1) @Max(MarketPageQuery.MAX_LIMIT) @Schema(defaultValue = "20")
        Integer limit,

        @Min(0) @Schema(defaultValue = "0") Integer offset) {
    public static final int MAX_LIMIT = 100;
    public static final int DEFAULT_LIMIT = 20;
    public static final int DEFAULT_OFFSET = 0;

    public MarketPageQuery {
        limit = limit == null ? DEFAULT_LIMIT : limit;
        offset = offset == null ? DEFAULT_OFFSET : offset;
    }
}
