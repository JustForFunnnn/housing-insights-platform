package com.housinginsights.market.api;

import static org.hamcrest.Matchers.matchesPattern;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.housinginsights.market.prediction.PredictionClient;
import com.housinginsights.market.support.observability.RequestCorrelation;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest(properties = {
        "market.dataset-path=src/test/resources/test-dataset.csv",
        "market.prediction.base-url=http://prediction.test",
        "market.prediction.timeout=1s"
})
@AutoConfigureMockMvc
class HttpContractTest {
    private static final String HYPHENATED_REQUEST_ID =
            "123E4567-E89B-42D3-A456-426614174000";
    private static final String COMPACT_REQUEST_ID =
            "123e4567e89b42d3a456426614174000";

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private PredictionClient predictionClient;

    @Test
    void healthPreservesValidRequestIdsOrGeneratesCompactRequestIds() throws Exception {
        mockMvc.perform(get("/health")
                        .header(
                                RequestCorrelation.HEADER_NAME,
                                HYPHENATED_REQUEST_ID
                        ))
                .andExpect(status().isOk())
                .andExpect(header().string(
                        RequestCorrelation.HEADER_NAME,
                        HYPHENATED_REQUEST_ID
                ))
                .andExpect(jsonPath("$.status").value("ok"));

        mockMvc.perform(get("/health")
                        .header(
                                RequestCorrelation.HEADER_NAME,
                                COMPACT_REQUEST_ID
                        ))
                .andExpect(status().isOk())
                .andExpect(header().string(
                        RequestCorrelation.HEADER_NAME,
                        COMPACT_REQUEST_ID
                ));

        mockMvc.perform(get("/health"))
                .andExpect(status().isOk())
                .andExpect(header().string(
                        RequestCorrelation.HEADER_NAME,
                        matchesPattern("^[0-9a-f]{12}4[0-9a-f]{3}[89ab][0-9a-f]{15}$")
                ));
    }

    @Test
    void exportValidationErrorsOverrideBinaryAcceptWithJson() throws Exception {
        mockMvc.perform(get("/exports/market-analysis.pdf")
                        .param("min_price", "300000")
                        .param("max_price", "200000")
                        .accept(MediaType.APPLICATION_PDF))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.error_code").value("validation_error"))
                .andExpect(jsonPath("$.message")
                        .value("Request validation failed."))
                .andExpect(header().exists(RequestCorrelation.HEADER_NAME));

        mockMvc.perform(get("/exports/properties.csv")
                        .param("sort_by", "not_a_field")
                        .accept(MediaType.parseMediaType("text/csv")))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.error_code").value("validation_error"))
                .andExpect(jsonPath("$.message")
                        .value("Request validation failed."))
                .andExpect(header().exists(RequestCorrelation.HEADER_NAME));
    }

    @Test
    void validationAndHttpErrorsUseFlatSafeContract() throws Exception {
        mockMvc.perform(get("/properties").param("limit", "0"))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.error_code").value("validation_error"))
                .andExpect(jsonPath("$.message")
                        .value("Request validation failed."))
                .andExpect(header().exists(RequestCorrelation.HEADER_NAME));

        mockMvc.perform(get("/missing"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error_code").value("http_error"))
                .andExpect(jsonPath("$.message")
                        .value("The request could not be completed."));
    }

    @Test
    void propertiesUseLimitOffsetPagination() throws Exception {
        mockMvc.perform(get("/properties")
                        .param("sort_by", "id")
                        .param("limit", "1")
                        .param("offset", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.records[0].id").value(2))
                .andExpect(jsonPath("$.count").doesNotExist())
                .andExpect(jsonPath("$.total").value(4))
                .andExpect(jsonPath("$.limit").value(1))
                .andExpect(jsonPath("$.offset").value(1))
                .andExpect(jsonPath("$.page").doesNotExist())
                .andExpect(jsonPath("$.size").doesNotExist())
                .andExpect(jsonPath("$.total_pages").doesNotExist());
    }

    @Test
    void openApiUsesPublicContractNames() throws Exception {
        String featureProperties =
                "$.components.schemas.PropertyFeaturesRequest.properties";

        mockMvc.perform(get("/v3/api-docs"))
                .andExpect(status().isOk())
                .andExpect(jsonPath(
                        featureProperties + ".square_footage"
                ).exists())
                .andExpect(jsonPath(
                        featureProperties + ".distance_to_city_center"
                ).exists())
                .andExpect(jsonPath(
                        featureProperties + ".squareFootage"
                ).doesNotExist())
                .andExpect(jsonPath(
                        "$.components.schemas.MarketAnalysis"
                                + ".properties.price_summary"
                ).exists())
                .andExpect(jsonPath(
                        "$.components.schemas.PropertyPage"
                                + ".properties.limit"
                ).exists())
                .andExpect(jsonPath(
                        "$.components.schemas.PropertyPage"
                                + ".properties.offset"
                ).exists())
                .andExpect(jsonPath(
                        "$.components.schemas.PropertyPage"
                                + ".properties.total_pages"
                ).doesNotExist())
                .andExpect(jsonPath(
                        "$.paths['/properties'].get.parameters"
                                + "[?(@.name == 'limit')]"
                ).isNotEmpty())
                .andExpect(jsonPath(
                        "$.paths['/properties'].get.parameters"
                                + "[?(@.name == 'offset')]"
                ).isNotEmpty())
                .andExpect(jsonPath(
                        "$.paths['/analysis'].get.parameters"
                                + "[?(@.name == 'min_square_footage')]"
                ).isNotEmpty())
                .andExpect(jsonPath(
                        "$.paths['/analysis'].get.parameters"
                                + "[?(@.name == 'minSquareFootage')]"
                ).isEmpty());
    }

    @Test
    void whatIfRejectsJsonCoercionAndPropagatesRequestId() throws Exception {
        mockMvc.perform(post("/what-if")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(validWhatIfJson().replace(
                                "\"square_footage\": 1850",
                                "\"square_footage\": \"1850\""
                        )))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.error_code").value("validation_error"));

        when(predictionClient.predict(anyList())).thenAnswer(invocation -> {
            org.assertj.core.api.Assertions.assertThat(
                    RequestCorrelation.currentOrCreate()
            ).isEqualTo(HYPHENATED_REQUEST_ID);
            return List.of(200000L, 220000L);
        });

        mockMvc.perform(post("/what-if")
                        .header(
                                RequestCorrelation.HEADER_NAME,
                                HYPHENATED_REQUEST_ID
                        )
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(validWhatIfJson()))
                .andExpect(status().isOk())
                .andExpect(header().string(
                        RequestCorrelation.HEADER_NAME,
                        HYPHENATED_REQUEST_ID
                ))
                .andExpect(jsonPath("$.baseline_prediction").value(200000))
                .andExpect(jsonPath("$.scenarios[0].price_difference")
                        .value(20000))
                .andExpect(jsonPath("$.scenarios").isArray());
    }

    private static String validWhatIfJson() {
        return """
                {
                  "baseline": {
                    "square_footage": 1850,
                    "bedrooms": 3,
                    "bathrooms": 2,
                    "year_built": 1998,
                    "lot_size": 7500,
                    "distance_to_city_center": 5.6,
                    "school_rating": 8.2
                  },
                  "scenarios": [
                    {
                      "square_footage": 2100,
                      "bedrooms": 3,
                      "bathrooms": 2,
                      "year_built": 1998,
                      "lot_size": 7500,
                      "distance_to_city_center": 5.6,
                      "school_rating": 8.2
                    }
                  ]
                }
                """;
    }
}
