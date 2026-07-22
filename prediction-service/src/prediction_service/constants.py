from pathlib import Path

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

DEFAULT_ARTIFACT_PATH = Path("artifacts/model_pipeline.joblib")
MODEL_ARTIFACT_ENV = "MODEL_ARTIFACT_PATH"
REQUEST_ID_HEADER = "X-Request-ID"

MINIMUM_ROWS = 10
CV_FOLDS = 5
CV_RANDOM_STATE = 42
