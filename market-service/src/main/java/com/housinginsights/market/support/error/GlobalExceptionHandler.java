package com.housinginsights.market.support.error;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.ConstraintViolationException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.validation.BindException;
import org.springframework.web.HttpMediaTypeNotAcceptableException;
import org.springframework.web.HttpMediaTypeNotSupportedException;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.HandlerMethodValidationException;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.servlet.resource.NoResourceFoundException;

@RestControllerAdvice
public class GlobalExceptionHandler {
    private static final Logger LOGGER =
            LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler({
            MethodArgumentNotValidException.class,
            HandlerMethodValidationException.class,
            ConstraintViolationException.class,
            MethodArgumentTypeMismatchException.class,
            HttpMessageNotReadableException.class,
            MissingServletRequestParameterException.class,
            InvalidRequestException.class,
            BindException.class
    })
    public ResponseEntity<ApiError> validationError(HttpServletRequest request, Exception exception) {
        LOGGER.info(
                "request_validation_failed method={} path={} error={}",
                request.getMethod(), request.getRequestURI(), exception.toString()
        );
        return response(
                HttpStatus.UNPROCESSABLE_ENTITY,
                ErrorCode.VALIDATION_ERROR,
                "Request validation failed."
        );
    }

    @ExceptionHandler(PredictionServiceUnavailableException.class)
    public ResponseEntity<ApiError> predictionUnavailable(
            PredictionServiceUnavailableException exception
    ) {
        LOGGER.error("prediction_unavailable error={}", exception.getMessage(), exception);
        return response(
                HttpStatus.SERVICE_UNAVAILABLE,
                ErrorCode.PREDICTION_SERVICE_UNAVAILABLE,
                "Price estimation is temporarily unavailable."
        );
    }

    @ExceptionHandler(PredictionServiceInvalidResponseException.class)
    public ResponseEntity<ApiError> predictionInvalid(
            PredictionServiceInvalidResponseException exception
    ) {
        LOGGER.error("prediction_invalid_response error={}", exception.getMessage(), exception);
        return response(
                HttpStatus.BAD_GATEWAY,
                ErrorCode.PREDICTION_SERVICE_INVALID_RESPONSE,
                "The prediction service returned an invalid response."
        );
    }

    @ExceptionHandler(NoResourceFoundException.class)
    public ResponseEntity<ApiError> notFound(NoResourceFoundException exception) {
        return httpError(exception.getStatusCode().value());
    }

    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    public ResponseEntity<ApiError> methodNotAllowed(
            HttpRequestMethodNotSupportedException exception
    ) {
        return httpError(exception.getStatusCode().value());
    }

    @ExceptionHandler({
            HttpMediaTypeNotSupportedException.class,
            HttpMediaTypeNotAcceptableException.class
    })
    public ResponseEntity<ApiError> mediaTypeError(Exception exception) {
        if (exception instanceof HttpMediaTypeNotSupportedException unsupported) {
            return httpError(unsupported.getStatusCode().value());
        }
        return httpError(HttpStatus.NOT_ACCEPTABLE.value());
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiError> unexpectedError(
            HttpServletRequest request,
            Exception exception
    ) {
        LOGGER.error(
                "request_failed method={} path={} status=500 error_type={}",
                request.getMethod(),
                request.getRequestURI(),
                exception.getClass().getSimpleName(),
                exception
        );
        return response(
                HttpStatus.INTERNAL_SERVER_ERROR,
                ErrorCode.INTERNAL_ERROR,
                "An unexpected server error occurred."
        );
    }

    private static ResponseEntity<ApiError> httpError(int status) {
        return ResponseEntity.status(status)
                .contentType(MediaType.APPLICATION_JSON)
                .body(new ApiError(
                        ErrorCode.HTTP_ERROR,
                        "The request could not be completed."
                ));
    }

    private static ResponseEntity<ApiError> response(
            HttpStatus status,
            ErrorCode errorCode,
            String message
    ) {
        return ResponseEntity.status(status)
                .contentType(MediaType.APPLICATION_JSON)
                .body(new ApiError(errorCode, message));
    }
}
