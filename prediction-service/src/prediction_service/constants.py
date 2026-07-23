from enum import StrEnum


class ErrorCode(StrEnum):
    VALIDATION_ERROR = "validation_error"
    HTTP_ERROR = "http_error"
    INTERNAL_ERROR = "internal_error"


FEATURE_NAMES = (
    "square_footage",
    "bedrooms",
    "bathrooms",
    "year_built",
    "lot_size",
    "distance_to_city_center",
    "school_rating",
)
TARGET_NAME = "price"
REQUIRED_COLUMNS = (*FEATURE_NAMES, TARGET_NAME)
MAX_PREDICTION_INSTANCES = 20
MAX_SIGNED_INT64 = 2**63 - 1

REQUEST_ID_HEADER = "X-Request-ID"

MINIMUM_ROWS = 10
CV_FOLDS = 5
CV_RANDOM_STATE = 42
