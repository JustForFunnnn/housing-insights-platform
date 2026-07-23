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
ALGORITHM_NAME = "LogTargetLinearRegression"

MAX_PREDICTION_INSTANCES = 20
MAX_SQUARE_FOOTAGE = 100000.0
MAX_BEDROOMS = 10000
MAX_BATHROOMS = 10000.0
MAX_LOT_SIZE = 100000.0
MAX_DISTANCE_TO_CITY_CENTER = 400.0
MAX_SCHOOL_RATING = 10.0
MAX_SIGNED_INT64 = 2**63 - 1

REQUEST_ID_HEADER = "X-Request-ID"

MINIMUM_ROWS = 10
CV_FOLDS = 5
CV_RANDOM_STATE = 42
