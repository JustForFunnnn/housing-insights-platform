import os
from enum import StrEnum
from pathlib import Path


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
DEFAULT_PAGE_LIMIT = 20
MAX_PAGE_LIMIT = 100
DEFAULT_PAGE_OFFSET = 0

PREDICTION_SERVICE_URL = os.getenv(
    "PREDICTION_SERVICE_URL",
    "http://localhost:8000",
)
PREDICTION_SERVICE_TIMEOUT_SECONDS = float(
    os.getenv("PREDICTION_SERVICE_TIMEOUT_SECONDS", "5")
)
ESTIMATOR_DATABASE_PATH = Path(
    os.getenv("ESTIMATOR_DATABASE_PATH", "data/estimator.db")
)

SQLITE_BUSY_TIMEOUT_MILLISECONDS = 5_000
