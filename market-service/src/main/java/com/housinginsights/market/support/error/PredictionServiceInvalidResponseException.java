package com.housinginsights.market.support.error;

public class PredictionServiceInvalidResponseException extends RuntimeException {
    public PredictionServiceInvalidResponseException(String message) {
        super(message);
    }

    public PredictionServiceInvalidResponseException(
            String message,
            Throwable cause
    ) {
        super(message, cause);
    }
}
