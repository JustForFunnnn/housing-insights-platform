package com.housinginsights.market.error;

public class PropertyMetadataException extends RuntimeException {
    public PropertyMetadataException(String message) {
        super(message);
    }

    public PropertyMetadataException(String message, Throwable cause) {
        super(message, cause);
    }
}
