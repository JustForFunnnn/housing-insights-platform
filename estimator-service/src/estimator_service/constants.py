from enum import StrEnum


class ErrorCode(StrEnum):
    VALIDATION_ERROR = "validation_error"
    ESTIMATE_NOT_FOUND = "estimate_not_found"
    PREDICTION_SERVICE_UNAVAILABLE = "prediction_service_unavailable"
    PREDICTION_SERVICE_INVALID_RESPONSE = "prediction_service_invalid_response"
    DATABASE_UNAVAILABLE = "database_unavailable"
    HTTP_ERROR = "http_error"
    INTERNAL_ERROR = "internal_error"


REQUEST_ID_HEADER = "X-Request-ID"
MAX_ESTIMATE_PROPERTIES = 20
MAX_SIGNED_INT64 = 2**63 - 1
DEFAULT_PAGE_LIMIT = 20
MAX_PAGE_LIMIT = 100
DEFAULT_PAGE_OFFSET = 0

SQLITE_BUSY_TIMEOUT_MILLISECONDS = 5_000
