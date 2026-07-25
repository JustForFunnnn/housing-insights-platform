package com.housinginsights.market.error;

public class PredictionServiceUnavailableException extends RuntimeException {
    public PredictionServiceUnavailableException(String message) {
        super(message);
    }

    public PredictionServiceUnavailableException(String message, Throwable cause) {
        super(message, cause);
    }
}
