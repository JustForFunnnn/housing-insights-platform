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
TARGET_TRANSFORM = "log"

MAX_PREDICTION_PROPERTIES = 20
MINIMUM_PRICE = 1
MAX_SIGNED_INT64 = 2**63 - 1

REQUEST_ID_HEADER = "X-Request-ID"

MINIMUM_ROWS = 10
CV_FOLDS = 5
CV_RANDOM_STATE = 42
