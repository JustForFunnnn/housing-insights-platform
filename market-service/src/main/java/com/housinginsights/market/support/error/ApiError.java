package com.housinginsights.market.support.error;

public record ApiError(ErrorCode errorCode, String message) {
}
