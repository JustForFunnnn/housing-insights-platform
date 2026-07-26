package com.housinginsights.market.api;

import com.housinginsights.market.api.schema.WhatIfRequest;
import com.housinginsights.market.api.schema.WhatIfResponse;
import com.housinginsights.market.application.WhatIfService;
import com.housinginsights.market.metadata.PropertyMetadata;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.ExampleObject;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.Valid;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

@MarketApiController
public class WhatIfController {
    private static final String OPEN_API_REQUEST_EXAMPLE = """
            {
              "baseline": {
                "square_footage": 1850,
                "bedrooms": 3,
                "bathrooms": 2.5,
                "year_built": 2005,
                "lot_size": 7500,
                "distance_to_city_center": 8.5,
                "school_rating": 8.2
              },
              "scenarios": [
                {
                  "school_rating": 9
                }
              ]
            }
            """;

    private final WhatIfService whatIfService;
    private final PropertyMetadata propertyMetadata;

    public WhatIfController(WhatIfService whatIfService, PropertyMetadata propertyMetadata) {
        this.whatIfService = whatIfService;
        this.propertyMetadata = propertyMetadata;
    }

    @PostMapping("/what-if")
    public WhatIfResponse whatIf(
            @io.swagger.v3.oas.annotations.parameters.RequestBody(
                            required = true,
                            content =
                                    @Content(
                                            mediaType = MediaType.APPLICATION_JSON_VALUE,
                                            schema = @Schema(implementation = WhatIfRequest.class),
                                            examples =
                                                    @ExampleObject(
                                                            name = "validRequest",
                                                            summary = "Compare a higher school rating",
                                                            value = OPEN_API_REQUEST_EXAMPLE)))
                    @Valid
                    @RequestBody
                    WhatIfRequest request) {
        var baseline = request.baseline().toFeatures(propertyMetadata);
        var result = whatIfService.compare(
                baseline,
                request.scenarios().stream()
                        .map(item -> item.applyTo(baseline, propertyMetadata))
                        .toList());
        return WhatIfResponse.from(result);
    }
}
