package com.housinginsights.market.error;

public record ApiError(ErrorCode errorCode, String message) {
}
