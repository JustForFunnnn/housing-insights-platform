package com.housinginsights.market.prediction;

import com.housinginsights.market.domain.PropertyFeatures;
import com.housinginsights.market.support.error.PredictionServiceInvalidResponseException;
import com.housinginsights.market.support.error.PredictionServiceUnavailableException;
import java.util.List;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
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
        var response = request(
                HttpMethod.POST,
                "/predict",
                new PredictionRequest(properties.stream().map(PredictionInstance::from).toList()),
                PredictionResponse.class
        );

        if (response.getStatusCode() != HttpStatus.OK) {
            throw new PredictionServiceInvalidResponseException("prediction service returned an unexpected status");
        }
        var responseBody = response.getBody();
        validatePredictionResponse(responseBody, properties.size());
        return List.copyOf(responseBody.predictions());
    }

    private <T> ResponseEntity<T> request(HttpMethod method, String path, Object payload, Class<T> responseType) {
        try {
            var requestSpec = restClient.method(method).uri(path).accept(MediaType.APPLICATION_JSON);
            if (payload != null) {
                requestSpec.contentType(MediaType.APPLICATION_JSON).body(payload);
            }
            return requestSpec
                    .retrieve()
                    .onStatus(status -> status.is5xxServerError(), (request, downstream) -> {
                        throw new PredictionServiceUnavailableException("prediction service returned a server error");
                    })
                    .onStatus(status -> status.is4xxClientError(), (request, downstream) -> {
                        throw new PredictionServiceInvalidResponseException("prediction service rejected the request");
                    })
                    .toEntity(responseType);
        } catch (PredictionServiceUnavailableException | PredictionServiceInvalidResponseException exception) {
            throw exception;
        } catch (ResourceAccessException exception) {
            throw new PredictionServiceUnavailableException("prediction service request failed", exception);
        } catch (RestClientException exception) {
            throw new PredictionServiceInvalidResponseException(
                    "prediction service response could not be decoded", exception);
        }
    }

    private static void validatePredictionResponse(PredictionResponse response, int expectedCount) {
        if (response == null
                || response.predictions() == null
                || response.count() != expectedCount
                || response.predictions().size() != expectedCount
                || response.predictions().stream().anyMatch(value -> value == null || value < 0)) {
            throw new PredictionServiceInvalidResponseException(
                    "prediction service returned an invalid prediction batch");
        }
    }

    private record PredictionRequest(List<PredictionInstance> instances) {
        private PredictionRequest {
            instances = List.copyOf(instances);
        }
    }

    private record PredictionInstance(
            double squareFootage,
            int bedrooms,
            double bathrooms,
            int yearBuilt,
            double lotSize,
            double distanceToCityCenter,
            double schoolRating
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
