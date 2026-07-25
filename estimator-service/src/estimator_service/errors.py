from enum import StrEnum


class ErrorCode(StrEnum):
    VALIDATION_ERROR = "validation_error"
    PREDICTION_SERVICE_UNAVAILABLE = "prediction_service_unavailable"
    PREDICTION_SERVICE_INVALID_RESPONSE = "prediction_service_invalid_response"
    DATABASE_UNAVAILABLE = "database_unavailable"
    HTTP_ERROR = "http_error"
    INTERNAL_ERROR = "internal_error"


class PredictionServiceUnavailableError(RuntimeError):
    """Raised when the prediction service cannot currently serve a request."""


class PredictionServiceInvalidResponseError(RuntimeError):
    """Raised when the prediction service violates its expected contract."""


class StorageError(RuntimeError):
    """Raised when a database operation fails for an internal reason."""


class StorageUnavailableError(StorageError):
    """Raised when the database cannot currently be used."""


class PropertyMetadataError(RuntimeError):
    """Raised when property field metadata cannot be loaded safely."""
