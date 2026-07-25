package com.housinginsights.market.api;

import com.housinginsights.market.api.schema.PropertyFeaturesRequest;
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
        var result = whatIfService.compare(
                request.baseline().toFeatures(propertyMetadata),
                request.scenarios().stream()
                        .map(item -> item.toFeatures(propertyMetadata))
                        .toList());
        return WhatIfResponse.from(result);
    }
}
