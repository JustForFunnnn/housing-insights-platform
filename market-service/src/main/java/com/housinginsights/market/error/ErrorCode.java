package com.housinginsights.market.error;

public enum ErrorCode {
    VALIDATION_ERROR("validation_error"),
    PREDICTION_SERVICE_UNAVAILABLE("prediction_service_unavailable"),
    PREDICTION_SERVICE_INVALID_RESPONSE("prediction_service_invalid_response"),
    HTTP_ERROR("http_error"),
    INTERNAL_ERROR("internal_error");

    private final String value;

    ErrorCode(String value) {
        this.value = value;
    }

    public String value() {
        return value;
    }
}
