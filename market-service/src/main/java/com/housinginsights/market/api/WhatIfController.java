package com.housinginsights.market.api;

import com.housinginsights.market.api.schema.PropertyFeaturesRequest;
import com.housinginsights.market.api.schema.WhatIfRequest;
import com.housinginsights.market.api.schema.WhatIfResponse;
import com.housinginsights.market.application.WhatIfService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class WhatIfController {
    private final WhatIfService whatIfService;

    public WhatIfController(WhatIfService whatIfService) {
        this.whatIfService = whatIfService;
    }

    @PostMapping("/what-if")
    public WhatIfResponse whatIf(@Valid @RequestBody WhatIfRequest request) {
        var result = whatIfService.compare(
                request.baseline().toFeatures(),
                request.scenarios().stream()
                        .map(PropertyFeaturesRequest::toFeatures)
                        .toList());
        return WhatIfResponse.from(result);
    }
}
