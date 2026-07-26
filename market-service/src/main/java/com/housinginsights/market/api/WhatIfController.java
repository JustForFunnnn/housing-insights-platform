package com.housinginsights.market.api;

import com.housinginsights.market.api.schema.WhatIfRequest;
import com.housinginsights.market.api.schema.WhatIfResponse;
import com.housinginsights.market.application.WhatIfService;
import com.housinginsights.market.metadata.PropertyMetadata;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

@MarketApiController
public class WhatIfController {
    private final WhatIfService whatIfService;
    private final PropertyMetadata propertyMetadata;

    public WhatIfController(
            WhatIfService whatIfService,
            PropertyMetadata propertyMetadata) {
        this.whatIfService = whatIfService;
        this.propertyMetadata = propertyMetadata;
    }

    @PostMapping("/what-if")
    public WhatIfResponse whatIf(@Valid @RequestBody WhatIfRequest request) {
        var baseline = request.baseline().toFeatures(propertyMetadata);
        var result = whatIfService.compare(
                baseline,
                request.scenarios().stream()
                        .map(item -> item.applyTo(baseline, propertyMetadata))
                        .toList());
        return WhatIfResponse.from(result);
    }
}
