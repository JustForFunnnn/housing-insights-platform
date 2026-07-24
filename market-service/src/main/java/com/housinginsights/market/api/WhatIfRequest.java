package com.housinginsights.market.api;

import com.housinginsights.market.domain.DomainLimits;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.List;

public record WhatIfRequest(
        @NotNull
        @Valid
        PropertyFeaturesRequest baseline,

        @NotEmpty
        @Size(max = DomainLimits.MAX_WHAT_IF_SCENARIOS)
        List<@NotNull @Valid PropertyFeaturesRequest> scenarios
) {
    public WhatIfRequest {
        scenarios = scenarios == null ? null : List.copyOf(scenarios);
    }
}
