package com.housinginsights.market.api.schema;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.List;

public record WhatIfRequest(
        @NotNull @Valid PropertyFeaturesRequest baseline,

        @NotEmpty @Size(max = WhatIfRequest.MAX_SCENARIOS) List<@NotNull @Valid PropertyFeaturesRequest> scenarios) {
    public static final int MAX_SCENARIOS = 19;

    public WhatIfRequest {
        scenarios = scenarios == null ? null : List.copyOf(scenarios);
    }
}
