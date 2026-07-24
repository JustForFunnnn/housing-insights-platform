package com.housinginsights.market.api;

import com.housinginsights.market.domain.WhatIfResult;
import com.housinginsights.market.domain.WhatIfService;
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
    public WhatIfResult whatIf(@Valid @RequestBody WhatIfRequest request) {
        return whatIfService.compare(
                request.baseline().toFeatures(),
                request.scenarios().stream()
                        .map(PropertyFeaturesRequest::toFeatures)
                        .toList()
        );
    }
}
