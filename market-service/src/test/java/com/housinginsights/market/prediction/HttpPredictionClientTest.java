package com.housinginsights.market.prediction;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.content;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.header;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withStatus;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.MapperFeature;
import com.fasterxml.jackson.databind.PropertyNamingStrategies;
import com.fasterxml.jackson.databind.json.JsonMapper;
import com.housinginsights.market.domain.PropertyFeatures;
import com.housinginsights.market.support.error.PredictionServiceInvalidResponseException;
import com.housinginsights.market.support.error.PredictionServiceUnavailableException;
import com.housinginsights.market.support.observability.RequestCorrelation;
import java.util.List;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.slf4j.MDC;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.converter.json.MappingJackson2HttpMessageConverter;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;

class HttpPredictionClientTest {
    private static final String REQUEST_ID =
            "123e4567-e89b-42d3-a456-426614174000";

    private MockRestServiceServer server;
    private HttpPredictionClient client;

    @BeforeEach
    void setUp() {
        var mapper = JsonMapper.builder()
                .propertyNamingStrategy(PropertyNamingStrategies.SNAKE_CASE)
                .enable(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES)
                .disable(DeserializationFeature.ACCEPT_FLOAT_AS_INT)
                .disable(MapperFeature.ALLOW_COERCION_OF_SCALARS)
                .build();
        RestClient.Builder builder = RestClient.builder()
                .baseUrl("http://prediction.test")
                .messageConverters(converters -> {
                    converters.removeIf(
                            MappingJackson2HttpMessageConverter.class::isInstance
                    );
                    converters.add(new MappingJackson2HttpMessageConverter(mapper));
                })
                .requestInterceptor((request, body, execution) -> {
                    request.getHeaders().set(
                            RequestCorrelation.HEADER_NAME,
                            RequestCorrelation.currentOrCreate()
                    );
                    return execution.execute(request, body);
                });
        server = MockRestServiceServer.bindTo(builder).build();
        client = new HttpPredictionClient(builder.build());
        MDC.put(RequestCorrelation.MDC_KEY, REQUEST_ID);
    }

    @AfterEach
    void tearDown() {
        MDC.clear();
    }

    @Test
    void sendsOrderedBatchAndRequestId() {
        server.expect(requestTo("http://prediction.test/predict"))
                .andExpect(header(RequestCorrelation.HEADER_NAME, REQUEST_ID))
                .andExpect(content().json("""
                        {
                          "instances": [
                            {
                              "square_footage": 1850.0,
                              "bedrooms": 3,
                              "bathrooms": 2.0,
                              "year_built": 1998,
                              "lot_size": 7500.0,
                              "distance_to_city_center": 5.6,
                              "school_rating": 8.2
                            }
                          ]
                        }
                        """))
                .andRespond(withSuccess(
                        "{\"predictions\":[265000]}",
                        MediaType.APPLICATION_JSON
                ));

        List<Long> predictions = client.predict(List.of(validFeatures()));

        assertThat(predictions).containsExactly(265000L);
        server.verify();
    }

    @Test
    void mapsServerFailureToUnavailable() {
        server.expect(requestTo("http://prediction.test/predict"))
                .andRespond(withStatus(HttpStatus.SERVICE_UNAVAILABLE));

        assertThatThrownBy(() -> client.predict(List.of(validFeatures())))
                .isInstanceOf(PredictionServiceUnavailableException.class);
    }

    @Test
    void rejectsRepresentativeInvalidResponses() {
        server.expect(requestTo("http://prediction.test/predict"))
                .andRespond(withSuccess(
                        "{\"predictions\":[]}",
                        MediaType.APPLICATION_JSON
                ));

        assertThatThrownBy(() -> client.predict(List.of(validFeatures())))
                .isInstanceOf(PredictionServiceInvalidResponseException.class);
    }

    @Test
    void mapsRejectedRequestToInvalidResponse() {
        server.expect(requestTo("http://prediction.test/predict"))
                .andRespond(withStatus(HttpStatus.UNPROCESSABLE_ENTITY));

        assertThatThrownBy(() -> client.predict(List.of(validFeatures())))
                .isInstanceOf(PredictionServiceInvalidResponseException.class);
    }

    private static PropertyFeatures validFeatures() {
        return new PropertyFeatures(1850, 3, 2, 1998, 7500, 5.6, 8.2);
    }
}
