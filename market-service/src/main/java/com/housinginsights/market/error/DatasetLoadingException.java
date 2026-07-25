package com.housinginsights.market.error;

public class DatasetLoadingException extends RuntimeException {
    public DatasetLoadingException(String message) {
        super(message);
    }

    public DatasetLoadingException(String message, Throwable cause) {
        super(message, cause);
    }
}
