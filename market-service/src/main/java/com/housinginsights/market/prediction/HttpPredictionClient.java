package com.housinginsights.market.prediction;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.housinginsights.market.domain.PropertyFeatures;
import com.housinginsights.market.support.error.PredictionServiceInvalidResponseException;
import com.housinginsights.market.support.error.PredictionServiceUnavailableException;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

@Component
public class HttpPredictionClient implements PredictionClient {
    private final RestClient restClient;

    public HttpPredictionClient(RestClient predictionRestClient) {
        this.restClient = predictionRestClient;
    }

    @Override
    public List<Long> predict(List<PropertyFeatures> properties) {
        try {
            var response = restClient.post()
                    .uri("/predict")
                    .contentType(MediaType.APPLICATION_JSON)
                    .accept(MediaType.APPLICATION_JSON)
                    .body(new PredictionRequest(properties.stream()
                            .map(PredictionInstance::from)
                            .toList()))
                    .retrieve()
                    .onStatus(
                            status -> status.is5xxServerError(),
                            (request, downstream) -> {
                                throw new PredictionServiceUnavailableException(
                                        "prediction service returned a server error"
                                );
                            }
                    )
                    .onStatus(
                            status -> status.is4xxClientError(),
                            (request, downstream) -> {
                                throw new PredictionServiceInvalidResponseException(
                                        "prediction service rejected the request"
                                );
                            }
                    )
                    .toEntity(PredictionResponse.class);

            if (response.getStatusCode() != HttpStatus.OK) {
                throw new PredictionServiceInvalidResponseException(
                        "prediction service returned an unexpected status"
                );
            }
            return validateResponse(response.getBody(), properties.size());
        } catch (PredictionServiceUnavailableException
                 | PredictionServiceInvalidResponseException exception) {
            throw exception;
        } catch (ResourceAccessException exception) {
            throw new PredictionServiceUnavailableException(
                    "prediction service request failed",
                    exception
            );
        } catch (RestClientException exception) {
            throw new PredictionServiceInvalidResponseException(
                    "prediction service response could not be decoded",
                    exception
            );
        }
    }

    private static List<Long> validateResponse(
            PredictionResponse response,
            int expectedCount
    ) {
        if (response == null
                || response.predictions() == null
                || response.count() != expectedCount
                || response.predictions().size() != expectedCount
                || response.predictions().stream().anyMatch(
                value -> value == null || value < 0
        )) {
            throw new PredictionServiceInvalidResponseException(
                    "prediction service returned an invalid prediction batch"
            );
        }
        return List.copyOf(response.predictions());
    }

    private record PredictionRequest(List<PredictionInstance> instances) {
        private PredictionRequest {
            instances = List.copyOf(instances);
        }
    }

    private record PredictionInstance(
            @JsonProperty("square_footage") double squareFootage,
            int bedrooms,
            double bathrooms,
            @JsonProperty("year_built") int yearBuilt,
            @JsonProperty("lot_size") double lotSize,
            @JsonProperty("distance_to_city_center")
            double distanceToCityCenter,
            @JsonProperty("school_rating") double schoolRating
    ) {
        private static PredictionInstance from(PropertyFeatures features) {
            return new PredictionInstance(
                    features.squareFootage(),
                    features.bedrooms(),
                    features.bathrooms(),
                    features.yearBuilt(),
                    features.lotSize(),
                    features.distanceToCityCenter(),
                    features.schoolRating()
            );
        }
    }

    private record PredictionResponse(List<Long> predictions, int count) {
    }
}
