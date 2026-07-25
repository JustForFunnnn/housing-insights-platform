package com.housinginsights.market.api;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.matchesPattern;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.housinginsights.market.error.PredictionServiceUnavailableException;
import com.housinginsights.market.observability.RequestCorrelation;
import com.housinginsights.market.prediction.PredictionClient;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.system.CapturedOutput;
import org.springframework.boot.test.system.OutputCaptureExtension;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest(
        properties = {
            "market.dataset-path=src/test/resources/test-dataset.csv",
            "market.property-metadata-path=../contracts/property-field-metadata.json",
            "market.prediction.base-url=http://prediction.test",
            "market.prediction.timeout=1s"
        })
@AutoConfigureMockMvc
@ExtendWith(OutputCaptureExtension.class)
class HttpContractTest {
    private static final String HYPHENATED_REQUEST_ID = "123E4567-E89B-42D3-A456-426614174000";
    private static final String COMPACT_REQUEST_ID = "123e4567e89b42d3a456426614174000";

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private PredictionClient predictionClient;

    @Test
    void healthPreservesValidRequestIdsOrGeneratesCompactRequestIds() throws Exception {
        mockMvc.perform(get("/api/v1/health")
                        .header(
                                RequestCorrelation.HEADER_NAME,
                                HYPHENATED_REQUEST_ID))
                .andExpect(status().isOk())
                .andExpect(header().string(RequestCorrelation.HEADER_NAME, HYPHENATED_REQUEST_ID))
                .andExpect(jsonPath("$.status").value("ok"));

        mockMvc.perform(get("/api/v1/health")
                        .header(
                                RequestCorrelation.HEADER_NAME,
                                COMPACT_REQUEST_ID))
                .andExpect(status().isOk())
                .andExpect(header().string(RequestCorrelation.HEADER_NAME, COMPACT_REQUEST_ID));

        mockMvc.perform(get("/api/v1/health"))
                .andExpect(status().isOk())
                .andExpect(header().string(
                                RequestCorrelation.HEADER_NAME,
                                matchesPattern("^[0-9a-f]{12}4[0-9a-f]{3}[89ab][0-9a-f]{15}$")));
    }

    @Test
    void csvValidationErrorsOverrideBinaryAcceptWithJson() throws Exception {
        mockMvc.perform(get("/api/v1/market/exports/csv")
                        .param("sort_by", "not_a_field")
                        .accept(MediaType.parseMediaType("text/csv")))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.error_code").value("validation_error"))
                .andExpect(jsonPath("$.message").value("Request validation failed."))
                .andExpect(header().exists(RequestCorrelation.HEADER_NAME));
    }

    @Test
    void validationAndHttpErrorsUseFlatContract(CapturedOutput output) throws Exception {
        mockMvc.perform(get("/api/v1/market/properties").param("limit", "0"))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.error_code").value("validation_error"))
                .andExpect(jsonPath("$.message").value("Request validation failed."))
                .andExpect(header().exists(RequestCorrelation.HEADER_NAME));

        mockMvc.perform(get("/missing"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error_code").value("http_error"))
                .andExpect(jsonPath("$.message").value("The request could not be completed."));

        mockMvc.perform(get("/api/v1/market/properties")
                        .param("bathrooms", "101"))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.error_code").value("validation_error"));

        assertThat(output)
                .contains(
                        "request_validation_failed method=GET "
                                + "path=/api/v1/market/properties error=");
    }

    @Test
    void propertiesUseLimitOffsetPagination() throws Exception {
        mockMvc.perform(get("/api/v1/market/properties")
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
    void analysisReturnsPublicResponse() throws Exception {
        mockMvc.perform(get("/api/v1/market/analysis"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.count").value(4))
                .andExpect(jsonPath("$.price_summary.average").isNumber())
                .andExpect(jsonPath("$.visualisations.price_distribution").isArray())
                .andExpect(jsonPath("$.filter_options.square_footage.minimum").isNumber());
    }

    @Test
    void metadataReturnsSharedFieldsAndFullDatasetFilterOptions()
            throws Exception {
        mockMvc.perform(get("/api/v1/market/metadata"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.fields.square_footage.type")
                        .doesNotExist())
                .andExpect(jsonPath("$.fields.square_footage.minimum")
                        .doesNotExist())
                .andExpect(jsonPath("$.fields.square_footage.min").value(1))
                .andExpect(jsonPath("$.fields.square_footage.max")
                        .value(100000))
                .andExpect(jsonPath("$.fields.square_footage.step")
                        .doesNotExist())
                .andExpect(jsonPath("$.fields.square_footage.unit")
                        .value("sq_ft"))
                .andExpect(jsonPath("$.filter_options.bedrooms.length()")
                        .value(3))
                .andExpect(jsonPath("$.filter_options.price.minimum")
                        .value(150000))
                .andExpect(jsonPath("$.filter_options.price.maximum")
                        .value(450000));
    }

    @Test
    void propertiesAnalysisAndCsvShareTheSameCompleteFilterResult()
            throws Exception {
        mockMvc.perform(get("/api/v1/market/properties")
                        .param("bedrooms", "3")
                        .param("limit", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.records.length()").value(1))
                .andExpect(jsonPath("$.total").value(2));

        mockMvc.perform(get("/api/v1/market/analysis")
                        .param("bedrooms", "3"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.count").value(2));

        String csv = mockMvc.perform(get("/api/v1/market/exports/csv")
                        .param("bedrooms", "3")
                        .param("limit", "1")
                        .param("sort_by", "id"))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();
        assertThat(csv.lines()).hasSize(3);
        assertThat(csv).contains("\n2,").contains("\n3,");
    }

    @Test
    void oldAndPdfRoutesAreNotExposed() throws Exception {
        for (String path :
                List.of(
                        "/health",
                        "/properties",
                        "/analysis",
                        "/exports/properties.csv",
                        "/exports/market-analysis.pdf",
                        "/api/v1/market/exports/market-analysis.pdf")) {
            mockMvc.perform(get(path)).andExpect(status().isNotFound());
        }
        mockMvc.perform(post("/what-if")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(validWhatIfJson()))
                .andExpect(status().isNotFound());
    }

    @Test
    void openApiUsesPublicContractNames() throws Exception {
        String featureProperties = "$.components.schemas.PropertyFeaturesRequest.properties";

        mockMvc.perform(get("/v3/api-docs"))
                .andExpect(status().isOk())
                .andExpect(jsonPath(featureProperties + ".square_footage").exists())
                .andExpect(jsonPath(featureProperties + ".squareFootage").doesNotExist())
                .andExpect(
                        jsonPath("$.components.schemas.MarketAnalysisResponse").exists())
                .andExpect(jsonPath("$.components.schemas.PropertyPageResponse").exists())
                .andExpect(jsonPath("$.components.schemas.WhatIfResponse").exists())
                .andExpect(jsonPath("$.paths['/api/v1/market/metadata'].get")
                        .exists())
                .andExpect(jsonPath("$.paths['/api/v1/market/exports/csv'].get")
                        .exists())
                .andExpect(jsonPath(
                                "$.paths['/api/v1/market/exports/market-analysis.pdf']")
                        .doesNotExist())
                .andExpect(jsonPath(
                                "$.paths['/api/v1/market/properties'].get.parameters"
                                        + "[?(@.name == 'limit')]")
                        .isNotEmpty())
                .andExpect(jsonPath(
                                "$.paths['/api/v1/market/properties'].get.parameters"
                                        + "[?(@.name == 'offset')]")
                        .isNotEmpty())
                .andExpect(jsonPath(
                                "$.paths['/api/v1/market/analysis'].get.parameters"
                                        + "[?(@.name == 'min_square_footage')]")
                        .isNotEmpty())
                .andExpect(jsonPath(
                                "$.paths['/api/v1/market/analysis'].get.parameters"
                                        + "[?(@.name == 'minSquareFootage')]")
                        .isEmpty());
    }

    @Test
    void whatIfRejectsJsonCoercionAndPropagatesRequestId() throws Exception {
        mockMvc.perform(post("/api/v1/market/what-if")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(validWhatIfJson().replace("\"square_footage\": 1850", "\"square_footage\": \"1850\"")))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.error_code").value("validation_error"))
                .andExpect(jsonPath("$.message").value("Request validation failed."));

        when(predictionClient.predict(anyList())).thenAnswer(invocation -> {
            org.assertj.core.api.Assertions.assertThat(RequestCorrelation.currentOrCreate())
                    .isEqualTo(HYPHENATED_REQUEST_ID);
            return List.of(200000L, 220000L);
        });

        mockMvc.perform(post("/api/v1/market/what-if")
                        .header(RequestCorrelation.HEADER_NAME, HYPHENATED_REQUEST_ID)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(validWhatIfJson()))
                .andExpect(status().isOk())
                .andExpect(header().string(RequestCorrelation.HEADER_NAME, HYPHENATED_REQUEST_ID))
                .andExpect(jsonPath("$.baseline_prediction").value(200000))
                .andExpect(jsonPath("$.scenarios[0].price_difference").value(20000))
                .andExpect(jsonPath("$.scenarios").isArray());
    }

    @Test
    void predictionFailureLogsRootCause(CapturedOutput output) throws Exception {
        var rootCause = new IllegalStateException("connection refused");
        var error = new PredictionServiceUnavailableException("prediction service request failed", rootCause);
        when(predictionClient.predict(anyList())).thenThrow(error);

        mockMvc.perform(post("/api/v1/market/what-if")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(validWhatIfJson()))
                .andExpect(status().isServiceUnavailable())
                .andExpect(jsonPath("$.error_code").value("prediction_service_unavailable"))
                .andExpect(jsonPath("$.message").value("Price estimation is temporarily unavailable."));

        assertThat(output)
                .contains("prediction_unavailable error=prediction service request failed")
                .contains("Caused by: java.lang.IllegalStateException: connection refused");
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
